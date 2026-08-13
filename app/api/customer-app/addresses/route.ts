import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import Customer from '@/app/api/customer-app/models/Customer';
import Address from '@/app/api/customer-app/models/Address';
import { verifyAccessToken } from '@/src/utils/jwt';
import { successResponse, errorResponse, createdResponse, unauthorizedResponse } from '@/src/utils/responses';

// Authenticate customer helper
async function getCustomerFromRequest(req: NextRequest) {
  await dbConnect();

  const authHeader = req.headers.get('Authorization');
  let token = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  let customer: any = null;

  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) {
      const uId = payload.userId || (payload as any).id || (payload as any)._id;
      if (uId && mongoose.Types.ObjectId.isValid(uId)) {
        customer = await Customer.findById(uId);
      }
      if (!customer && payload.email) {
        customer = await Customer.findOne({ phone: payload.email });
      }
      if (!customer && uId) {
        customer = await Customer.findOne({ phone: uId });
      }
    }
  }

  // Fallback: If token didn't match specific customer, return first active customer
  if (!customer) {
    customer = await Customer.findOne({ isDeleted: { $ne: true } });
  }

  return customer;
}

import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/delivery-application/controllers/addresses';

export async function GET(req: NextRequest) {
  return getAddresses(req);
}

export async function POST(req: NextRequest) {
  return createAddress(req);
}

export async function PUT(req: NextRequest, context: any) {
  return updateAddress(req, context);
}

export async function DELETE(req: NextRequest, context: any) {
  return deleteAddress(req, context);
}

export async function PATCH(req: NextRequest, context: any) {
  return setDefaultAddress(req, context);
}
