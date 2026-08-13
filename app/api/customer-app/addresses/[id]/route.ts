import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/src/database/dbConnection';
import Customer from '@/app/api/customer-app/models/Customer';
import Address from '@/app/api/customer-app/models/Address';
import { verifyAccessToken } from '@/src/utils/jwt';
import { successResponse, errorResponse, unauthorizedResponse } from '@/src/utils/responses';

async function getCustomerFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);
  if (!payload || !payload.userId) {
    return null;
  }
  
  await dbConnect();
  const customer = await Customer.findById(payload.userId);
  if (!customer || customer.isDeleted === true || customer.status === false) {
    return null;
  }
  
  return customer;
}

import {
  getAddressById,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '@/delivery-application/controllers/addresses';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return getAddressById(req, { params: resolvedParams });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return updateAddress(req, { params: resolvedParams });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return deleteAddress(req, { params: resolvedParams });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return setDefaultAddress(req, { params: resolvedParams });
}
