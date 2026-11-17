import { getModelToken } from '@nestjs/mongoose';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Model } from 'mongoose';
import request from 'supertest';
import {
  clearDatabase,
  closeTestApp,
  createTestApp,
} from './e2e/create-test-app.js';
import { canTransition } from '../src/batches/batch-transitions.js';
import {
  BATCH_MAX_WEIGHT_BELOW_CURRENT,
  BATCH_TRANSITION_NOT_ALLOWED,
} from '../src/batches/batches.constants.js';
import { BatchStatus } from '../src/batches/enums/batch-status.enum.js';
import { Batch } from '../src/batches/schemas/batch.schema.js';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const CONCURRENT_REQUESTS = 10;

describe('Batches (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await clearDatabase(app);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  async function createBatch(): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/batches')
      .send({
        name: 'Test batch',
        maxWeightGrams: 10_000,
        orderDeadline: new Date(Date.now() + ONE_WEEK_MS).toISOString(),
      })
      .expect(201);
    return response.body.id as string;
  }

  function transitionBatch(id: string, status: BatchStatus) {
    return request(app.getHttpServer())
      .post(`/batches/${id}/transition`)
      .send({ status });
  }

  function patchBatch(id: string, body: Record<string, unknown>) {
    return request(app.getHttpServer()).patch(`/batches/${id}`).send(body);
  }

  // No route sets the current weight yet (orders come later): write it
  // directly so the capacity filter has something to compare against.
  async function setCurrentWeight(id: string, grams: number): Promise<void> {
    const batchModel = app.get<Model<Batch>>(getModelToken(Batch.name));
    await batchModel.updateOne({ _id: id }, { currentWeightGrams: grams });
  }

  describe('PATCH /batches/:id', () => {
    it('rejects currentWeightGrams with 400 and leaves the batch unchanged', async () => {
      const id = await createBatch();

      const response = await patchBatch(id, { currentWeightGrams: 5_000 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'property currentWeightGrams should not exist',
      );

      const batch = await request(app.getHttpServer())
        .get(`/batches/${id}`)
        .expect(200);
      expect(batch.body.currentWeightGrams).toBe(0);
    });

    it('accepts maxWeightGrams equal to the current weight', async () => {
      const id = await createBatch();
      await setCurrentWeight(id, 3_000);

      const response = await patchBatch(id, { maxWeightGrams: 3_000 });

      expect(response.status).toBe(200);
      expect(response.body.maxWeightGrams).toBe(3_000);
    });

    it('rejects maxWeightGrams below the current weight with 409', async () => {
      const id = await createBatch();
      await setCurrentWeight(id, 3_000);

      const response = await patchBatch(id, { maxWeightGrams: 2_999 });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe(BATCH_MAX_WEIGHT_BELOW_CURRENT);
    });
  });

  describe('POST /batches/:id/transition', () => {
    it('lets exactly one of concurrent transitions out of closed succeed', async () => {
      // The race needs two targets valid from closed and not from each other.
      // If the transition table changes, this test must pick new targets.
      expect(canTransition(BatchStatus.Closed, BatchStatus.Open)).toBe(true);
      expect(canTransition(BatchStatus.Closed, BatchStatus.Shipped)).toBe(true);
      expect(canTransition(BatchStatus.Open, BatchStatus.Shipped)).toBe(false);
      expect(canTransition(BatchStatus.Shipped, BatchStatus.Open)).toBe(false);

      const id = await createBatch();
      await transitionBatch(id, BatchStatus.Open).expect(200);
      await transitionBatch(id, BatchStatus.Closed).expect(200);

      // Both targets are valid from closed, and neither is valid from the
      // other: only an atomic check-and-write lets exactly one through.
      const responses = await Promise.all(
        Array.from({ length: CONCURRENT_REQUESTS }, (_, i) =>
          transitionBatch(
            id,
            i % 2 === 0 ? BatchStatus.Open : BatchStatus.Shipped,
          ),
        ),
      );

      // Compare plain status codes, so a failure prints e.g. [200, 200, 409…].
      const statuses = responses.map((r) => r.status).toSorted((a, b) => a - b);
      expect(statuses).toEqual([
        200,
        ...Array<number>(CONCURRENT_REQUESTS - 1).fill(409),
      ]);

      for (const conflict of responses.filter((r) => r.status === 409)) {
        expect(conflict.body.message).toBe(BATCH_TRANSITION_NOT_ALLOWED);
      }

      const winner = responses.find((r) => r.status === 200);
      const batch = await request(app.getHttpServer())
        .get(`/batches/${id}`)
        .expect(200);
      expect(batch.body.status).toBe(winner?.body.status);
    });
  });
});
