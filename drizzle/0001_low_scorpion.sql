DROP INDEX `assessmentSessions_user_updated_idx` ON `assessmentSessions`;--> statement-breakpoint
ALTER TABLE `assessmentReviewEvents` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `assessmentSessions` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `assessmentSessions` ADD `ownerKey` varchar(128) DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `assessmentSessions_owner_updated_idx` ON `assessmentSessions` (`ownerKey`,`updatedAt`);