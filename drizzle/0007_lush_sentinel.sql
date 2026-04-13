CREATE TABLE `boq_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`fileName` varchar(256) NOT NULL,
	`fileKey` text NOT NULL,
	`fileUrl` text NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`status` enum('uploaded','extracting','extracted','confirmed','error') NOT NULL DEFAULT 'uploaded',
	`extractionError` text,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`extractedAt` timestamp,
	CONSTRAINT `boq_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boq_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`boqDocumentId` int NOT NULL,
	`projectId` int NOT NULL,
	`category` varchar(64) NOT NULL,
	`description` text NOT NULL,
	`unit` varchar(32),
	`quantity` decimal(10,2),
	`isConfirmed` boolean NOT NULL DEFAULT false,
	`mappedQuantityField` varchar(64),
	`position` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boq_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portal_tc_acknowledgements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`clientToken` varchar(128) NOT NULL,
	`acknowledgedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(64),
	CONSTRAINT `portal_tc_acknowledgements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `terms_and_conditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`content` text NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `terms_and_conditions_id` PRIMARY KEY(`id`)
);
