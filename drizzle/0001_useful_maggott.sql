CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`keywordId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`message` text NOT NULL,
	`oldPosition` int,
	`newPosition` int,
	`isRead` int NOT NULL DEFAULT 0,
	`sentToSlack` int NOT NULL DEFAULT 0,
	`sentToEmail` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gscTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`siteUrl` text NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gscTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `gscTokens_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `keywords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`keyword` varchar(255) NOT NULL,
	`url` text NOT NULL,
	`location` varchar(100) DEFAULT 'Brazil',
	`targetPosition` int DEFAULT 1,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `keywords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rankings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`keywordId` int NOT NULL,
	`userId` int NOT NULL,
	`position` int,
	`impressions` int DEFAULT 0,
	`clicks` int DEFAULT 0,
	`ctr` varchar(10) DEFAULT '0',
	`date` varchar(10) NOT NULL,
	`week` int NOT NULL,
	`year` int NOT NULL,
	`change` int DEFAULT 0,
	`changeType` enum('up','down','stable') DEFAULT 'stable',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rankings_id` PRIMARY KEY(`id`)
);
