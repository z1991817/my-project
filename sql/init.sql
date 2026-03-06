-- 后台管理系统初始化 SQL
-- 执行前请确保已创建对应数据库

CREATE TABLE IF NOT EXISTS `admin_users` (
  `id`         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `username`   VARCHAR(50)     NOT NULL UNIQUE COMMENT '用户名',
  `password`   VARCHAR(255)    NOT NULL COMMENT 'bcrypt 加密密码',
  `nickname`   VARCHAR(100)    DEFAULT NULL COMMENT '昵称',
  `role`       TINYINT         NOT NULL DEFAULT 1 COMMENT '角色: 1=管理员 2=超级管理员',
  `status`     TINYINT         NOT NULL DEFAULT 1 COMMENT '状态: 1=启用 0=禁用',
  `last_login` DATETIME        DEFAULT NULL COMMENT '最后登录时间',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台管理员表';

-- 默认超级管理员账号: admin / 123456
-- 密码为 bcrypt hash，salt rounds=10
INSERT INTO `admin_users` (`username`, `password`, `nickname`, `role`, `status`)
VALUES (
  'admin',
  '$2b$10$W8E7B46K3CXAhX/PF8ynY.tz3KM4/ade0mRZK2mN39M28Oia6viui',
  '超级管理员',
  2,
  1
) ON DUPLICATE KEY UPDATE `id` = `id`;
