ALTER TABLE `upgrade_submissions` ADD `signoffIp` varchar(64);--> statement-breakpoint
ALTER TABLE `upgrade_submissions` ADD `signoffUserAgent` text;--> statement-breakpoint
ALTER TABLE `upgrade_submissions` ADD `documentRefId` varchar(32);