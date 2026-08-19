import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Customer from '../../models/Customer';
import DeliveryExecutive from '@/delivery-application/models/DeliveryExecutive';
import { generateAccessToken, generateRefreshToken } from '@/src/utils/jwt';
import { successResponse, errorResponse } from '@/src/utils/responses';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const phone = body?.phone ? String(body.phone).trim() : '';
    const otp = body?.otp ? String(body.otp).trim() : '';

    if (!phone) {
      return errorResponse('Phone number is required', 400);
    }
    if (!otp) {
      return errorResponse('OTP code is required', 400);
    }

    await dbConnect();

    const cleanPhone = phone.replace(/^(\+91|0)/, '').replace(/\D/g, '');
    const isUniversalOtp = otp === '1234';
    const requestedRole = body?.role === 'DELIVERY_EXECUTIVE' ? 'DELIVERY_EXECUTIVE' : 'CUSTOMER';

    // ==========================================
    // 1. DELIVERY EXECUTIVE LOGIN FLOW
    // ==========================================
    if (requestedRole === 'DELIVERY_EXECUTIVE') {
      let executive = await DeliveryExecutive.findOne({
        $or: [ { phone: phone }, { phone: cleanPhone }, { phone: `+91${cleanPhone}` } ]
      });

      if (!executive) {
        if (isUniversalOtp) {
          // Auto-create DeliveryExecutive & Customer if they don't exist
          let customer = await Customer.findOne({ $or: [ { phone: phone }, { phone: cleanPhone }, { phone: `+91${cleanPhone}` } ] });
          if (!customer) {
            customer = await Customer.create({
              phone: cleanPhone || phone,
              name: 'User ' + (cleanPhone || phone).slice(-4),
              status: true,
              isDeleted: false,
            });
          }
          executive = await DeliveryExecutive.create({
            name: customer.name,
            phone: customer.phone,
            email: '',
            password: 'password123',
            vehicleType: 'Bike',
            vehicleNumber: '',
            status: 'active',
          });
        } else {
          return errorResponse('Delivery Executive record not found.', 404);
        }
      }

      if (executive.status === 'inactive') {
        return errorResponse('Account is disabled', 403);
      }
      if (!isUniversalOtp && executive.otp !== otp) {
        return errorResponse('Invalid OTP code', 400);
      }
      if (!isUniversalOtp && (!executive.otpExpiry || executive.otpExpiry < new Date())) {
        return errorResponse('OTP code has expired', 400);
      }
      if (!isUniversalOtp) {
        executive.otp = null;
        executive.otpExpiry = null;
        await executive.save();
      }

      const payload = {
        userId: executive._id.toString(),
        email: executive.email || executive.phone,
        role: 'DELIVERY_EXECUTIVE',
        permissions: ['DELIVERY_EXECUTIVE'],
      };

      return successResponse({
        token: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
        isRegistered: true,
        user: {
          id: executive._id,
          name: executive.name,
          phone: executive.phone,
          mobile: executive.phone,
          email: executive.email || '',
          vehicleType: executive.vehicleType || 'Bike',
          vehicleNumber: executive.vehicleNumber || '',
          role: 'DELIVERY_EXECUTIVE',
        },
      }, 'Login successful');
    }

    // ==========================================
    // 2. CUSTOMER LOGIN FLOW (Default)
    // ==========================================
    let customer = await Customer.findOne({
      $or: [ { phone: phone }, { phone: cleanPhone }, { phone: `+91${cleanPhone}` } ]
    });

    if (!customer || customer.isDeleted) {
      if (isUniversalOtp) {
        if (customer && customer.isDeleted) {
          customer.isDeleted = false;
          customer.status = true;
          customer.name = customer.name || '';
          await customer.save();
        } else {
          customer = await Customer.create({
            phone: cleanPhone || phone,
            name: 'User ' + (cleanPhone || phone).slice(-4),
            status: true,
            isDeleted: false,
          });
          
          // Silently create executive too so they can test both apps
          const execExists = await DeliveryExecutive.findOne({ phone: customer.phone });
          if (!execExists) {
            await DeliveryExecutive.create({
              name: customer.name,
              phone: customer.phone,
              email: '',
              password: 'password123',
              vehicleType: 'Bike',
              vehicleNumber: '',
              status: 'active',
            });
          }
        }
      } else {
        return errorResponse('Customer record not found. Please request OTP first.', 404);
      }
    }

    if (customer && customer.status === false) {
      return errorResponse('Account is disabled', 403);
    }
    if (!isUniversalOtp && customer && customer.otp !== otp) {
      return errorResponse('Invalid OTP code', 400);
    }
    if (!isUniversalOtp && customer && (!customer.otpExpiry || customer.otpExpiry < new Date())) {
      return errorResponse('OTP code has expired', 400);
    }
    if (!isUniversalOtp && customer) {
      customer.otp = null;
      customer.otpExpiry = null;
      await customer.save();
    }

    const payload = {
      userId: customer._id.toString(),
      email: customer.phone,
      role: 'CUSTOMER',
      permissions: ['CUSTOMER'],
    };

    return successResponse({
      token: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
      isRegistered: true,
      user: {
        id: customer._id.toString(),
        phone: customer.phone,
        mobile: customer.phone,
        name: customer.name,
        email: customer.email || '',
        role: 'CUSTOMER',
      },
    }, 'Login successful');
  } catch (error: any) {
    console.error('[POST /api/customer-app/auth/verify-otp] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

