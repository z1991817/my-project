/**
 * =====================================================
 * app.ts - Express 主入口
 * =====================================================
 * 功能：
 * - 注册 tsoa 自动生成的路由（build/routes.ts）
 * - 挂载 Swagger UI（/docs）
 * - 配置中间件（CORS、morgan、body-parser、静态资源）
 * - 统一错误处理
 * =====================================================
 */

// 加载环境变量（必须在最前面）
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envCandidates = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '..', '.env'),
];

const envPath = envCandidates.find((candidate) => fs.existsSync(candidate));
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

import 'reflect-metadata';
import express, { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { RegisterRoutes } from '../build/routes';

const app = express();
const publicCandidates = [
  path.join(__dirname, '..', 'public'),
  path.join(__dirname, '..', '..', 'public'),
];
const publicDir = publicCandidates.find((candidate) => fs.existsSync(candidate)) || publicCandidates[0];
const swaggerCandidates = [
  path.join(publicDir, 'swagger', 'swagger.json'),
  path.join(__dirname, '..', 'public', 'swagger', 'swagger.json'),
];
const swaggerPath = swaggerCandidates.find((candidate) => fs.existsSync(candidate));

// ========== 中间件 ==========

// CORS
app.use(cors());

// 日志
app.use(morgan('dev'));

// 请求体解析
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// 全局超时：10分钟（适配图片生成等长耗时操作）
app.use((_req: Request, res: Response, next: NextFunction) => {
  _req.setTimeout(600000);
  res.setTimeout(600000);
  next();
});

// 静态资源
app.use(express.static(publicDir));

// ========== Swagger UI ==========
try {
  if (!swaggerPath) throw new Error('swagger.json not found');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const swaggerDocument = require(swaggerPath);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true, // 保持鉴权状态，方便调试
    },
  }));
  console.log('[Swagger] 文档已挂载: http://localhost:3000/docs');
} catch (_) {
  console.warn('[Swagger] swagger.json 未找到，请先运行 npm run build:routes');
}

// ========== tsoa 生成路由 ==========
RegisterRoutes(app);

// ========== 404 处理 ==========
app.use((_req: Request, res: Response) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

// ========== 全局错误处理 ==========
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const status: number = err.status || err.statusCode || 500;
  const message: string = err.message || '服务器内部错误';

  if (status >= 500) {
    console.error('[Error]', err);
  }

  // tsoa 参数验证错误
  if (err.name === 'ValidateError') {
    return res.status(422).json({
      code: 422,
      message: '请求参数验证失败',
      fields: err.fields,
    });
  }

  return res.status(status).json({ code: status, message });
});

export default app;
