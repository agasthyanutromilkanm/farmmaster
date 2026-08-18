import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/app/api/customer-app/models/Customer', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

vi.mock('@/delivery-application/models/DeliveryExecutive', () => ({
  default: {
    findOne: vi.fn(),
  },
}));

import Customer from '@/app/api/customer-app/models/Customer';
import DeliveryExecutive from '@/delivery-application/models/DeliveryExecutive';
import { POST } from '@/app/api/customer-app/auth/send-otp/route';

describe('POST /api/customer-app/auth/send-otp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(DeliveryExecutive.findOne).mockResolvedValue(null);
  });

  it('returns 400 if phone is missing', async () => {
    const req = new Request('http://localhost/api/customer-app/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('Phone number is required');
  });

  it('returns isRegistered: true if customer is not registered (to trigger auto-registration on verify)', async () => {
    vi.mocked(Customer.findOne).mockResolvedValue(null);

    const req = new Request('http://localhost/api/customer-app/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: '1234567890' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isRegistered).toBe(true);
    expect(body.data.otp).toBe('1234');
    expect(body.data.phone).toBe('1234567890');
  });

  it('sends otp and returns isRegistered: true if customer exists and is active', async () => {
    const mockSave = vi.fn();
    const mockCustRecord = {
      _id: 'customer-123',
      phone: '1234567890',
      otp: null,
      otpExpiry: null,
      status: true,
      isDeleted: false,
      save: mockSave,
    };
    vi.mocked(Customer.findOne).mockResolvedValue(mockCustRecord);

    const req = new Request('http://localhost/api/customer-app/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone: '1234567890' }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await POST(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.isRegistered).toBe(true);
    expect(body.data.otp).toBe('1234');
    expect(mockSave).toHaveBeenCalled();
  });
});
