CREATE TABLE `project_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`senderType` enum('admin','client') NOT NULL,
	`senderName` varchar(256) NOT NULL,
	`message` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `project_messages_id` PRIMARY KEY(`id`)
);
