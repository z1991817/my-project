-- 为 images 表添加 title 字段
ALTER TABLE `images` ADD COLUMN `title` VARCHAR(200) DEFAULT NULL COMMENT '图片标题' AFTER `url`;
