import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/app/api/customer-app/models/Customer', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock('@/src/utils/jwt', () => ({
  generateAccessToken: vi.fn(() => 'access-token'),
  generateRefreshToken: vi.fn(() => 'refresh-token'),
}));

vi.mock('@/delivery-application/models/DeliveryExecutive', () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
  },
}));

import Customer from '@/app/api/customer-app/models/Customer';
import DeliveryExecutive from '@/delivery-application/models/DeliveryExecutive';
import { POST } from '@/app/api/customer-app/auth/verify-otp/route';

describe('POST /api/customer-app/auth/verify-otp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(DeliveryExecutive.findOne).mockResolvedValue(null);
  });

  it('verifies successfully with the universal OTP 1234 even if database otp is different/null', async () => {
    const mockCustRecord = {
      _id: 'customer-123',
      phone: '1234567890',
      otp: '9999', // Database has 9999
      otpExpiry: new Date(Date.now() - 1000), // Database OTP is expired
      status: true,
      isDeleted: false,
    };
    vi.mocked(Customer.findOne).mockResolvedValue(mockCustRecord);

    const req = new Request('http://localhost/api/customer-app/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: '1234567890', otp: '1234' }), // Verifying with universal OTP
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.token).toBe('access-token');
    expect(body.data.user.id).toBe('customer-123');
  });

  it('fails verification if database otp is different and not using universal OTP 1234', async () => {
    const mockCustRecord = {
      _id: 'customer-123',
      phone: '1234567890',
      otp: '9999',
      otpExpiry: new Date(Date.now() + 5 * 60 * 1000),
      status: true,
      isDeleted: false,
    };
    vi.mocked(Customer.findOne).mockResolvedValue(mockCustRecord);

    const req = new Request('http://localhost/api/customer-app/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: '1234567890', otp: '5555' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Invalid OTP code');
  });

  it('automatically registers and logs in unregistered customer when using universal OTP 1234', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(null);
    vi.mocked(Customer.create).mockResolvedValue({
      _id: 'auto-registered-123',
      phone: '1234567890',
      name: '',
      status: true,
      isDeleted: false,
    });

    const req = new Request('http://localhost/api/customer-app/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: '1234567890', otp: '1234' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.token).toBe('access-token');
    expect(body.data.user.id).toBe('auto-registered-123');
    expect(Customer.create).toHaveBeenCalledWith({
      phone: '1234567890',
      name: 'User 7890',
      status: true,
      isDeleted: false,
    });
  });
});
