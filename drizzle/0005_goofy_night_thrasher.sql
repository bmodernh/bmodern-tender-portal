CREATE TABLE `client_item_selections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`clientToken` varchar(128) NOT NULL,
	`itemKey` varchar(64) NOT NULL,
	`selectedTier` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_item_selections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upgrade_pricing_rules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemKey` varchar(64) NOT NULL,
	`label` varchar(128) NOT NULL,
	`category` varchar(64) NOT NULL,
	`unit` enum('each','lm','m2','fixed') NOT NULL DEFAULT 'each',
	`tier1Label` varchar(256),
	`tier1ImageUrl` text,
	`tier2Label` varchar(256),
	`tier2CostPerUnit` decimal(10,2) DEFAULT '0',
	`tier2ImageUrl` text,
	`tier2Description` text,
	`tier3Label` varchar(256),
	`tier3CostPerUnit` decimal(10,2) DEFAULT '0',
	`tier3ImageUrl` text,
	`tier3Description` text,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upgrade_pricing_rules_id` PRIMARY KEY(`id`),
	CONSTRAINT `upgrade_pricing_rules_itemKey_unique` UNIQUE(`itemKey`)
);
