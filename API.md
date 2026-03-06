# API 接口文档

## 基础信息

- **Base URL**: `http://localhost:3000/api/v1`
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证说明

分类和图片管理接口需要登录认证，请在请求头中携带 Token：

```
Authorization: Bearer <your_token>
```

获取 Token 请先调用管理员登录接口。

## 响应格式

### 成功响应
```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

### 错误响应
```json
{
  "code": 400,
  "message": "错误信息"
}
```

---

## 1. 分类管理 (Categories)

**注意**: 所有分类接口需要登录认证，路径前缀为 `/admin/categories`

### 1.1 获取分类列表

**接口**: `GET /admin/categories`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 分类名称（模糊搜索） |
| status | number | 否 | 状态：1=启用，0=禁用 |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |

**请求示例**:
```
GET /api/v1/admin/categories?page=1&pageSize=10
GET /api/v1/admin/categories?name=技术&status=1
Authorization: Bearer <your_token>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "total": 3,
    "list": [
      {
        "id": 1,
        "name": "技术",
        "description": "技术相关内容",
        "sort_order": 1,
        "status": 1,
        "created_at": "2026-03-03 10:14:48",
        "updated_at": "2026-03-03 10:14:48"
      }
    ]
  }
}
```

---

### 1.2 获取所有启用的分类

**接口**: `GET /admin/categories/enabled`

**说明**: 用于下拉选择，不分页，只返回启用状态的分类

**请求示例**:
```
GET /api/v1/admin/categories/enabled
Authorization: Bearer <your_token>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": 1,
      "name": "技术"
    },
    {
      "id": 2,
      "name": "生活"
    }
  ]
}
```

---

### 1.3 获取分类详情

**接口**: `GET /admin/categories/:id`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 分类ID |

**请求示例**:
```
GET /api/v1/admin/categories/1
Authorization: Bearer <your_token>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "技术",
    "description": "技术相关内容",
    "sort_order": 1,
    "status": 1,
    "created_at": "2026-03-03T02:14:48.000Z",
    "updated_at": "2026-03-03T02:14:48.000Z"
  }
}
```

---

### 1.4 创建分类

**接口**: `POST /admin/categories`

**请求体**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 分类名称 |
| description | string | 否 | 分类描述 |
| sort_order | number | 否 | 排序顺序，默认 0 |
| status | number | 否 | 状态：1=启用，0=禁用，默认 1 |

**请求示例**:
```json
POST /api/v1/admin/categories
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "name": "科技",
  "description": "科技类内容",
  "sort_order": 4,
  "status": 1
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": 4
  }
}
```

---

### 1.5 更新分类

**接口**: `PUT /admin/categories/:id`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 分类ID |

**请求体**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 分类名称 |
| description | string | 否 | 分类描述 |
| sort_order | number | 否 | 排序顺序 |
| status | number | 否 | 状态：1=启用，0=禁用 |

**请求示例**:
```json
PUT /api/v1/admin/categories/1
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "name": "技术更新",
  "description": "技术相关内容更新",
  "status": 1
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "更新成功"
}
```

---

### 1.6 删除分类

**接口**: `DELETE /admin/categories/:id`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 分类ID |

**请求示例**:
```
DELETE /api/v1/admin/categories/1
Authorization: Bearer <your_token>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

---

## 2. 图片管理 (Images)

**注意**: 所有图片接口需要登录认证，路径前缀为 `/admin/images`

### 2.1 获取图片列表

**接口**: `GET /admin/images`

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category_id | number | 否 | 分类ID（筛选指定分类的图片） |
| description | string | 否 | 图片描述（模糊搜索） |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |

**请求示例**:
```
GET /api/v1/admin/images?page=1&pageSize=10
GET /api/v1/admin/images?category_id=1
GET /api/v1/admin/images?description=风景&category_id=1
Authorization: Bearer <your_token>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "total": 6,
    "list": [
      {
        "id": 1,
        "url": "https://example.com/image1.jpg",
        "description": "示例图片1",
        "prompt": "a beautiful landscape",
        "category_id": 1,
        "category_name": "技术",
        "uploaded_at": "2026-03-03 10:20:43",
        "created_at": "2026-03-03 10:20:43"
      }
    ]
  }
}
```

---

### 2.2 获取图片详情

**接口**: `GET /admin/images/:id`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 图片ID |

**请求示例**:
```
GET /api/v1/admin/images/1
Authorization: Bearer <your_token>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "url": "https://example.com/image1.jpg",
    "description": "示例图片1",
    "prompt": "a beautiful landscape",
    "category_id": 1,
    "category_name": "技术",
    "uploaded_at": "2026-03-03T02:20:43.000Z",
    "created_at": "2026-03-03T02:20:43.000Z",
    "updated_at": "2026-03-03T02:20:43.000Z"
  }
}
```

---

### 2.3 上传图片文件

**接口**: `POST /admin/images/upload`

**请求类型**: `multipart/form-data`

**表单字段**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 图片文件（支持 jpeg, jpg, png, gif, webp，最大 5MB） |
| description | string | 否 | 图片描述 |
| prompt | string | 否 | 提示词 |
| category_id | number | 否 | 分类ID |

**请求示例**:
```
POST /api/v1/admin/images/upload
Content-Type: multipart/form-data
Authorization: Bearer <your_token>

file: [图片文件]
description: 我的图片
prompt: a beautiful sunset
category_id: 1
```

**响应示例**:
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "id": 7,
    "url": "/uploads/image-1234567890-123456789.jpg",
    "filename": "image-1234567890-123456789.jpg"
  }
}
```

---

### 2.4 上传图片（通过URL）

**接口**: `POST /admin/images`

**请求体**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | string | 是 | 图片URL |
| description | string | 否 | 图片描述 |
| prompt | string | 否 | 提示词 |
| category_id | number | 否 | 分类ID |

**请求示例**:
```json
POST /api/v1/admin/images
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "url": "https://example.com/my-image.jpg",
  "description": "我的图片",
  "prompt": "a beautiful sunset over the ocean",
  "category_id": 1
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "id": 7
  }
}
```

---

### 2.5 更新图片

**接口**: `PUT /admin/images/:id`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 图片ID |

**请求体**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| url | string | 否 | 图片URL |
| description | string | 否 | 图片描述 |
| prompt | string | 否 | 提示词 |
| category_id | number | 否 | 分类ID |

**请求示例**:
```json
PUT /api/v1/admin/images/1
Content-Type: application/json
Authorization: Bearer <your_token>

{
  "description": "更新后的图片描述",
  "category_id": 2
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "更新成功"
}
```

---

### 2.6 删除图片

**接口**: `DELETE /admin/images/:id`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | number | 是 | 图片ID |

**请求示例**:
```
DELETE /api/v1/admin/images/1
Authorization: Bearer <your_token>
```

**响应示例**:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 使用场景示例

### 场景1：获取某个分类下的所有图片

1. 先获取分类列表或启用的分类
```
GET /api/v1/admin/categories/enabled
Authorization: Bearer <your_token>
```

2. 根据分类ID获取图片
```
GET /api/v1/admin/images?category_id=1&page=1&pageSize=20
Authorization: Bearer <your_token>
```

### 场景2：上传图片并关联分类

1. 上传图片
```json
POST /api/v1/admin/images
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "url": "https://cdn.example.com/photo.jpg",
  "description": "美丽的风景照",
  "prompt": "mountain landscape at sunset",
  "category_id": 1
}
```

### 场景3：修改图片的分类

```json
PUT /api/v1/admin/images/5
Authorization: Bearer <your_token>
Content-Type: application/json

{
  "category_id": 2
}
```
