CREATE TABLE `custom_item_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`clientToken` varchar(128) NOT NULL,
	`itemName` varchar(256) NOT NULL,
	`description` text,
	`preferredBrand` varchar(256),
	`referenceUrl` text,
	`quantity` int DEFAULT 1,
	`room` varchar(128),
	`status` enum('submitted','under_review','priced','approved','declined') NOT NULL DEFAULT 'submitted',
	`adminPrice` decimal(12,2),
	`adminNotes` text,
	`adminRespondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `custom_item_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `upgrade_submissions` ADD `adminResponsePrice` decimal(12,2);--> statement-breakpoint
ALTER TABLE `upgrade_submissions` ADD `adminResponseNotes` text;--> statement-breakpoint
ALTER TABLE `upgrade_submissions` ADD `adminRespondedAt` timestamp;