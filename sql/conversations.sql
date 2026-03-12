-- =====================================================
-- 对话历史记录表
-- =====================================================
-- 用途：存储用户与 AI 的多轮对话历史，支持追加对话功能
-- 创建时间：2026-03-11
-- =====================================================

CREATE TABLE IF NOT EXISTS conversations (
  -- 主键
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '对话记录ID',

  -- 会话标识
  session_id VARCHAR(36) NOT NULL COMMENT '会话ID（UUID v4格式），同一会话的多轮对话共享此ID',

  -- 对话角色
  role ENUM('user', 'assistant') NOT NULL COMMENT '对话角色：user=用户输入, assistant=AI回复',

  -- 对话内容（核心字段）
  content TEXT NOT NULL COMMENT '对话内容：用户输入的原始文本 或 AI返回的完整原始内容（包括JSON、进度提示、图片链接等）',

  -- 关联图片
  image_id INT UNSIGNED NULL COMMENT '关联的图片ID（如果AI生成了图片）',

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  -- 索引优化
  INDEX idx_session_id (session_id),
  INDEX idx_created_at (created_at),
  INDEX idx_session_created (session_id, created_at),

  -- 外键约束
  FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE SET NULL

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='对话历史记录表';

-- =====================================================
-- 性能优化说明
-- =====================================================
-- 1. idx_session_id: 单列索引，用于快速定位某个会话的所有记录
-- 2. idx_created_at: 单列索引，用于定期清理过期数据
-- 3. idx_session_created: 复合索引，覆盖最常见的查询场景（按会话ID查询并按时间排序）
-- 4. content 使用 TEXT 类型，支持存储长文本（最大 64KB）
-- 5. 使用 utf8mb4 字符集，支持 emoji 和特殊字符
-- =====================================================
