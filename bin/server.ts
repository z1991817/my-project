#!/usr/bin/env node
/**
 * =====================================================
 * server.ts - HTTP 服务器启动入口
 * =====================================================
 */

import http from 'http';
import app from '../src/app';

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

// 超时配置（10分钟，适配图片生成等长耗时操作）
server.timeout = 600000;
server.keepAliveTimeout = 610000;
server.headersTimeout = 620000;

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

function normalizePort(val: string): number | string | boolean {
  const portNum = parseInt(val, 10);
  if (isNaN(portNum)) return val;
  if (portNum >= 0) return portNum;
  return false;
}

function onError(error: NodeJS.ErrnoException): void {
  if (error.syscall !== 'listen') throw error;
  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function onListening(): void {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr?.port}`;
  console.log(`Server running at http://localhost:${typeof port === 'number' ? port : bind}`);
}
