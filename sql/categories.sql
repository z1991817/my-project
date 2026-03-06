-- 分类表
CREATE TABLE IF NOT EXISTS `categories` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(100)    NOT NULL COMMENT '分类名称',
  `description` VARCHAR(500)    DEFAULT NULL COMMENT '分类描述',
  `sort_order`  INT             NOT NULL DEFAULT 0 COMMENT '排序顺序，数字越小越靠前',
  `status`      TINYINT         NOT NULL DEFAULT 1 COMMENT '状态: 1=启用 0=禁用',
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分类表';

-- 插入示例数据
INSERT INTO `categories` (`name`, `description`, `sort_order`) VALUES
('技术', '技术相关内容', 1),
('生活', '生活相关内容', 2),
('娱乐', '娱乐相关内容', 3);
