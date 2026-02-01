ALTER TABLE `user_settings` ADD `language` text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_seen` integer;