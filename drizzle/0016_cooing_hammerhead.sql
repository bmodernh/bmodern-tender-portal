ALTER TABLE `upgrade_submissions` ADD `signoffName` text;--> statement-breakpoint
ALTER TABLE `upgrade_submissions` ADD `signoffSignature` text;--> statement-breakpoint
ALTER TABLE `upgrade_submissions` ADD `signedOffAt` timestamp;