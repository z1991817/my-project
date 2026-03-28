CREATE TABLE IF NOT EXISTS `payment_transactions` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '流水ID',
  `order_id`         INT UNSIGNED NOT NULL COMMENT '订单ID',
  `user_id`          INT UNSIGNED NOT NULL COMMENT '用户ID',
  `channel`          VARCHAR(20) NOT NULL COMMENT '支付渠道',
  `transaction_type` VARCHAR(20) NOT NULL COMMENT '流水类型',
  `trade_no`         VARCHAR(100) DEFAULT NULL COMMENT '渠道流水号',
  `status`           VARCHAR(20) NOT NULL COMMENT '流水状态',
  `request_data`     JSON DEFAULT NULL COMMENT '请求数据',
  `response_data`    JSON DEFAULT NULL COMMENT '响应数据',
  `callback_data`    JSON DEFAULT NULL COMMENT '回调数据',
  `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付流水表';
