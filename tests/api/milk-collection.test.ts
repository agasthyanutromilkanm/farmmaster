import { describe, expect, it, vi, beforeEach } from 'vitest';
import mongoose from 'mongoose';

vi.mock('@/src/database/dbConnection', () => ({
  default: vi.fn(),
}));

vi.mock('@/src/utils/authGuard', () => ({
  withAuth: vi.fn((req: any, roles: string[], handler: (...args: any[]) => any) => handler({ farmId: 'farm-123' })),
}));

vi.mock('@/src/models/Logs', () => ({
  resolveTagString: vi.fn(async (tag: string) => tag),
}));

// Setup hoisted/scoped mocks for methods
const mockLiveStockFindOne = vi.fn();
const mockMilkCollectionCreate = vi.fn();
const mockMilkCollectionFindOneAndUpdate = vi.fn();
const mockShedFindOne = vi.fn();

// Mock module-level imports
vi.mock('@/src/models/MilkCollection', () => ({
  default: {
    create: (...args: any[]) => mockMilkCollectionCreate(...args),
    findOneAndUpdate: (...args: any[]) => mockMilkCollectionFindOneAndUpdate(...args),
  }
}));

import { POST as singlePOST } from '@/app/api/milk/collections/route';
import { POST as bulkPOST } from '@/app/api/milk/collections/bulk/route';

describe('Milk Collection Date Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Directly assign mock models to mongoose.models registry
    mongoose.models.LiveStock = {
      findOne: mockLiveStockFindOne,
    } as any;

    mongoose.models.MilkCollection = {
      create: mockMilkCollectionCreate,
      findOneAndUpdate: mockMilkCollectionFindOneAndUpdate,
    } as any;

    mongoose.models.Shed = {
      findOne: mockShedFindOne,
    } as any;

    mongoose.models.Cattle = {
      findOneAndUpdate: vi.fn(),
    } as any;
  });

  it('single POST fails if collection date is before animal registration date', async () => {
    // Animal registered on 2026-07-15
    mockLiveStockFindOne.mockResolvedValue({
      _id: 'animal-123',
      tag_id: 'TAG-123',
      date: new Date('2026-07-15T00:00:00.000Z'),
    });

    // Logging collection on 2026-07-10 (before registration)
    const req = new Request('http://localhost/api/milk/collections', {
      method: 'POST',
      body: JSON.stringify({
        tagId: 'TAG-123',
        quantity: 10,
        date: '2026-07-10',
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await singlePOST(req as any);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error).toContain('registered on 2026-07-15 and cannot have logs recorded before that date');
  });

  it('single POST succeeds if collection date is on or after animal registration date', async () => {
    mockLiveStockFindOne.mockResolvedValue({
      _id: 'animal-123',
      tag_id: 'TAG-123',
      date: new Date('2026-07-15T00:00:00.000Z'),
    });

    mockMilkCollectionCreate.mockResolvedValue({
      _id: 'log-123',
      tag_id: 'TAG-123',
      quantity: 10,
      date: new Date('2026-07-16T00:00:00.000Z'),
    });

    const req = new Request('http://localhost/api/milk/collections', {
      method: 'POST',
      body: JSON.stringify({
        tagId: 'TAG-123',
        quantity: 10,
        date: '2026-07-16',
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await singlePOST(req as any);
    const body = await response.json();
    console.log("DEBUG SUCCESS TEST BODY:", body);

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
  });

  it('bulk POST skips animal if collection date is before registration date', async () => {
    mockLiveStockFindOne.mockResolvedValue({
      _id: 'animal-123',
      tag_id: 'TAG-123',
      date: new Date('2026-07-15T00:00:00.000Z'),
    });

    const req = new Request('http://localhost/api/milk/collections/bulk', {
      method: 'POST',
      body: JSON.stringify({
        date: '2026-07-10',
        session: 'MORNING',
        farmId: 'farm-123',
        shedId: 'shed-A',
        collections: [
          { tagId: 'TAG-123', quantity: 10 }
        ]
      }),
      headers: { 'content-type': 'application/json' },
    });

    const response = await bulkPOST(req as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    // Should skip upsert, so no saved records
    expect(body.data).toHaveLength(0);
    expect(mockMilkCollectionFindOneAndUpdate).not.toHaveBeenCalled();
  });
});
