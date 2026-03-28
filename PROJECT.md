# artImg Pro - AI 图片处理工具服务端

## 项目概述

**项目名称**：artImg Pro - AI 图片处理工具服务端
**当前版本**：v0.0.1
**项目状态**：生产环境运行中，持续开发新功能
**业务目标**：为用户提供方便便利的 AI 图片处理工具
**核心价值**：简单易用、实时协作、数据安全

## 技术栈

### 后端框架
- **Node.js** + **Express 4.16** + **TypeScript 5.6**
- **tsoa** - 基于装饰器的路由生成 + OpenAPI/Swagger 文档自动生成
- **MySQL 2** - 数据库连接池
- **Redis (ioredis)** - 验证码缓存、频率限制
- **dotenv** - 环境变量管理

### 核心依赖
- **OpenAI SDK** - AI 图片生成与分析
- **@google/genai** - Google AI 服务集成
- **JWT (jsonwebtoken)** - 用户认证
- **bcryptjs** - 密码加密
- **multer** - 文件上传处理
- **sharp** - 图片压缩与处理
- **axios** - HTTP 请求（通过 externalHttpClient 封装）
- **cors** - 跨域支持
- **cos-nodejs-sdk-v5** - 腾讯云对象存储
- **swagger-ui-express** - API 文档 UI（/docs）
- **nodemailer** - 邮件发送（验证码等）

### 开发工具
- **nodemon** - 开发环境热重载
- **ts-node** - TypeScript 直接运行

## 项目结构

```
my-project/
├── bin/
│   └── server.ts               # HTTP 服务启动入口
├── build/
│   └── routes.ts               # tsoa 自动生成的路由（勿手动修改）
├── src/                         # 源代码主目录
│   ├── app.ts                  # Express 应用主入口
│   ├── config/
│   │   ├── db.ts               # MySQL 连接池配置
│   │   └── redis.ts            # Redis 连接配置
│   ├── controllers/            # tsoa 控制器（装饰器定义路由）
│   │   ├── AdminController.ts        # 管理员认证
│   │   ├── AuthController.ts         # 用户认证（登录/注册/验证码）
│   │   ├── BananaTextToImageController.ts  # Banana 文生图/图生图
│   │   ├── CategoryController.ts     # 分类管理
│   │   ├── GalleryController.ts      # 画廊/作品展示
│   │   ├── ImageController.ts        # 图片管理
│   │   ├── OpenaiController.ts       # OpenAI 图片生成与分析
│   │   └── TextToImageController.ts  # 第三方文生图
│   ├── middleware/
│   │   ├── auth.ts             # JWT 认证中间件（管理员）
│   │   ├── authentication.ts   # tsoa 认证处理（jwt/adminJwt）
│   │   ├── cosUpload.ts        # 腾讯云 COS 上传
│   │   ├── upload.ts           # 本地文件上传（multer）
│   │   └── userAuth.ts         # 用户 JWT 认证中间件
│   ├── models/                 # 数据模型层（MySQL CRUD 封装）
│   │   ├── adminUser.ts        # 管理员用户模型
│   │   ├── category.ts         # 分类模型
│   │   ├── conversation.ts     # 对话模型
│   │   ├── image.ts            # 图片模型
│   │   ├── imageGenerationRecord.ts  # 图片生成记录
│   │   └── user.ts             # 普通用户模型
│   ├── services/               # 服务层（第三方 API 封装）
│   │   ├── bananaImage.ts      # Banana AI 图片生成服务
│   │   ├── email.ts            # 邮件发送服务
│   │   ├── openai.ts           # OpenAI 服务封装
│   │   ├── thirdPartyImage.ts  # 第三方图片服务
│   │   └── verificationCode.ts # 验证码服务
│   ├── types/
│   │   ├── express.d.ts        # Express 类型扩展
│   │   ├── index.ts            # 公共类型定义
│   │   └── response.ts         # 响应类型定义
│   └── utils/
│       ├── httpClient.ts       # HTTP 客户端（proxy: false）
│       └── logger.ts           # 日志工具
├── public/
│   └── swagger/
│       └── swagger.json        # tsoa 自动生成的 OpenAPI 文档
├── scripts/                    # 数据库迁移/工具脚本
├── sql/                        # 数据库初始化 SQL
├── docs/                       # 功能文档
├── test/                       # 测试文件
├── .env                        # 环境变量（不提交）
├── .env.example                # 环境变量模板
├── tsconfig.json               # TypeScript 配置
├── tsoa.json                   # tsoa 路由/Swagger 生成配置
├── package.json                # 项目依赖
├── CLAUDE.md                   # Claude AI 开发指令
├── API.md                      # API 接口文档
└── PROJECT.md                  # 项目说明文档（本文件）
```

## 架构设计

### 分层架构

```
┌─────────────────────────────────────┐
│       tsoa Controllers（控制器层）    │  - 装饰器定义路由 + 参数校验
│    自动生成 → build/routes.ts       │  - 自动生成 Swagger 文档
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Services（服务层）              │  - 第三方 API 封装
│    OpenAI、Banana、COS 等            │  - 业务逻辑处理
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Models（数据模型层）            │  - 数据库 CRUD 操作
│    参数化查询、SQL 封装               │  - 防 SQL 注入
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     MySQL + Redis                   │  - 数据持久化 + 缓存
└─────────────────────────────────────┘
```

### API 路由

路由由 tsoa 根据控制器装饰器自动生成，Swagger 文档访问地址：`http://localhost:3000/docs`

**用户端接口（/app）**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/app/login` | 用户登录 |
| POST | `/app/register` | 用户注册 |
| POST | `/app/send-code` | 发送验证码 |
| GET | `/app/me` | 获取当前用户信息 |
| GET | `/app/gallery` | 画廊列表 |
| GET | `/app/my-creations` | 我的作品 |
| GET | `/app/categories` | 分类列表 |
| POST | `/app/banana-CreateImage` | Banana 文生图/图生图 |
| POST | `/app/text-to-image` | 第三方文生图 |
| POST | `/app/text-to-image/image-to-image` | 第三方图生图 |
| GET | `/app/text-to-image/records` | 生成记录列表 |
| POST | `/app/generateImage` | OpenAI 图片生成 |
| POST | `/app/analyzeImage` | OpenAI 图片分析 |
| POST | `/app/textToimageNew` | OpenAI Chat 生成图片 |
| CRUD | `/app/images` | 图片管理 |
| CRUD | `/app/categories` | 分类管理 |

**管理端接口（/api/v1/admin）**：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/admin/login` | 管理员登录 |
| POST | `/api/v1/admin/logout` | 管理员登出 |
| GET | `/api/v1/admin/profile` | 管理员信息 |
| GET | `/api/v1/admin/users` | 用户列表 |

## 数据库设计

### 核心表结构

#### 1. users（用户表）
- id, email, password(bcrypt), nickname, avatar, status, created_at, updated_at

#### 2. admin_users（管理员表）
- id, username(唯一), password(bcrypt), nickname, role(1=管理员,2=超级管理员), status, last_login, created_at, updated_at

#### 3. categories（分类表）
- id, name, description, sort_order, status(1=启用,0=禁用), created_at, updated_at

#### 4. images（图片表）
- id, url, source_url, thumbnail, title, description, prompt, category_id, upload_task_id, upload_status, upload_error, uploaded_at, created_at, updated_at

#### 5. image_generation_records（图片生成记录表）
- id, session_id, user_id, generation_type(text-to-image/image-to-image), prompt, model, size, status, image_url, created_at, updated_at

#### 6. conversations（对话表）
- id, user_id, title, context, status, created_at, updated_at

## 核心功能模块

### 1. 认证模块
- **用户认证**：邮箱 + 验证码注册/登录，JWT Token
- **管理员认证**：用户名 + 密码登录，独立 JWT
- **tsoa 安全装饰器**：`@Security('jwt')` / `@Security('adminJwt')`

### 2. AI 图片生成
- **Banana 文生图/图生图**：支持多张参考图片，base64 编码传输
- **OpenAI 图片生成**：DALL-E 模型，支持自定义参数
- **OpenAI Chat 生成**：多轮对话 + 流式响应（SSE）
- **第三方文生图**：统一封装的第三方图片生成服务

### 3. 图片管理
- 图片 CRUD、分类筛选、分页查询
- 腾讯云 COS 上传、缩略图生成（sharp）
- 异步上传任务状态管理

### 4. 画廊与作品
- 公开画廊展示
- 用户个人作品管理

## 开发指令

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 初始化数据库
mysql -u root -p your_database < sql/init.sql

# 开发环境（热重载）
npm run dev

# 构建
npm run build

# 生产环境
npm start
```

服务地址：`http://localhost:3000`
API 文档：`http://localhost:3000/docs`

## 重要约束

- 所有第三方接口调用必须使用 `externalHttpClient`，配置 `proxy: false`（避免本地代理 60 秒断连）
- 新增环境变量请同步更新 `.env.example`
- 不要读取 `.env` 文件，敏感信息放 `.env.example` 中作为模板
- 控制器文件采用 PascalCase 命名，如 `XxxController.ts`

---

**最后更新时间**：2026-03-25
**文档版本**：v2.0.0
