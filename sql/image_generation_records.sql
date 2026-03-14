-- 图片生成记录表
-- 支持文生图、图生图等多种生成类型

CREATE TABLE IF NOT EXISTS `image_generation_records` (
  `id`              INT UNSIGNED    NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `session_id`      VARCHAR(36)     NOT NULL COMMENT '会话ID（UUID v4，后端生成）',
  `user_id`         INT UNSIGNED    NOT NULL COMMENT '用户ID',
  `generation_type` VARCHAR(20)     NOT NULL DEFAULT 'text-to-image' COMMENT '生成类型：text-to-image/image-to-image',
  `prompt`          TEXT            DEFAULT NULL COMMENT '文本提示词（文生图必填）',
  `source_image_url` VARCHAR(500)   DEFAULT NULL COMMENT '源图片URL（图生图必填）',
  `model`           VARCHAR(50)     NOT NULL DEFAULT 'gpt-image-1.5-all' COMMENT '模型名称',
  `size`            VARCHAR(20)     NOT NULL DEFAULT '1024x1536' COMMENT '图片尺寸',
  `quality`         VARCHAR(20)     NOT NULL DEFAULT 'medium' COMMENT '图片质量',
  `style`           VARCHAR(20)     NOT NULL DEFAULT 'vivid' COMMENT '图片风格',
  `n`               TINYINT         NOT NULL DEFAULT 1 COMMENT '生成图片数量',
  `third_party_url` VARCHAR(500)    DEFAULT NULL COMMENT '第三方返回的图片URL',
  `cos_url`         VARCHAR(500)    DEFAULT NULL COMMENT 'COS图片URL',
  `upload_task_id`  VARCHAR(64)     DEFAULT NULL COMMENT '上传任务ID',
  `status`          VARCHAR(20)     NOT NULL DEFAULT 'pending' COMMENT '状态：pending/uploaded/failed',
  `error_message`   VARCHAR(500)    DEFAULT NULL COMMENT '错误信息',
  `created_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  INDEX `idx_session_id` (`session_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_generation_type` (`generation_type`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_user_type_created` (`user_id`, `generation_type`, `created_at`),
  UNIQUE KEY `uk_upload_task_id` (`upload_task_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图片生成记录表（支持文生图、图生图等）';
