ALTER TABLE `notifications` ADD `post_id` integer;--> statement-breakpoint
ALTER TABLE `notifications` ADD `actor_user_id` integer;--> statement-breakpoint
CREATE INDEX `notifications_post_id_idx` ON `notifications` (`post_id`);--> statement-breakpoint
CREATE INDEX `notifications_actor_user_id_idx` ON `notifications` (`actor_user_id`);