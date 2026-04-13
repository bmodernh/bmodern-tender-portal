ALTER TABLE `inclusion_categories` MODIFY COLUMN `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `inclusion_items` MODIFY COLUMN `name` text NOT NULL;--> statement-breakpoint
ALTER TABLE `upgrade_pricing_rules` MODIFY COLUMN `label` varchar(512) NOT NULL;--> statement-breakpoint
ALTER TABLE `upgrade_pricing_rules` MODIFY COLUMN `tier1Label` text;--> statement-breakpoint
ALTER TABLE `upgrade_pricing_rules` MODIFY COLUMN `tier2Label` text;--> statement-breakpoint
ALTER TABLE `upgrade_pricing_rules` MODIFY COLUMN `tier3Label` text;