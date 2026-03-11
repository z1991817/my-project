-- 为 images 表增加 OpenAI 上传任务相关字段
ALTER TABLE `images`
  ADD COLUMN `source_url` VARCHAR(500) DEFAULT NULL COMMENT '源图URL（第三方）' AFTER `url`,
  ADD COLUMN `upload_task_id` VARCHAR(64) DEFAULT NULL COMMENT '上传任务ID' AFTER `category_id`,
  ADD COLUMN `upload_status` VARCHAR(20) DEFAULT NULL COMMENT '上传状态' AFTER `upload_task_id`,
  ADD COLUMN `upload_error` VARCHAR(500) DEFAULT NULL COMMENT '上传错误信息' AFTER `upload_status`,
  ADD UNIQUE KEY `uk_upload_task_id` (`upload_task_id`);
