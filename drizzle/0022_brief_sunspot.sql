CREATE TABLE `approval_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`category` varchar(128),
	`sitePhotoUrl` text,
	`planImageUrl` text,
	`status` enum('pending','approved','change_requested') NOT NULL DEFAULT 'pending',
	`clientResponse` text,
	`respondedBy` varchar(256),
	`respondedAt` timestamp,
	`createdBy` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `meeting_minutes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`meetingDate` timestamp NOT NULL,
	`location` varchar(256),
	`attendees` text,
	`agenda` text,
	`notes` text,
	`actionItems` text,
	`builderName` varchar(256),
	`builderSignature` text,
	`clientName` varchar(256),
	`clientSignature` text,
	`clientSignedAt` timestamp,
	`clientIp` varchar(64),
	`createdBy` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `meeting_minutes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`category` varchar(128) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`mimeType` varchar(128),
	`fileSizeBytes` int,
	`requiresSignature` boolean NOT NULL DEFAULT false,
	`clientSignature` text,
	`clientSignedName` varchar(256),
	`clientSignedAt` timestamp,
	`clientSignedIp` varchar(64),
	`uploadedBy` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_update_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteUpdateId` int NOT NULL,
	`authorName` varchar(256) NOT NULL,
	`authorType` enum('admin','client') NOT NULL,
	`comment` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_update_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_update_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`siteUpdateId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`fileKey` varchar(512),
	`caption` varchar(512),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_update_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_updates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`stage` varchar(64),
	`createdBy` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_updates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `variations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`costImpact` decimal(12,2) DEFAULT '0',
	`supportingDocUrls` text,
	`status` enum('pending','approved','declined') NOT NULL DEFAULT 'pending',
	`builderName` varchar(256),
	`builderSignature` text,
	`clientName` varchar(256),
	`clientSignature` text,
	`clientSignedAt` timestamp,
	`clientIp` varchar(64),
	`createdBy` varchar(256),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `variations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `project_pricing_overrides` ADD `baseQty` decimal(12,2) DEFAULT '0';