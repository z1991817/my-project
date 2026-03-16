# `app/textToImage` 参考图生成方案

## 目标

让现有 `POST /app/textToImage` 接口支持“传入一张或多张参考图”，再结合 `prompt` 生成结果图。

当前代码里，这个接口只走纯文生图：

- 路由在 `app/index.js`
- 控制器在 `controllers/openai.js`
- 实际调用 OpenAI 在 `services/openai.js`
- 现在只调用了 `openai.images.generate()`

所以它只能根据文本生成，不能把参考图一起送给模型。

## 结论

推荐方案是：

1. 保留现有 `POST /app/textToImage` 路径不变。
2. 新增“可选参考图输入”能力。
3. 无参考图时，继续走 `openai.images.generate()`。
4. 有参考图时，改走 `openai.images.edit()`。

这是最小改动方案，兼容现有调用方，也最贴合你当前代码结构。

## 为什么这样做

OpenAI 官方现在支持“基于参考图生成新图”，推荐走 Image API 的 `images.edit`。

要点是：

- `images.generate` 适合纯文本生图
- `images.edit` 适合“带输入图”的生成/编辑
- GPT Image 模型支持多张输入图
- 可以用 `input_fidelity=high` 提高对人物、Logo、风格细节的保真

官方资料：

- 图片生成指南: https://platform.openai.com/docs/guides/image-generation
- Images API Reference: https://platform.openai.com/docs/api-reference/images

基于官方说明，如果只是做你这个单接口的一次性生成，不需要上 Responses API，直接用 Image API 就够了。

## 推荐的接口形态

### 方案 A：同一个接口同时支持两种请求

推荐继续用同一个接口 `POST /app/textToImage`，但支持两种入参：

#### 1. 纯文本模式

`application/json`

```json
{
  "prompt": "生成一张现代极简风海报",
  "model": "gpt-image-1.5",
  "size": "1024x1536"
}
```

这种情况继续走现有 `generate` 流程。

#### 2. 参考图模式

`multipart/form-data`

字段建议：

- `prompt`: 必填
- `referenceImages`: 文件数组，1 到 5 张
- `model`: 可选，默认 `gpt-image-1.5`
- `size`: 可选
- `quality`: 可选
- `input_fidelity`: 可选，默认 `high`
- 其他你现有字段继续保留，如 `uploadToCos`、`saveToDb`、`title`、`description`

前端请求示意：

- `referenceImages`: 文件1
- `referenceImages`: 文件2
- `prompt`: `参考这张图的角色造型，生成一张雪地场景海报`

### 为什么不建议新开一个独立接口

也可以新开 `POST /app/textToImageWithReference`，但没必要：

- 现有调用方要改两套逻辑
- 服务端会出现大段重复参数处理
- 后续如果还要支持 URL 参考图、mask、局部重绘，会继续分叉

单接口按“是否传参考图”分流更稳。

## 服务端改造方案

## 1. 路由层

在 `app/index.js` 这条路由上增加上传中间件。

建议使用内存上传，而不是落磁盘：

- 你项目里已经有 `middleware/cosUpload.js`，里面的 `multer.memoryStorage()` 可以复用思路
- 参考图最终只是转发给 OpenAI，不需要先存本地

建议新建一个专门给 OpenAI 参考图用的 upload middleware，不要直接复用 admin 上传逻辑，原因是：

- `middleware/upload.js` 现在是落盘
- 参考图这条链路更适合内存态转发
- 可以单独设置大小、张数、字段名

建议约束：

- 字段名：`referenceImages`
- 最大数量：5
- 单张上限：10MB 或 20MB
- 格式：`png/jpg/jpeg/webp`

## 2. 控制器层

`controllers/openai.js` 的 `generateImage` 需要增加一层分流判断。

判断逻辑建议：

- 如果 `req.files` 或 `req.files.referenceImages` 有内容，则走“参考图模式”
- 否则走现有纯文本模式

控制器里新增解析字段：

- `input_fidelity`
- `referenceImageUrls`（可选扩展）
- `referenceImages` 文件数组

然后统一组装成 `options.referenceImages` 传给 service。

## 3. Service 层

`services/openai.js` 是这次改动的核心。

建议把现在的 `generateImage(prompt, options)` 升级成两条内部路径：

### 路径一：无参考图

继续保留：

- `openai.images.generate(params)`

### 路径二：有参考图

改为：

- `openai.images.edit(params)`

其中关键参数大概会变成：

- `model`
- `image`
- `prompt`
- `size`
- `quality`
- `input_fidelity`
- `output_format`
- `n`

这里有两个实现方向：

#### 实现方向 1：直接把上传文件流传给 `images.edit`

这是推荐实现。

原因：

- 后端收到的就是文件
- `openai` Node SDK 已支持 `images.edit({ image: [...] })`
- 不需要你先把参考图传 COS 再回传 URL
- 链路最短

#### 实现方向 2：先把参考图上传成 URL / file_id，再传给 OpenAI

这个方案也能做，但不建议作为第一版：

- 逻辑更绕
- 会增加中间存储步骤
- 还要处理参考图生命周期

## 4. 结果处理层

你现在生成结果后，会继续：

- 返回 `imageUrl` / `imageBase64`
- 生成缩略图
- 异步上传 COS
- 可选保存数据库

这一层大体可以复用，但有一个关键点：

### 注意返回格式差异

你当前代码默认兼容：

- `item.url`
- `item.b64_json`

而 GPT Image 的编辑接口通常会返回 base64 结果，所以“参考图模式”下更常见的是 `b64_json`。

这意味着你现有这套后处理其实基本已经兼容，只要保证：

1. `images.edit()` 的结果也走同一套结果归一化
2. 当没有 `url` 只有 `b64_json` 时，继续走你现有 `uploadBase64ToCOS()` 分支

这一点对你是有利的，因为你服务里已经把 base64 上传 COS 的链路写好了。

## 推荐的参数设计

建议新增这些参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `prompt` | string | 是 | 生成要求 |
| `referenceImages` | file[] | 否 | 参考图文件数组 |
| `input_fidelity` | `low/high` | 否 | 有参考图时默认 `high` |
| `referenceMode` | string | 否 | 预留，例如 `reference` / `edit` |

保留现有参数：

- `model`
- `n`
- `size`
- `quality`
- `uploadToCos`
- `compressBeforeUpload`
- `includeBase64InResponse`
- `includeThumbnailInResponse`
- `saveToDb`
- `title`
- `description`
- `category_id`

## 推荐默认行为

为了减少调用方负担，我建议默认行为这样定：

### 无参考图

- 默认模型：`gpt-image-1.5`
- 走 `images.generate`

### 有参考图

- 默认模型：`gpt-image-1.5`
- 默认 `input_fidelity=high`
- 自动走 `images.edit`

这样前端只需要多传一个文件字段，不需要理解底层 OpenAI API 差异。

## 兼容性与风险

## 1. 请求格式会从纯 JSON 扩展到 multipart

这是最大变化点。

如果前端要上传本地图片文件，必须改成 `multipart/form-data`。  
如果前端传的是“公网图片 URL”，那仍然可以保留 JSON 方式，但这属于第二阶段扩展。

## 2. 参考图模式更适合 GPT Image，不适合继续默认旧参数组合

当前代码默认 `model = 'gpt-4o-image'`，这个默认值需要你重点确认。

根据 OpenAI 当前官方图片接口文档，参考图编辑推荐用 GPT Image 系列，比如：

- `gpt-image-1.5`
- `gpt-image-1`

所以这次最好顺手把默认模型收敛到 GPT Image 模型，而不是继续沿用旧默认值。

## 3. 成本会高于纯文生图

有参考图时会引入输入图 token 成本。  
如果再开启 `input_fidelity=high`，成本还会更高。

但从效果上看，这通常是值得的，尤其是：

- 人脸
- Logo
- IP 角色
- 商品图

## 4. 文件大小和数量必须限制

否则会出现：

- 请求体过大
- 内存占用高
- OpenAI 返回图片格式/大小错误

所以第一版一定要限制：

- 张数
- 单张大小
- mime type

## 推荐落地顺序

建议分两步做。

### 第一步

先支持“上传本地参考图文件”：

- 同一路径 `POST /app/textToImage`
- `multipart/form-data`
- `referenceImages`
- 有图走 `images.edit`
- 无图走 `images.generate`

这是最直接、最实用的一版。

### 第二步

再扩展“参考图 URL / file_id / mask”：

- `referenceImageUrls`
- `mask`
- 局部重绘
- 多轮编辑

这一层可以等第一版跑通后再做。

## 我建议你现在选的最终方案

### 推荐方案

在现有 `POST /app/textToImage` 上直接扩展：

- 保持接口路径不变
- 新增 `multipart/form-data` 支持
- 新增 `referenceImages` 文件数组字段
- 有参考图时调用 `openai.images.edit()`
- 无参考图时继续 `openai.images.generate()`
- 默认模型改为 `gpt-image-1.5`
- 参考图模式默认 `input_fidelity=high`
- 结果继续复用你现有的缩略图、COS 上传、DB 保存流程

## 这样改的优点

- 改动面小
- 对现有调用方兼容
- 复用你现成的 COS/base64/缩略图逻辑
- 后面扩展 mask、多图参考、URL 参考图也顺

## 下一步实现时会改哪些文件

如果你确认按这个方案做，下一步我会改这些位置：

- `app/index.js`
- `controllers/openai.js`
- `services/openai.js`
- 新增一个适合 OpenAI 参考图上传的 middleware 文件
- 视情况补充 `API.md`

## 参考

- OpenAI Image generation guide: https://platform.openai.com/docs/guides/image-generation
- OpenAI Images API reference: https://platform.openai.com/docs/api-reference/images

