-- 为 images 表增加缩略图字段（base64）
ALTER TABLE `images`
  ADD COLUMN `thumbnail` MEDIUMTEXT DEFAULT NULL COMMENT '缩略图base64(268x358)' AFTER `source_url`;
