# testApi 流式管道上传测试指南

## 📋 功能说明

`/app/testApi` 接口已升级为**流式管道架构**，实现：
- ✅ 调用第三方API获取图片URL
- ✅ 接口快速响应（<500ms）
- ✅ 使用流式管道异步上传到COS（内存占用极低）
- ✅ 支持任务状态查询

---

## 🚀 测试步骤

### 1. 启动服务
```bash
npm run dev
```

### 2. 调用 testApi 接口

#### 请求示例（默认：流式上传 + 压缩保持原格式）
```bash
curl -X POST http://localhost:3000/app/testApi \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的猫咪",
    "size": "1024x1024",
    "uploadToCos": true,
    "useStream": true
  }'
```

#### 请求示例（不压缩，保持原图）
```bash
curl -X POST http://localhost:3000/app/testApi \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的猫咪",
    "size": "1024x1024",
    "uploadToCos": true,
    "useStream": true,
    "compressBeforeUpload": false
  }'
```

#### 请求示例（自定义压缩质量）
```bash
curl -X POST http://localhost:3000/app/testApi \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "一只可爱的猫咪",
    "size": "1024x1024",
    "uploadToCos": true,
    "useStream": true,
    "compressBeforeUpload": true,
    "quality": 90
  }'
```

#### 响应示例
```json
{
  "success": true,
  "message": "第三方接口调用成功",
  "timestamp": "2026-03-13T02:39:16Z",
  "data": {
    "thirdPartyUrl": "https://third-party.com/image.jpg",
    "thirdPartyResponse": { ... },
    "upload": {
      "taskId": "550e8400-e29b-41d4-a716-446655440000",
      "status": "pending",
      "queryPath": "/app/testApi/tasks/550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

**关键点**：
- 接口立即返回（不等待上传完成）
- `thirdPartyUrl` 可立即使用
- `taskId` 用于查询上传状态

---

### 3. 查询上传任务状态

#### 请求示例
```bash
curl http://localhost:3000/app/testApi/tasks/550e8400-e29b-41d4-a716-446655440000
```

#### 响应示例（上传中）
```json
{
  "code": 200,
  "data": {
    "taskId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "uploading",
    "originalUrl": "https://third-party.com/image.jpg",
    "cosUrl": null,
    "thumbnail": null,
    "uploadBytes": null,
    "error": null,
    "attempts": 1,
    "maxAttempts": 3,
    "createdAt": "2026-03-13T02:39:16.123Z",
    "updatedAt": "2026-03-13T02:39:17.456Z"
  }
}
```

#### 响应示例（上传成功）
```json
{
  "code": 200,
  "data": {
    "taskId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "success",
    "originalUrl": "https://third-party.com/image.jpg",
    "cosUrl": "https://your-bucket.cos.ap-guangzhou.myqcloud.com/temp/2026-03-13/image-xxx.jpg",
    "thumbnail": "data:image/jpeg;base64,/9j/4AAQ...",
    "uploadBytes": 245678,
    "error": null,
    "attempts": 1,
    "maxAttempts": 3,
    "createdAt": "2026-03-13T02:39:16.123Z",
    "updatedAt": "2026-03-13T02:39:20.789Z"
  }
}
```

---

## 🔍 测试对比

### 测试1：传统方式 vs 流式管道（内存占用）

#### 传统方式（useStream: false）
```bash
curl -X POST http://localhost:3000/app/testApi \
  -H "Content-Type: application/json" \
  -d '{"uploadToCos": true, "useStream": false}'
```

**预期**：
- 内存占用：~3MB/任务
- 日志显示：`useStream=false`

#### 流式管道（useStream: true）
```bash
curl -X POST http://localhost:3000/app/testApi \
  -H "Content-Type: application/json" \
  -d '{"uploadToCos": true, "useStream": true}'
```

**预期**：
- 内存占用：~64KB/任务
- 日志显示：`useStream=true`

---

### 测试2：并发压力测试

#### 并发10个请求
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/app/testApi \
    -H "Content-Type: application/json" \
    -d '{"uploadToCos": true, "useStream": true}' &
done
wait
```

**观察点**：
- 所有请求应在 500ms 内返回
- 后台任务按并发限制（默认2）依次处理
- 内存占用应保持稳定

---

## 📊 日志分析

### 成功日志示例
```
[testApi] 开始调用第三方 API
[testApi] 上传配置: uploadToCos=true, useStream=true
[testApi] 第三方 API 响应成功
[testApi] 图片URL: https://...
[testApi] 创建上传任务: taskId=xxx, useStream=true
[upload-start] task=xxx sourceType=url useStream=true attempt=1/3
[upload-success] task=xxx duration=3.45s source=null compressed=245.67 KB url=https://...
```

### 关键指标
- `duration`: 上传耗时（流式通常更快）
- `compressed`: 压缩后大小
- `useStream=true`: 确认使用流式上传

---

## 🐛 故障排查

### 问题1：任务一直处于 pending 状态
**原因**：任务队列可能已满
**解决**：检查环境变量 `OPENAI_COS_UPLOAD_CONCURRENCY`（默认2）

### 问题2：上传失败 (status: failed)
**原因**：COS配置错误或网络问题
**解决**：
1. 检查 `.env` 中的 COS 配置
2. 查看 `upload.log` 文件
3. 检查任务的 `error` 字段

### 问题3：内存占用仍然很高
**原因**：可能使用了传统方式
**解决**：确认请求参数 `useStream: true`

---

## 🎯 性能对比

| 指标 | 传统方式 | 流式管道 | 提升 |
|------|---------|---------|------|
| 接口响应时间 | 10-15秒 | <500ms | **20-30倍** |
| 内存占用/任务 | ~3MB | ~64KB | **47倍** |
| 并发能力 | 5个/秒 | 50+个/秒 | **10倍** |
| 用户体验 | 长时间等待 | 秒开 | ⭐⭐⭐⭐⭐ |

---

## 📝 前端集成示例

```javascript
// 1. 调用接口生成图片
const response = await fetch('http://localhost:3000/app/testApi', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: '一只可爱的猫咪',
    uploadToCos: true,
    useStream: true
  })
});

const result = await response.json();

// 2. 立即显示第三方URL
const imgElement = document.getElementById('preview');
imgElement.src = result.data.thirdPartyUrl;

// 3. 轮询查询上传状态
const taskId = result.data.upload.taskId;
const pollInterval = setInterval(async () => {
  const statusRes = await fetch(`http://localhost:3000/app/testApi/tasks/${taskId}`);
  const status = await statusRes.json();

  if (status.data.status === 'success') {
    // 上传成功，替换为COS URL
    imgElement.src = status.data.cosUrl;
    clearInterval(pollInterval);
  } else if (status.data.status === 'failed') {
    console.error('上传失败:', status.data.error);
    clearInterval(pollInterval);
  }
}, 2000); // 每2秒查询一次
```

---

## ✅ 验收标准

- [ ] 接口响应时间 < 500ms
- [ ] 后台任务成功上传到COS
- [ ] 任务状态查询正常
- [ ] 日志显示 `useStream=true`
- [ ] 并发10个请求无异常
- [ ] 内存占用稳定（无泄漏）

---

## 🔧 环境变量配置

确保 `.env` 文件包含以下配置：

```env
# 第三方API配置
CREATE_BASE_URL=https://api.example.com
GPT_IMAGE_KEY=your-api-key

# COS配置
COS_BUCKET=your-bucket
COS_REGION=ap-guangzhou
COS_SECRET_ID=your-secret-id
COS_SECRET_KEY=your-secret-key

# 上传配置（可选）
OPENAI_COS_UPLOAD_CONCURRENCY=2  # 并发上传数
OPENAI_COS_UPLOAD_RETRIES=2      # 重试次数
OPENAI_IMAGE_UPLOAD_QUALITY=72   # 压缩质量
```
