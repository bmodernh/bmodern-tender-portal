CREATE TABLE `project_pricing_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`itemKey` varchar(64) NOT NULL,
	`label` varchar(256) NOT NULL,
	`category` varchar(128) NOT NULL,
	`unit` enum('each','lm','m2','fixed') NOT NULL DEFAULT 'each',
	`tier1Label` text,
	`tier2Label` text,
	`tier3Label` text,
	`tier1Description` text,
	`tier2Description` text,
	`tier3Description` text,
	`tier1ImageUrl` text,
	`tier2ImageUrl` text,
	`tier3ImageUrl` text,
	`tier2CostPerUnit` decimal(12,2) DEFAULT '0',
	`tier3CostPerUnit` decimal(12,2) DEFAULT '0',
	`tier2Qty` int,
	`tier3Qty` int,
	`enabled` boolean NOT NULL DEFAULT true,
	`isCustom` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_pricing_overrides_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `quantities` ADD `mainFloorTileM2` decimal(8,2);--> statement-breakpoint
ALTER TABLE `quantities` ADD `bathroomQty` int;--> statement-breakpoint
ALTER TABLE `quantities` ADD `drivewayM2` decimal(8,2);--> statement-breakpoint
ALTER TABLE `quantities` ADD `wallPlasterM2` decimal(8,2);--> statement-breakpoint
ALTER TABLE `quantities` ADD `ceilingPlasterM2` decimal(8,2);--> statement-breakpoint
ALTER TABLE `quantities` ADD `corniceLm` decimal(8,2);--> statement-breakpoint
ALTER TABLE `quantities` ADD `squareSetQty` int;--> statement-breakpoint
ALTER TABLE `quantities` ADD `garageDoorQty` int;--> statement-breakpoint
ALTER TABLE `quantities` ADD `ceilingInsulationM2` decimal(8,2);--> statement-breakpoint
ALTER TABLE `quantities` ADD `wallInsulationM2` decimal(8,2);--> statement-breakpoint
ALTER TABLE `quantities` ADD `acousticInsulationM2` decimal(8,2);