import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/src/database/dbConnection';
import Customer from '../models/Customer';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { verifyAccessToken } from '@/src/utils/jwt';
import { successResponse, errorResponse, unauthorizedResponse, createdResponse } from '@/src/utils/responses';

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

export async function GET(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    let cart: any = await Cart.findOne({ customerId: customer._id });
    if (!cart) {
      cart = await Cart.create({ customerId: customer._id, items: [] });
    }

    // Populate product details for items if available
    const productIds = cart.items.map((item: any) => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    const populatedItems = cart.items.map((item: any) => {
      const prod = productMap.get(item.productId);
      return {
        _id: item._id,
        productId: item.productId,
        quantity: item.quantity,
        price: prod ? prod.price : item.price,
        addedAt: item.addedAt,
        product: prod ? {
          name: prod.name,
          image: prod.image,
          price: prod.price,
          size: prod.size,
          sku: prod.sku,
          categoryName: prod.categoryName,
        } : null,
      };
    });

    const totalItems = populatedItems.reduce((acc: number, item: any) => acc + item.quantity, 0);
    const totalPrice = populatedItems.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0);

    return successResponse(
      {
        _id: cart._id,
        customerId: cart.customerId,
        items: populatedItems,
        totalItems,
        totalPrice,
        updatedAt: cart.updatedAt,
      },
      'Cart retrieved successfully'
    );
  } catch (error: any) {
    console.error('[GET /api/customer-app/cart] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const { productId, quantity = 1, price } = body;
    if (!productId) {
      return errorResponse('productId is required', 400);
    }

    const qtyNumber = Number(quantity);
    if (isNaN(qtyNumber) || qtyNumber < 1) {
      return errorResponse('quantity must be a positive number', 400);
    }

    // Get item price if product exists
    let itemPrice = price || 0;
    if (!itemPrice) {
      const product = await Product.findById(productId);
      if (product) {
        itemPrice = product.price;
      }
    }

    let cart: any = await Cart.findOne({ customerId: customer._id });
    if (!cart) {
      cart = new Cart({
        customerId: customer._id,
        items: [{ productId, quantity: qtyNumber, price: itemPrice, addedAt: new Date() }],
      });
    } else {
      const existingItemIndex = cart.items.findIndex((item: any) => item.productId === productId);
      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += qtyNumber;
        if (itemPrice) {
          cart.items[existingItemIndex].price = itemPrice;
        }
      } else {
        cart.items.push({ productId, quantity: qtyNumber, price: itemPrice, addedAt: new Date() });
      }
    }

    await cart.save();
    return createdResponse(cart, 'Item added to cart successfully');
  } catch (error: any) {
    console.error('[POST /api/customer-app/cart] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const cart: any = await Cart.findOne({ customerId: customer._id });
    if (!cart) {
      return errorResponse('Cart not found', 404);
    }

    const { productId, quantity, items } = body;

    // Batch update items
    if (Array.isArray(items)) {
      cart.items = items.map((item: any) => ({
        productId: item.productId,
        quantity: Math.max(1, Number(item.quantity) || 1),
        price: Number(item.price) || 0,
        addedAt: item.addedAt || new Date(),
      })) as any;
    } else if (productId) {
      const qtyNumber = Number(quantity);
      if (isNaN(qtyNumber)) {
        return errorResponse('quantity must be a valid number', 400);
      }

      if (qtyNumber <= 0) {
        cart.items = cart.items.filter((item: any) => item.productId !== productId);
      } else {
        const itemIndex = cart.items.findIndex((item: any) => item.productId === productId);
        if (itemIndex > -1) {
          cart.items[itemIndex].quantity = qtyNumber;
        } else {
          return errorResponse('Product not found in cart', 404);
        }
      }
    } else {
      return errorResponse('productId or items array required', 400);
    }

    await cart.save();
    return successResponse(cart, 'Cart updated successfully');
  } catch (error: any) {
    console.error('[PUT /api/customer-app/cart] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const customer = await getCustomerFromRequest(req);
    if (!customer) {
      return unauthorizedResponse('Invalid or expired token');
    }

    const url = new URL(req.url);
    const productId = url.searchParams.get('productId');

    const cart: any = await Cart.findOne({ customerId: customer._id });
    if (!cart) {
      return errorResponse('Cart not found', 404);
    }

    if (productId) {
      cart.items = cart.items.filter((item: any) => item.productId !== productId);
      await cart.save();
      return successResponse(cart, 'Item removed from cart');
    } else {
      cart.items = [];
      await cart.save();
      return successResponse(cart, 'Cart cleared successfully');
    }
  } catch (error: any) {
    console.error('[DELETE /api/customer-app/cart] error:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
