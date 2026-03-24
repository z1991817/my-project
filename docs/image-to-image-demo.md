# 图生图接口 Demo 测试文档

## 测试目标

测试第三方 `/chat/completions` 接口的图生图功能，验证：
1. 接口是否能接收图片URL + 文本提示词
2. 接口返回的数据格式
3. 如何提取生成的图片URL

---

## 接口信息

**端点**：`${CREATE_BASE_URL}/chat/completions`
**方法**：POST
**认证**：Bearer Token（GPT_IMAGE_KEY）

---

## 请求格式

### 请求头
```
Content-Type: application/json
Authorization: Bearer ${GPT_IMAGE_KEY}
```

### 请求体
```json
{
  "model": "gpt-image-1.5-all",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "美化一下这张图片,加上 我爱中国 四个字 尺寸[4:3]"
        },
        {
          "type": "image_url",
          "image_url": {
            "url": "https://example.com/test-image.jpg"
          }
        }
      ]
    }
  ]
}
```

**参数说明**：
- `model`: 模型名称，使用 `gpt-image-1.5-all`
- `messages`: 消息数组，包含用户输入
  - `role`: 固定为 `"user"`
  - `content`: 内容数组，可包含多个元素
    - `type: "text"`: 文本提示词
    - `type: "image_url"`: 图片URL

---

## Demo 实现方案

### 方案1：创建独立测试文件（推荐）

**文件路径**：`test/imageToImageDemo.js`

**功能**：
- 独立的测试脚本
- 不依赖现有业务逻辑
- 直接调用第三方API
- 打印完整的请求和响应

**实现步骤**：
1. 读取环境变量（CREATE_BASE_URL、GPT_IMAGE_KEY）
2. 构建请求参数
3. 使用axios发送POST请求
4. 打印响应数据
5. 分析响应结构，找到图片URL的位置

### 方案2：添加临时路由

**文件路径**：`app/index.js`

**功能**：
- 添加临时测试路由 `POST /test/image-to-image`
- 通过Postman或curl测试
- 测试完成后删除

---

## 预期响应格式（待验证）

### 可能的响应格式1：标准chat格式
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-image-1.5-all",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "https://generated-image-url.jpg"
      },
      "finish_reason": "stop"
    }
  ]
}
```

### 可能的响应格式2：包含图片对象
```json
{
  "id": "chatcmpl-xxx",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": [
          {
            "type": "image_url",
            "image_url": {
              "url": "https://generated-image-url.jpg"
            }
          }
        ]
      }
    }
  ]
}
```

### 可能的响应格式3：自定义格式
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "url": "https://generated-image-url.jpg"
      }
    ]
  }
}
```

---

## 测试步骤

### 步骤1：准备测试图片
- 使用公网可访问的图片URL
- 或上传图片到项目的 `public/uploads` 目录，使用 `http://localhost:3000/uploads/xxx.jpg`

### 步骤2：运行demo
```bash
# 方案1：运行独立测试脚本
node test/imageToImageDemo.js

# 方案2：启动服务器，使用Postman测试
npm run dev
# 然后用Postman调用 POST http://localhost:3000/test/image-to-image
```

### 步骤3：分析响应
- 查看完整的响应JSON
- 确定图片URL在响应中的位置
- 验证生成的图片是否符合预期

### 步骤4：记录结果
- 记录实际的响应格式
- 更新提取图片URL的逻辑
- 确认是否需要额外参数（如max_tokens、temperature等）

---

## 关键问题待验证

1. ⚠️ **响应格式**：图片URL在响应的哪个字段？
2. ⚠️ **多图输入**：是否支持多张图片输入？
3. ⚠️ **必需参数**：除了model和messages，是否需要其他参数？
4. ⚠️ **错误处理**：接口失败时的错误格式是什么？
5. ⚠️ **超时时间**：图片生成需要多长时间？

---

## 下一步

1. 先运行demo，获取真实的API响应
2. 根据响应格式调整实现方案
3. 再开始完整功能的开发
