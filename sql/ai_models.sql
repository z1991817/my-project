CREATE TABLE IF NOT EXISTS `ai_models` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL COMMENT 'model name',
  `model_key` VARCHAR(100) DEFAULT NULL COMMENT 'model key',
  `manufacturer` VARCHAR(100) DEFAULT NULL COMMENT 'model manufacturer',
  `description` VARCHAR(500) DEFAULT NULL COMMENT 'model description',
  `aspect_ratio` VARCHAR(255) DEFAULT NULL COMMENT 'comma separated aspect ratios',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1 visible, 0 hidden',
  `consume_points` INT NOT NULL DEFAULT 0 COMMENT 'points cost',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='ai model config';

INSERT INTO `ai_models` (`name`, `model_key`, `manufacturer`, `description`, `aspect_ratio`, `status`, `consume_points`)
VALUES
('gpt-image-1.5-all', 'gpt-image-1.5-all', 'OpenAI', 'default image model', '1024x1536,1024x1024,1536x1024', 1, 100),
('gpt-4o-image', 'gpt-4o-image', 'OpenAI', 'openai image generation model', '1024x1024,1536x1024,1024x1536', 1, 100),
('gemini-2.5-flash-image-preview', 'gemini-2.5-flash-image-preview', 'Google', 'banana image model', '16:9,4:3,1:1', 1, 120)
ON DUPLICATE KEY UPDATE `name` = `name`;
