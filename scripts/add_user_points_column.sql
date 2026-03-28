ALTER TABLE `users`
ADD COLUMN `points` INT NOT NULL DEFAULT 1000 COMMENT '积分' AFTER `avatar`;

UPDATE `users`
SET `points` = 1000
WHERE `points` IS NULL;
