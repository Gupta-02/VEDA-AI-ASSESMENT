CREATE TABLE `answerRegions` (
	`id` varchar(24) NOT NULL,
	`assessmentId` varchar(24) NOT NULL,
	`questionId` varchar(24),
	`pageNumber` int NOT NULL,
	`topPercent` int NOT NULL,
	`leftPercent` int NOT NULL,
	`widthPercent` int NOT NULL,
	`heightPercent` int NOT NULL,
	`label` varchar(255),
	`confidence` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `answerRegions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessmentQuestions` (
	`id` varchar(24) NOT NULL,
	`assessmentId` varchar(24) NOT NULL,
	`questionNumber` varchar(64) NOT NULL,
	`sortOrder` int NOT NULL,
	`text` text NOT NULL,
	`marks` int,
	`mappingStatus` enum('mapped','needs_review','unanswered','unmatched') NOT NULL DEFAULT 'needs_review',
	`extractedAnswer` text,
	`confidence` int NOT NULL DEFAULT 0,
	`suggestedScore` int,
	`teacherScore` int,
	`teacherFeedback` text,
	`reviewDecision` enum('pending','approved','adjusted') NOT NULL DEFAULT 'pending',
	`answerPage` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessmentQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessmentReviewEvents` (
	`id` varchar(24) NOT NULL,
	`assessmentId` varchar(24) NOT NULL,
	`questionId` varchar(24) NOT NULL,
	`userId` int NOT NULL,
	`decision` enum('approved','adjusted') NOT NULL,
	`score` int,
	`note` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assessmentReviewEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assessmentSessions` (
	`id` varchar(24) NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`studentName` varchar(255),
	`stage` enum('draft','extracting','mapped','reviewed') NOT NULL DEFAULT 'draft',
	`questionPaperName` varchar(512),
	`questionPaperKey` varchar(1024),
	`questionPaperUrl` varchar(2048),
	`answerSheetName` varchar(512),
	`answerSheetKey` varchar(1024),
	`answerSheetUrl` varchar(2048),
	`activeQuestionId` varchar(24),
	`activeAnswerPage` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessmentSessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
ALTER TABLE `answerRegions` ADD CONSTRAINT `answerRegions_assessmentId_assessmentSessions_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `assessmentSessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `answerRegions` ADD CONSTRAINT `answerRegions_questionId_assessmentQuestions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `assessmentQuestions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentQuestions` ADD CONSTRAINT `assessmentQuestions_assessmentId_assessmentSessions_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `assessmentSessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentReviewEvents` ADD CONSTRAINT `assessmentReviewEvents_assessmentId_assessmentSessions_id_fk` FOREIGN KEY (`assessmentId`) REFERENCES `assessmentSessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentReviewEvents` ADD CONSTRAINT `assessmentReviewEvents_questionId_assessmentQuestions_id_fk` FOREIGN KEY (`questionId`) REFERENCES `assessmentQuestions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentReviewEvents` ADD CONSTRAINT `assessmentReviewEvents_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `assessmentSessions` ADD CONSTRAINT `assessmentSessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `answerRegions_assessment_question_idx` ON `answerRegions` (`assessmentId`,`questionId`);--> statement-breakpoint
CREATE INDEX `assessmentQuestions_assessment_sort_idx` ON `assessmentQuestions` (`assessmentId`,`sortOrder`);--> statement-breakpoint
CREATE INDEX `assessmentReviewEvents_question_created_idx` ON `assessmentReviewEvents` (`questionId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `assessmentSessions_user_updated_idx` ON `assessmentSessions` (`userId`,`updatedAt`);