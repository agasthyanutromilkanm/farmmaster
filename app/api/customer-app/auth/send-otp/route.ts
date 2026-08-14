import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Customer from '../../models/Customer';
import DeliveryExecutive from '@/delivery-application/models/DeliveryExecutive';
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
    if (!phone) {
      return errorResponse('Phone number is required', 400);
    }

    await dbConnect();

    const cleanPhone = phone.replace(/^(\+91|0)/, '').replace(/\D/g, '');
    const universalOtp = '1234';
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    // Check Delivery Executive first
    let executive = await DeliveryExecutive.findOne({
      $or: [
        { phone: phone },
        { phone: cleanPhone },
        { phone: `+91${cleanPhone}` }
      ]
    });

    if (executive) {
      if (executive.status === 'inactive') {
        return errorResponse('Account is disabled', 403);
      }
      executive.otp = universalOtp;
      executive.otpExpiry = otpExpiry;
      await executive.save();

      return successResponse(
        { phone: executive.phone, otp: universalOtp, isRegistered: true, role: 'DELIVERY_EXECUTIVE' },
        'OTP sent successfully (universal testing OTP is 1234)'
      );
    }

    // Check Customer
    let customer = await Customer.findOne({
      $or: [
        { phone: phone },
        { phone: cleanPhone },
        { phone: `+91${cleanPhone}` }
      ]
    });

    if (customer && !customer.isDeleted) {
      if (customer.status === false) {
        return errorResponse('Account is disabled', 403);
      }
      customer.otp = universalOtp;
      customer.otpExpiry = otpExpiry;
      await customer.save();

      return successResponse(
        { phone: customer.phone, otp: universalOtp, isRegistered: true, role: 'CUSTOMER' },
        'OTP sent successfully (universal testing OTP is 1234)'
      );
    }

    // New number - return isRegistered: true with universal OTP so verification creates/logs in
    return successResponse(
      { phone, otp: universalOtp, isRegistered: true },
      'OTP sent successfully (universal testing OTP is 1234)'
    );
  } catch (error: any) {
    console.error('[POST /api/customer-app/auth/send-otp] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

