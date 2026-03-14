# 文生图接口测试指南

## 功能概述

已为 `/app/text-to-image` 接口添加完整的用户认证和对话记录功能。

## 测试用户信息

- **用户名**: 测试
- **密码**: 123456
- **用户ID**: 1
- **邮箱**: test@example.com

## JWT Token（7天有效）

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiLmtYvor5UiLCJuaWNrbmFtZSI6Iua1i-ivleeUqOaItyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTc3MzM5NzczMSwiZXhwIjoxNzc0MDAyNTMxfQ.TMLdae8DWMRUuu2EPOHeAUoXNWqV-Lf-C9X8erwdRgU
```

## 测试步骤

### 1. 用户登录

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "username": "测试",
  "password": "123456"
}
```

**响应示例：**
```json
{
  "success": true,
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "测试",
      "nickname": "测试用户",
      "email": "test@example.com",
      "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=test"
    }
  }
}
```

### 2. 获取当前用户信息

```bash
GET http://localhost:3000/api/auth/me
Authorization: Bearer <token>
```

### 3. 生成图片（文生图）

```bash
POST http://localhost:3000/app/text-to-image
Authorization: Bearer <token>
Content-Type: application/json

{
  "prompt": "一只可爱的猫咪",
  "size": "1024x1024",
  "quality": "high",
  "style": "natural"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "成功",
  "timestamp": "2026-03-13T10:30:00.000Z",
  "data": {
    "recordId": 1,
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "thirdPartyUrl": "https://...",
    "thirdPartyResponse": {...},
    "upload": {
      "taskId": "abc123",
      "status": "pending",
      "queryPath": "/app/text-to-image/tasks/abc123"
    }
  }
}
```

### 4. 查询上传任务状态

```bash
GET http://localhost:3000/app/text-to-image/tasks/<taskId>
```

### 5. 查询用户的生成历史

```bash
GET http://localhost:3000/app/text-to-image/records?page=1&limit=10
Authorization: Bearer <token>
```

**可选参数：**
- `generation_type`: 筛选类型（text-to-image / image-to-image）
- `page`: 页码（默认1）
- `limit`: 每页数量（默认10）

**响应示例：**
```json
{
  "success": true,
  "code": 200,
  "data": {
    "total": 5,
    "page": 1,
    "limit": 10,
    "data": [
      {
        "id": 1,
        "session_id": "550e8400-e29b-41d4-a716-446655440000",
        "user_id": 1,
        "generation_type": "text-to-image",
        "prompt": "一只可爱的猫咪",
        "model": "gpt-image-1.5-all",
        "size": "1024x1024",
        "quality": "high",
        "style": "natural",
        "third_party_url": "https://...",
        "cos_url": "https://...",
        "status": "uploaded",
        "created_at": "2026-03-13T10:30:00.000Z"
      }
    ]
  }
}
```

### 6. 根据 session_id 查询单条记录

```bash
GET http://localhost:3000/app/text-to-image/records/<sessionId>
Authorization: Bearer <token>
```

## 数据库表结构

### users 表
- 存储普通用户信息
- 支持用户名、邮箱、手机号登录

### image_generation_records 表
- 存储图片生成记录
- 支持文生图、图生图等多种类型
- 关联用户ID和上传任务ID

## 状态流转

1. **pending**: 图片生成成功，等待上传到 COS
2. **uploaded**: 已成功上传到 COS
3. **failed**: 上传失败

## 注意事项

1. 所有需要认证的接口都需要在 Header 中携带 Token
2. Token 格式：`Authorization: Bearer <token>`
3. Token 有效期为 7 天
4. 生成记录会在 30 天后自动清理
5. 上传完成后会自动更新记录的 `cos_url` 和 `status`

## 文件清单

**新建文件：**
- `sql/users.sql` - 用户表 SQL
- `sql/image_generation_records.sql` - 生成记录表 SQL
- `models/user.js` - 用户 Model
- `models/imageGenerationRecord.js` - 生成记录 Model
- `controllers/authController.js` - 认证控制器
- `middleware/userAuth.js` - 用户认证中间件
- `routes/auth.js` - 认证路由
- `scripts/createUsersTable.js` - 创建用户表脚本
- `scripts/createImageGenerationRecordsTable.js` - 创建记录表脚本
- `scripts/generateTestToken.js` - 生成测试 Token 脚本

**修改文件：**
- `controllers/textToImage.js` - 添加认证和记录创建逻辑
- `services/openai.js` - 添加上传完成回调
- `app/index.js` - 添加认证中间件和查询路由
- `app.js` - 注册认证路由
