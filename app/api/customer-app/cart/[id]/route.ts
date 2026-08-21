import { NextRequest } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Customer from '../../models/Customer';
import Cart from '../../models/Cart';
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const { id: productId } = await params;
    
    const cart: any = await Cart.findOne({ customerId: customer._id });
    if (!cart) {
      return errorResponse('Cart not found', 404);
    }

    const initialCount = cart.items.length;
    cart.items = cart.items.filter((item: any) => item.productId !== productId);

    if (cart.items.length === initialCount) {
      return errorResponse('Item not found in cart', 404);
    }

    await cart.save();
    return successResponse(cart, 'Item removed from cart successfully');
  } catch (error: any) {
    console.error('[DELETE /api/customer-app/cart/[id]] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
