CREATE TABLE `company_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`aboutUs` text,
	`tagline` varchar(512),
	`credentials` text,
	`phone` varchar(64),
	`email` varchar(320),
	`website` varchar(256),
	`address` text,
	`logoUrl` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exclusions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`description` text NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exclusions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plan_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(256),
	`imageUrl` text NOT NULL,
	`fileKey` varchar(512),
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plan_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `provisional_sums` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`description` text NOT NULL,
	`amount` decimal(12,2),
	`notes` text,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `provisional_sums_id` PRIMARY KEY(`id`)
);
