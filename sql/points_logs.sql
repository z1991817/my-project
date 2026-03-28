CREATE TABLE IF NOT EXISTS `points_logs` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '流水ID',
  `user_id`       INT UNSIGNED NOT NULL COMMENT '用户ID',
  `change_type`   VARCHAR(32) NOT NULL COMMENT '积分变更类型',
  `change_amount` INT NOT NULL COMMENT '积分变更值',
  `balance_after` INT NOT NULL COMMENT '变更后积分余额',
  `order_id`      INT UNSIGNED DEFAULT NULL COMMENT '关联订单ID',
  `remark`        VARCHAR(255) DEFAULT NULL COMMENT '备注',
  `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_change_type` (`change_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分流水表';
