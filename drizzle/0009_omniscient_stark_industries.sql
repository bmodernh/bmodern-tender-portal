CREATE TABLE `inclusion_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`imageUrl` text,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inclusion_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inclusion_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`categoryId` int NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`qty` decimal(10,2),
	`unit` varchar(32) DEFAULT 'each',
	`description` text,
	`specLevel` varchar(128),
	`upgradeEligible` boolean NOT NULL DEFAULT false,
	`included` boolean NOT NULL DEFAULT true,
	`boqFieldKey` varchar(64),
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inclusion_items_id` PRIMARY KEY(`id`)
);
