ALTER TABLE `inclusion_items` ADD `rate` decimal(12,2);--> statement-breakpoint
ALTER TABLE `inclusion_items` ADD `amount` decimal(12,2);--> statement-breakpoint
ALTER TABLE `inclusion_items` ADD `isBoqImported` boolean DEFAULT false NOT NULL;