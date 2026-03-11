# artImg Pro - AI 图片处理工具服务端

## 📋 项目概述

**项目名称**：artImg Pro - AI 图片处理工具服务端
**当前版本**：v0.0.1
**项目状态**：生产环境运行中，持续开发新功能
**业务目标**：为用户提供方便便利的 AI 图片处理工具
**核心价值**：简单易用、实时协作、数据安全

## 🛠 技术栈

### 后端框架
- **Node.js** + **Express 4.16**
- **MySQL 2** - 数据库连接池
- **dotenv** - 环境变量管理

### 核心依赖
- **OpenAI SDK** - AI 图片生成与分析
- **Google GenAI** - Google AI 服务集成
- **JWT (jsonwebtoken)** - 用户认证
- **bcryptjs** - 密码加密
- **multer** - 文件上传处理
- **sharp** - 图片压缩与处理
- **axios** - HTTP 请求
- **cors** - 跨域支持
- **cos-nodejs-sdk-v5** - 腾讯云对象存储

### 开发工具
- **nodemon** - 开发环境热重载

## 📁 项目结构

```
my-project/
├── app/                      # 应用层路由模块
│   ├── index.js             # App 路由入口（/app）
│   ├── categories.js        # 分类路由
│   └── images.js            # 图片路由
├── bin/
│   └── www                  # 服务启动入口
├── config/
│   └── db.js                # MySQL 数据库连接池配置
├── controllers/             # 控制器层
│   ├── adminController.js   # 管理员控制器
│   ├── categoryController.js # 分类控制器
│   ├── imageController.js   # 图片控制器
│   └── openai.js            # OpenAI 控制器
├── middleware/              # 中间件
│   ├── auth.js              # JWT 认证中间件
│   ├── upload.js            # 本地文件上传中间件
│   └── cosUpload.js         # 腾讯云 COS 上传中间件
├── models/                  # 数据模型层
│   ├── adminUser.js         # 管理员用户模型
│   ├── category.js          # 分类模型
│   └── image.js             # 图片模型
├── routes/                  # API 路由层
│   ├── v1.js                # API v1 版本路由入口
│   ├── admin.js             # 管理后台路由
│   ├── categories.js        # 分类路由
│   ├── images.js            # 图片路由
│   ├── openai.js            # OpenAI 路由
│   ├── users.js             # 用户路由
│   └── index.js             # 路由总入口
├── services/                # 服务层
│   └── openai.js            # OpenAI 服务封装
├── scripts/                 # 数据库脚本
│   ├── add_openai_task_columns.sql
│   ├── add_thumbnail_base64_column.sql
│   ├── migrate_thumbnail_column.js
│   ├── checkImagesTable.js
│   └── createImagesTable.js
├── sql/                     # 数据库初始化脚本
│   ├── init.sql             # 管理员表初始化
│   ├── categories.sql       # 分类表初始化
│   └── images.sql           # 图片表初始化
├── public/                  # 静态资源目录
│   ├── uploads/             # 上传文件存储
│   ├── images/              # 图片资源
│   ├── stylesheets/         # 样式文件
│   └── javascripts/         # 前端脚本
├── views/                   # 视图模板（Jade）
│   └── admin/               # 管理后台视图
├── .env                     # 环境变量配置（不提交）
├── .env.example             # 环境变量示例
├── app.js                   # Express 应用主入口
├── package.json             # 项目依赖配置
├── CLAUDE.md                # Claude AI 开发指令
├── API.md                   # API 接口文档
└── PROJECT.md               # 项目说明文档（本文件）
```

## 🏗 架构设计

### 分层架构

```
┌─────────────────────────────────────┐
│         Routes（路由层）              │  - 定义 API 端点
│    /api/v1, /app                    │  - 参数验证
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Controllers（控制器层）          │  - 业务逻辑编排
│    处理请求、调用服务、返回响应         │  - 错误处理
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Services（服务层）              │  - 第三方服务封装
│    OpenAI、腾讯云 COS 等              │  - 复杂业务逻辑
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        Models（数据模型层）            │  - 数据库操作
│    CRUD、查询、事务处理                │  - SQL 封装
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Database（MySQL）            │  - 数据持久化
└─────────────────────────────────────┘
```

### 路由设计

- **`/api/v1`** - API v1 版本路由
  - `/api/v1/admin` - 管理后台接口（需认证）
    - `/categories` - 分类管理
    - `/images` - 图片管理
  - `/api/v1/openai` - OpenAI 服务接口

- **`/app`** - 应用层路由
  - `/app/categories` - 分类接口
  - `/app/images` - 图片接口
  - `/app/textToImage` - 文本生成图片
  - `/app/textToimageNew` - 新版文本生成图片（Chat Completions）
  - `/app/textToImage/tasks/:taskId` - 查询上传任务状态

## 📊 数据库设计

### 核心表结构

#### 1. admin_users（管理员表）
```sql
- id: 主键
- username: 用户名（唯一）
- password: bcrypt 加密密码
- nickname: 昵称
- role: 角色（1=管理员，2=超级管理员）
- status: 状态（1=启用，0=禁用）
- last_login: 最后登录时间
- created_at, updated_at: 时间戳
```

#### 2. categories（分类表）
```sql
- id: 主键
- name: 分类名称
- description: 分类描述
- sort_order: 排序顺序
- status: 状态（1=启用，0=禁用）
- created_at, updated_at: 时间戳
```

#### 3. images（图片表）
```sql
- id: 主键
- url: 图片 URL
- source_url: 源图 URL（第三方）
- thumbnail: 缩略图 base64（268x358）
- title: 图片标题
- description: 图片描述
- prompt: AI 提示词
- category_id: 分类 ID（外键）
- upload_task_id: 上传任务 ID（唯一）
- upload_status: 上传状态
- upload_error: 上传错误信息
- uploaded_at: 上传时间
- created_at, updated_at: 时间戳
```

## 🔧 核心功能模块

### 1. 认证模块（Authentication）
- **JWT Token 认证**
- 管理员登录/登出
- Token 过期验证
- 中间件：`middleware/auth.js`

### 2. 分类管理模块（Categories）
- 分类 CRUD 操作
- 分页查询、模糊搜索
- 状态管理（启用/禁用）
- 排序功能

### 3. 图片管理模块（Images）
- 图片上传（本地/URL）
- 图片列表查询（支持分类筛选）
- 图片详情查看
- 图片更新/删除
- 缩略图生成（base64）

### 4. AI 图片生成模块（OpenAI）
- **文本生成图片**（Text-to-Image）
  - 支持 OpenAI DALL-E 模型
  - 自定义参数（size、quality、style）
  - 批量生成（n 参数）

- **Chat Completions 生成图片**
  - 支持多轮对话
  - 支持参考图片（imageUrl）
  - 流式响应（SSE）

- **图片分析**（Image Analysis）
  - 图片内容识别
  - 自定义分析提示词

- **上传任务管理**
  - 异步上传到腾讯云 COS
  - 任务状态查询
  - 图片压缩（sharp）
  - 自动保存到数据库

### 5. 文件上传模块（Upload）
- 本地文件上传（multer）
- 腾讯云 COS 上传
- 文件类型验证
- 文件大小限制（5MB）

## 🔐 环境变量配置

参考 `.env.example` 文件：

```bash
# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=your_database

# JWT 配置
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d

# 应用端口
PORT=3000

# 腾讯云 COS 配置
COS_SECRET_ID=your_secret_id
COS_SECRET_KEY=your_secret_key
COS_BUCKET=your_bucket_name
COS_REGION=ap-guangzhou

# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
OPENAI_BASE_URL=http://192.168.1.1/v1
OPENAI_IMAGE_CHAT_MODEL=gpt-4o-image
OPENAI_IMAGE_CHAT_GROUP=default
```

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，填入实际配置
```

### 3. 初始化数据库
```bash
# 依次执行以下 SQL 文件
mysql -u root -p your_database < sql/init.sql
mysql -u root -p your_database < sql/categories.sql
mysql -u root -p your_database < sql/images.sql

# 如需 OpenAI 功能，执行以下脚本
mysql -u root -p your_database < scripts/add_openai_task_columns.sql
mysql -u root -p your_database < scripts/add_thumbnail_base64_column.sql
node scripts/migrate_thumbnail_column.js
```

### 4. 启动服务

**开发环境**（热重载）：
```bash
npm run dev
```

**生产环境**：
```bash
npm start
```

服务默认运行在：`http://localhost:3000`

### 5. 默认管理员账号
- 用户名：`admin`
- 密码：`123456`

## 📝 编程规范

### 1. 命名规范
- **文件命名**：小驼峰（camelCase）
  - 控制器：`xxxController.js`
  - 模型：`xxx.js`
  - 中间件：`xxx.js`

- **变量命名**：小驼峰（camelCase）
  ```javascript
  const userName = 'admin';
  const categoryId = 1;
  ```

- **常量命名**：大写下划线（UPPER_SNAKE_CASE）
  ```javascript
  const JWT_SECRET = process.env.JWT_SECRET;
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  ```

- **函数命名**：小驼峰，动词开头
  ```javascript
  async function getUserById(id) { }
  async function createCategory(data) { }
  ```

### 2. 代码风格
- 使用 **async/await** 处理异步操作
- 统一使用 **单引号**（'）
- 缩进：**2 空格**
- 每行代码不超过 **120 字符**

### 3. 错误处理
```javascript
// 控制器层统一错误处理
async function someController(req, res, next) {
  try {
    // 业务逻辑
  } catch (error) {
    return next(error); // 传递给全局错误处理中间件
  }
}
```

### 4. 响应格式
```javascript
// 成功响应
res.json({
  code: 200,
  message: '操作成功',
  data: {}
});

// 错误响应
res.status(400).json({
  code: 400,
  message: '错误信息'
});
```

### 5. 数据库操作
- 使用 **连接池**（promisePool）
- 使用 **参数化查询** 防止 SQL 注入
- 模型层封装所有数据库操作

```javascript
// ✅ 正确示例
const [rows] = await db.query(
  'SELECT * FROM users WHERE id = ?',
  [userId]
);

// ❌ 错误示例（SQL 注入风险）
const [rows] = await db.query(
  `SELECT * FROM users WHERE id = ${userId}`
);
```

### 6. 注释规范
```javascript
/**
 * 函数功能描述
 * @param {string} param1 - 参数1说明
 * @param {number} param2 - 参数2说明
 * @returns {Promise<Object>} 返回值说明
 */
async function someFunction(param1, param2) {
  // 实现逻辑
}
```

### 7. 安全规范
- 密码必须使用 **bcrypt** 加密
- 敏感接口必须添加 **JWT 认证**
- 文件上传必须验证 **文件类型和大小**
- 所有用户输入必须 **验证和过滤**

## 🔌 API 接口

详细接口文档请参考：[API.md](./API.md)

### 主要接口分类
1. **管理员认证**
   - POST `/api/v1/admin/login` - 登录
   - POST `/api/v1/admin/logout` - 登出

2. **分类管理**（需认证）
   - GET `/api/v1/admin/categories` - 获取分类列表
   - GET `/api/v1/admin/categories/enabled` - 获取启用分类
   - GET `/api/v1/admin/categories/:id` - 获取分类详情
   - POST `/api/v1/admin/categories` - 创建分类
   - PUT `/api/v1/admin/categories/:id` - 更新分类
   - DELETE `/api/v1/admin/categories/:id` - 删除分类

3. **图片管理**（需认证）
   - GET `/api/v1/admin/images` - 获取图片列表
   - GET `/api/v1/admin/images/:id` - 获取图片详情
   - POST `/api/v1/admin/images/upload` - 上传图片文件
   - POST `/api/v1/admin/images` - 上传图片（URL）
   - PUT `/api/v1/admin/images/:id` - 更新图片
   - DELETE `/api/v1/admin/images/:id` - 删除图片

4. **AI 图片生成**
   - POST `/app/textToImage` - 文本生成图片
   - POST `/app/textToimageNew` - 新版文本生成图片
   - GET `/app/textToImage/tasks/:taskId` - 查询上传任务状态

## 🧪 测试与调试

### 测试工具推荐
- **Postman** / **Insomnia** - API 测试
- **MySQL Workbench** - 数据库管理

### 日志查看
- 开发环境日志：控制台输出
- 上传日志：`upload.log`

### 常见问题排查
1. **数据库连接失败**
   - 检查 `.env` 配置
   - 确认 MySQL 服务已启动
   - 验证数据库用户权限

2. **Token 验证失败**
   - 检查 `JWT_SECRET` 配置
   - 确认 Token 未过期
   - 验证 Authorization 头格式

3. **文件上传失败**
   - 检查 `public/uploads` 目录权限
   - 验证文件大小和类型
   - 查看 COS 配置是否正确

## 📦 部署指南

### 生产环境部署
1. 设置 `NODE_ENV=production`
2. 使用 **PM2** 进程管理
   ```bash
   npm install -g pm2
   pm2 start bin/www --name artimg-api
   pm2 save
   pm2 startup
   ```
3. 配置 **Nginx** 反向代理
4. 启用 **HTTPS**（SSL 证书）
5. 配置数据库备份策略

### 性能优化建议
- 启用 **Redis** 缓存（分类列表、图片列表）
- 使用 **CDN** 加速静态资源
- 数据库索引优化
- 图片压缩和懒加载

## 🤝 开发协作

### Git 工作流
- `master` - 主分支（生产环境）
- `develop` - 开发分支
- `feature/*` - 功能分支
- `hotfix/*` - 紧急修复分支

### 提交规范
```
feat: 新增功能
fix: 修复 Bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具链更新
```

## 📞 联系方式

如有问题或建议，请联系项目维护者。

---

**最后更新时间**：2026-03-11
**文档版本**：v1.0.0
