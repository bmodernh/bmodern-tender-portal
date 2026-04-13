CREATE TABLE `master_package_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packageId` int NOT NULL,
	`section` varchar(128) NOT NULL,
	`item` text NOT NULL,
	`imageUrl` text,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `master_package_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `master_packages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`tier` enum('entry','mid','premium') NOT NULL,
	`tagline` varchar(512),
	`description` text,
	`isRecommended` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	`heroImageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `master_packages_id` PRIMARY KEY(`id`)
);
