# textToimageNew 追加对话功能 - 需求文档

## 📋 功能概述

在 `POST /app/textToimageNew` 接口中实现多轮对话功能，允许用户基于之前的对话历史继续追加新的输入，实现上下文连贯的图片生成对话。

---

## 🎯 核心需求

### 业务场景
用户第一次输入："小猫飞翔，比例9:16"，生成图片后，可以继续输入："把背景改成夜空"，系统能够理解这是对上一次生成图片的修改请求。

### ⚠️ 关键要求

**必须保存 AI 返回的完整原始内容**

追加对话时，需要把上一次 AI 返回的**完整内容**（包括进度提示、图片链接等）原封不动地传给第三方 API，这样 AI 才能完整理解上下文。

**示例：AI 返回的完整内容**
```
{
  "role": "assistant",
  "content": "```json\n{\n  \"prompt\": \"小猫飞翔，比例9:16\",\n  \"ratio\": \"9:16\",\n  \"n\": 1\n}\n```\n\n> ID: `1a8e42cf-bbda-4793-b743-afbe26d914db`\n>[数据预览](https://pro.asyncdata.net/web/1a8e42cf-bbda-4793-b743-afbe26d914db) | [原始数据](https://pro.asyncdata.net/source/1a8e42cf-bbda-4793-b743-afbe26d914db)\n\n>🕐 排队中.\n\n>⚡ 生成中.....\n\n>🏃‍ 进度 72..[100](https://videos.openai.com/...)\n\n> ✅ 生成完成\n\n\n![gen_01kkd8nppjf1mvfzphde13awdh](https://pro.filesystem.site/cdn/20260311/e952b8c0cadf21bb01557fd96b6e27.png)\n\n[点击下载](https://pro.filesystem.site/cdn/download/20260311/e952b8c0cadf21bb01557fd96b6e27.png)"
}
```

这些内容包括：
- ✅ JSON 代码块（参数信息）
- ✅ 任务 ID 和数据预览链接
- ✅ 进度提示（🕐 排队中、⚡ 生成中、🏃‍ 进度、✅ 完成）
- ✅ 图片 Markdown 链接
- ✅ 下载链接
- ✅ 所有其他文本内容

**不要做任何截取、格式化或清理**，必须原样保存到数据库的 `content` 字段。

### 对话流程示例

```
第一轮对话：
用户输入 → {role: "user", content: "小猫飞翔，比例9:16"}
AI返回 → {role: "assistant", content: "完整的返回内容（包括进度、图片链接等）"}
保存到数据库 → 两条记录（user + assistant）

第二轮对话：
加载历史 → [
  {role: "user", content: "小猫飞翔，比例9:16"},
  {role: "assistant", content: "完整的返回内容..."}
]
用户输入 → {role: "user", content: "把背景改成夜空"}
传给API → 完整的 messages 数组（历史 + 新输入）
AI返回 → 基于上下文生成新图片

第三轮对话：
加载历史 → [前两轮的完整对话]
用户输入 → {role: "user", content: "添加星星点缀"}
传给API → 完整的 messages 数组
AI返回 → 继续基于上下文生成
```

---

## 🗄️ 数据库设计

### 新增表：conversations

```sql
CREATE TABLE conversations (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '对话记录ID',
  session_id VARCHAR(36) NOT NULL COMMENT '会话ID（UUID）',
  role ENUM('user', 'assistant') NOT NULL COMMENT '角色：user=用户, assistant=AI',
  content TEXT NOT NULL COMMENT '对话内容',
  image_id INT NULL COMMENT '关联的图片ID（如果生成了图片）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  INDEX idx_session_id (session_id),
  INDEX idx_created_at (created_at),

  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话历史记录表';
```

### 字段说明
- `session_id`: 每个会话的唯一标识，使用 UUID v4 格式
- `role`: 区分用户输入和 AI 回复
- `content`: 存储完整的对话内容
  - **用户输入**：原始的 prompt 文本
  - **AI 回复**：完整的返回内容（包括 JSON、进度提示、图片链接、下载链接等所有内容）
- `image_id`: 如果 AI 生成了图片，关联到 images 表的 ID

**重要**：`content` 字段必须保存 AI 返回的**原始完整内容**，不要做任何截取或格式化，这样在追加对话时，AI 才能完整理解上下文。

---

## 🔌 API 接口设计

### 接口地址
`POST /app/textToimageNew`

### 请求参数

#### 模式A：新建对话（首次对话）
```json
{
  "prompt": "小猫飞翔，比例9:16",
  "model": "gpt-4o-image",
  "stream": true,
  "uploadToCos": true
}
```

#### 模式B：追加对话（后续对话）
```json
{
  "session_id": "1a8e42cf-bbda-4793-b743-afbe26d914db",
  "prompt": "把背景改成夜空",
  "model": "gpt-4o-image",
  "stream": true,
  "uploadToCos": true
}
```

### 参数说明
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | string | 否 | 会话ID，不传则创建新会话 |
| prompt | string | 是 | 用户输入的文本 |
| model | string | 否 | AI模型，默认 gpt-4o-image |
| stream | boolean | 否 | 是否流式返回，默认 true |
| uploadToCos | boolean | 否 | 是否上传到COS，默认 true |

### 响应数据

#### 流式响应（stream=true）
保持现有的 SSE 流式响应格式，在最后追加 session_id 信息：

```
event: session
data: {"session_id":"1a8e42cf-bbda-4793-b743-afbe26d914db"}

event: message
data: {"content":"生成中..."}

event: cos_upload
data: {"image":{"cosUrl":"https://..."}}

event: done
data: [DONE]
```

#### 非流式响应（stream=false）
```json
{
  "code": 200,
  "data": {
    "session_id": "1a8e42cf-bbda-4793-b743-afbe26d914db",
    "content": "AI返回的完整内容",
    "images": [
      {
        "cosUrl": "https://...",
        "thumbnail": "data:image/jpeg;base64,...",
        "imageId": 123
      }
    ],
    "created_at": "2026-03-11T10:30:00Z"
  }
}
```

---

## 💻 代码实现要点

### 1. 新增文件

#### `models/conversation.js`
```javascript
// 对话模型，提供以下方法：
- create(session_id, role, content, image_id) // 创建对话记录
- getBySessionId(session_id, limit) // 获取会话历史（最近N条，按时间升序）
- deleteOldRecords(days) // 清理过期记录

// 注意：getBySessionId 返回的数据格式
[
  { role: 'user', content: '小猫飞翔，比例9:16' },
  { role: 'assistant', content: '完整的AI返回内容...' },
  { role: 'user', content: '把背景改成夜空' },
  ...
]
```

#### `sql/conversations.sql`
```sql
-- 建表脚本
```

### 2. 修改文件

#### `controllers/openai.js`
修改 `generateImageByChatCompletions` 方法：

```javascript
async function generateImageByChatCompletions(req, res, next) {
  const { session_id, prompt, stream, ... } = req.body;

  // 1. 如果有 session_id，加载历史对话（完整的 messages 数组）
  let messages = [];
  if (session_id) {
    const history = await Conversation.getBySessionId(session_id, 10);
    messages = history.map(h => ({
      role: h.role,
      content: h.content  // 保持原始内容，不做任何处理
    }));
  }

  // 2. 追加当前用户输入
  messages.push({
    role: 'user',
    content: prompt
  });

  // 3. 调用第三方 API
  const result = await openaiService.generateImageByChatCompletions({
    messages,
    stream,
    ...options
  });

  // 4. 生成或使用现有 session_id
  const newSessionId = session_id || randomUUID();

  // 5. 保存用户输入到数据库
  await Conversation.create(newSessionId, 'user', prompt, null);

  // 6. 处理响应
  if (stream) {
    // 流式响应：需要收集完整的 AI 返回内容后保存
    // 在流结束后异步保存 assistant 的完整响应
    collectStreamResponse(result.stream, (fullContent, imageId) => {
      Conversation.create(newSessionId, 'assistant', fullContent, imageId);
    });

    // 返回流式响应
    res.status(result.status);
    Object.entries(result.headers).forEach(([key, value]) => {
      if (value !== undefined) res.setHeader(key, value);
    });
    result.stream.pipe(res);
    return;
  } else {
    // 非流式响应：直接保存完整的 AI 返回
    const aiContent = result.data.choices[0].message.content;
    const imageId = extractImageIdFromResponse(result.data); // 提取图片ID
    await Conversation.create(newSessionId, 'assistant', aiContent, imageId);

    return res.json({
      code: 200,
      data: {
        session_id: newSessionId,
        ...result.data
      }
    });
  }
}
```

**关键点**：
- 历史对话的 `content` 字段原封不动传给 API
- 流式响应需要收集完整内容后再保存到数据库
- 非流式响应直接保存 AI 返回的完整 content

---

## ⚙️ 技术细节

### 1. 对话历史管理
- **加载限制**：每次最多加载最近 10 条对话记录（避免超过 API token 限制）
- **排序规则**：按 `created_at ASC` 排序（时间从旧到新）
- **截断策略**：如果对话历史过长，保留最近的记录
- **内容完整性**：必须保存 AI 返回的**完整原始内容**，包括：
  - JSON 代码块
  - 进度提示（🕐 排队中、⚡ 生成中、🏃‍ 进度等）
  - 图片链接（Markdown 格式）
  - 下载链接
  - 所有其他文本内容

### 2. session_id 生成
```javascript
const { randomUUID } = require('crypto');
const session_id = randomUUID(); // 生成 UUID v4
```

### 3. 数据清理策略
- 定时任务：每天凌晨 3 点清理 30 天前的对话记录
- 实现方式：使用 node-cron 或系统 cron job

```javascript
// 示例：清理 30 天前的记录
await Conversation.deleteOldRecords(30);
```

### 4. 错误处理
- `session_id` 不存在：当作新会话处理（创建新的 session_id）
- 历史记录为空：正常处理，只使用当前输入
- 数据库查询失败：降级处理，不加载历史记录

### 5. 流式响应的内容收集
对于流式响应（stream=true），需要实现一个机制来收集完整的 AI 返回内容：

```javascript
function collectStreamResponse(stream, callback) {
  let fullContent = '';
  let imageId = null;

  stream.on('data', (chunk) => {
    const text = chunk.toString();
    // 解析 SSE 格式，提取 content
    const matches = text.match(/data: (.+)/g);
    if (matches) {
      matches.forEach(match => {
        try {
          const data = JSON.parse(match.replace('data: ', ''));
          if (data.choices?.[0]?.delta?.content) {
            fullContent += data.choices[0].delta.content;
          }
          // 提取图片ID（如果有）
          if (data.image_id) {
            imageId = data.image_id;
          }
        } catch (e) {}
      });
    }
  });

  stream.on('end', () => {
    callback(fullContent, imageId);
  });
}
```

---

## 🔒 安全与性能

### 安全考虑
1. **session_id 验证**：确保 session_id 格式为有效的 UUID
2. **内容过滤**：对用户输入进行 XSS 防护
3. **权限控制**：未来可扩展用户级别的会话隔离

### 性能优化
1. **索引优化**：在 `session_id` 和 `created_at` 上建立索引
2. **缓存策略**：高频会话可使用 Redis 缓存历史记录
3. **分页加载**：限制每次加载的历史记录数量

---

## 📝 测试用例

### 测试场景1：新建对话
```bash
curl -X POST http://localhost:3000/app/textToimageNew \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "小猫飞翔，比例9:16"
  }'

# 预期：返回 session_id 和生成的图片
```

### 测试场景2：追加对话
```bash
curl -X POST http://localhost:3000/app/textToimageNew \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "1a8e42cf-bbda-4793-b743-afbe26d914db",
    "prompt": "把背景改成夜空"
  }'

# 预期：基于上下文生成新图片
```

### 测试场景3：无效 session_id
```bash
curl -X POST http://localhost:3000/app/textToimageNew \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "invalid-uuid",
    "prompt": "测试输入"
  }'

# 预期：当作新会话处理，返回新的 session_id
```

---

## 🚀 实施步骤

### Phase 1：数据库准备
1. 创建 `conversations` 表
2. 运行数据库迁移脚本

### Phase 2：模型层开发
1. 创建 `models/conversation.js`
2. 实现 CRUD 方法

### Phase 3：控制器层改造
1. 修改 `controllers/openai.js`
2. 集成对话历史加载逻辑

### Phase 4：测试与优化
1. 单元测试
2. 接口测试
3. 性能优化

---

## 📌 注意事项

1. **兼容性**：不传 `session_id` 时，保持现有功能不变
2. **数据清理**：定期清理过期对话记录，避免数据库膨胀
3. **Token 限制**：注意第三方 API 的 token 限制，避免历史记录过长
4. **流式响应**：需要在流式响应中正确传递 `session_id`

---

## 🔗 相关文件

- 路由配置：`app/index.js:9`
- 控制器：`controllers/openai.js:173-254`
- 服务层：`services/openai.js:919-1012`
- 图片模型：`models/image.js`

---

## 📅 更新日志

| 日期 | 版本 | 说明 |
|------|------|------|
| 2026-03-11 | v1.0 | 初始版本，定义核心需求和技术方案 |
