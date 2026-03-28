import User from '../models/user';
import AIModel, { AIModelRecord } from '../models/aiModel';

export class PointsError extends Error {
  statusCode: number;
  code: string;
  data?: Record<string, any>;

  constructor(message: string, statusCode = 400, code = 'POINTS_ERROR', data?: Record<string, any>) {
    super(message);
    this.name = 'PointsError';
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
  }
}

export interface PointsReservation {
  userId: number;
  modelId: number;
  modelName: string;
  unitPoints: number;
  totalPoints: number;
  quantity: number;
  reservedAt: string;
  confirmed: boolean;
  released: boolean;
}

function normalizeQuantity(quantity?: number): number {
  const normalized = Number(quantity);
  if (!Number.isFinite(normalized) || normalized <= 0) return 1;
  return Math.max(1, Math.floor(normalized));
}

async function resolveChargeableModel(modelName: string): Promise<AIModelRecord> {
  const model = await AIModel.findActiveByNameOrKey(modelName);
  if (!model) {
    throw new PointsError('模型不存在或未启用', 404, 'MODEL_NOT_FOUND', { model: modelName });
  }
  return model;
}

export async function reservePointsForImageGeneration(options: {
  userId: number;
  modelName: string;
  quantity?: number;
}): Promise<PointsReservation> {
  const userId = Number(options.userId);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new PointsError('用户未登录', 401, 'USER_NOT_FOUND');
  }

  const model = await resolveChargeableModel(options.modelName);
  const quantity = normalizeQuantity(options.quantity);
  const unitPoints = Number(model.consume_points) || 0;
  const totalPoints = unitPoints * quantity;

  if (totalPoints <= 0) {
    return {
      userId,
      modelId: model.id,
      modelName: model.model_key || model.name,
      unitPoints,
      totalPoints: 0,
      quantity,
      reservedAt: new Date().toISOString(),
      confirmed: true,
      released: false,
    };
  }

  const currentPoints = await User.getPointsById(userId);
  if (currentPoints === null) {
    throw new PointsError('用户不存在或已禁用', 404, 'USER_NOT_FOUND');
  }

  if (currentPoints < totalPoints) {
    throw new PointsError('积分不足', 409, 'INSUFFICIENT_POINTS', {
      model: model.model_key || model.name,
      requiredPoints: totalPoints,
      currentPoints,
    });
  }

  const reserved = await User.reservePointsIfEnough(userId, totalPoints);
  if (!reserved) {
    const latestPoints = await User.getPointsById(userId);
    throw new PointsError('积分不足', 409, 'INSUFFICIENT_POINTS', {
      model: model.model_key || model.name,
      requiredPoints: totalPoints,
      currentPoints: latestPoints ?? 0,
    });
  }

  return {
    userId,
    modelId: model.id,
    modelName: model.model_key || model.name,
    unitPoints,
    totalPoints,
    quantity,
    reservedAt: new Date().toISOString(),
    confirmed: false,
    released: false,
  };
}

export function confirmReservedPoints(reservation?: PointsReservation | null, extra: Record<string, any> = {}): void {
  if (!reservation || reservation.confirmed || reservation.released) return;
  reservation.confirmed = true;
  console.log(
    '[Points] confirm reservation userId=%d model=%s points=%d extra=%s',
    reservation.userId,
    reservation.modelName,
    reservation.totalPoints,
    JSON.stringify(extra)
  );
}

export async function releaseReservedPoints(reservation?: PointsReservation | null, reason = 'unknown'): Promise<void> {
  if (!reservation || reservation.confirmed || reservation.released || reservation.totalPoints <= 0) return;
  await User.addPoints(reservation.userId, reservation.totalPoints);
  reservation.released = true;
  console.log(
    '[Points] release reservation userId=%d model=%s points=%d reason=%s',
    reservation.userId,
    reservation.modelName,
    reservation.totalPoints,
    reason
  );
}

export function buildPointsErrorResponse(error: unknown) {
  if (error instanceof PointsError) {
    return {
      statusCode: error.statusCode,
      body: {
        success: false,
        code: error.statusCode,
        message: error.message,
        data: error.data,
      },
    };
  }
  return null;
}
