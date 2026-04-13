CREATE TABLE `admin_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(128) NOT NULL,
	`passwordHash` varchar(256) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_credentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_credentials_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `change_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`clientToken` varchar(128) NOT NULL,
	`category` varchar(128) NOT NULL,
	`description` text NOT NULL,
	`status` enum('pending','reviewed','actioned') NOT NULL DEFAULT 'pending',
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `change_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`clientToken` varchar(128) NOT NULL,
	`fileName` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`mimeType` varchar(128),
	`fileSizeBytes` int,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `client_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	`lastAccessedAt` timestamp,
	CONSTRAINT `client_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_tokens_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `inclusion_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`imageUrl` text,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inclusion_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientName` varchar(256) NOT NULL,
	`clientEmail` varchar(320),
	`projectAddress` text NOT NULL,
	`proposalNumber` varchar(64) NOT NULL,
	`projectType` varchar(128),
	`buildType` varchar(128),
	`baseContractPrice` decimal(12,2),
	`preliminaryEstimateMin` decimal(12,2),
	`preliminaryEstimateMax` decimal(12,2),
	`status` enum('draft','presented','under_review','accepted','contract_creation','contract_signed','post_contract') NOT NULL DEFAULT 'draft',
	`heroImageUrl` text,
	`tenderExpiryDate` timestamp,
	`portalLockedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quantities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`floorTileM2` decimal(8,2),
	`wallTileM2` decimal(8,2),
	`showerWallTileM2` decimal(8,2),
	`splashbackTileM2` decimal(8,2),
	`featureTileM2` decimal(8,2),
	`tileWastagePct` decimal(5,2),
	`baseTileAllowancePerM2` decimal(8,2),
	`basinMixersQty` int,
	`showerSetsQty` int,
	`bathFillersQty` int,
	`kitchenMixersQty` int,
	`laundryMixersQty` int,
	`toiletsQty` int,
	`basinsQty` int,
	`bathtubsQty` int,
	`kitchenBaseCabinetryLm` decimal(8,2),
	`kitchenOverheadCabinetryLm` decimal(8,2),
	`pantryUnitsQty` int,
	`potDrawerStacksQty` int,
	`utilityDrawerStacksQty` int,
	`binPulloutQty` int,
	`vanityQty` int,
	`vanityWidthMm` int,
	`wardrobeLm` decimal(8,2),
	`robeDrawerPacksQty` int,
	`internalDoorsQty` int,
	`externalDoorsQty` int,
	`doorHandlesQty` int,
	`entranceHardwareQty` int,
	`downlightsQty` int,
	`pendantPointsQty` int,
	`powerPointsQty` int,
	`switchPlatesQty` int,
	`dataPointsQty` int,
	`exhaustFansQty` int,
	`timberHybridM2` decimal(8,2),
	`carpetM2` decimal(8,2),
	`skirtingLm` decimal(8,2),
	`kitchenBenchtopArea` decimal(8,2),
	`islandBenchtopArea` decimal(8,2),
	`vanityStoneTopQty` int,
	`stoneSplashbackArea` decimal(8,2),
	`floorTileAllowancePerM2` decimal(8,2),
	`wallTileAllowancePerM2` decimal(8,2),
	`tapwareAllowance` decimal(10,2),
	`sanitarywareAllowance` decimal(10,2),
	`joineryAllowance` decimal(10,2),
	`stoneAllowance` decimal(10,2),
	`appliancesAllowance` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quantities_id` PRIMARY KEY(`id`),
	CONSTRAINT `quantities_projectId_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
CREATE TABLE `upgrade_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`category` varchar(128) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upgrade_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upgrade_options` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`projectId` int NOT NULL,
	`optionName` varchar(256) NOT NULL,
	`description` text,
	`imageUrl` text,
	`isIncluded` boolean NOT NULL DEFAULT false,
	`priceDelta` decimal(10,2) DEFAULT '0',
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upgrade_options_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upgrade_selections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`clientToken` varchar(128) NOT NULL,
	`upgradeOptionId` int NOT NULL,
	`selected` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `upgrade_selections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `upgrade_submissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`clientToken` varchar(128) NOT NULL,
	`totalUpgradeCost` decimal(12,2),
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`lockedAt` timestamp,
	`notes` text,
	CONSTRAINT `upgrade_submissions_id` PRIMARY KEY(`id`)
);
