ALTER TABLE `profiles` ADD COLUMN IF NOT EXISTS `location` text;
ALTER TABLE `profiles` ADD COLUMN IF NOT EXISTS `website` text;
ALTER TABLE `profiles` ADD COLUMN IF NOT EXISTS `github_username` text;
ALTER TABLE `profiles` ADD COLUMN IF NOT EXISTS `twitter_handle` text;
ALTER TABLE `profiles` ADD COLUMN IF NOT EXISTS `skills` text;
ALTER TABLE `user_settings` ADD COLUMN IF NOT EXISTS `font_size` text DEFAULT 'medium' NOT NULL;
ALTER TABLE `user_settings` ADD COLUMN IF NOT EXISTS `compact_mode` integer DEFAULT false NOT NULL;
