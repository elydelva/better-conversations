CREATE TABLE `bc_block_registry` (
	`type` text PRIMARY KEY NOT NULL,
	`schema_json` text NOT NULL,
	`is_built_in` integer DEFAULT false NOT NULL,
	`registered_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bc_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`author_id` text NOT NULL,
	`type` text NOT NULL,
	`body` text,
	`metadata` text,
	`thread_parent_id` text,
	`status` text DEFAULT 'published' NOT NULL,
	`refusal_reason` text,
	`flagged_at` integer,
	`edited_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`conversation_id`) REFERENCES `bc_conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_id`) REFERENCES `bc_chatters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bc_chatter_permissions` (
	`id` text PRIMARY KEY NOT NULL,
	`chatter_id` text NOT NULL,
	`action` text NOT NULL,
	`scope` text,
	`granted` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`chatter_id`) REFERENCES `bc_chatters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bc_chatters` (
	`id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`metadata` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bc_conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text,
	`status` text DEFAULT 'open' NOT NULL,
	`entity_type` text,
	`entity_id` text,
	`created_by` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bc_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`chatter_id` text NOT NULL,
	`role` text NOT NULL,
	`joined_at` integer NOT NULL,
	`left_at` integer,
	`last_read_at` integer,
	`last_seen_at` integer,
	`typing_until` integer,
	`metadata` text,
	FOREIGN KEY (`conversation_id`) REFERENCES `bc_conversations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`chatter_id`) REFERENCES `bc_chatters`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bc_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`level` text NOT NULL,
	`scope_id` text NOT NULL,
	`policy` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `policies_level_scope_unique` ON `bc_policies` (`level`,`scope_id`);--> statement-breakpoint
CREATE TABLE `bc_role_registry` (
	`name` text PRIMARY KEY NOT NULL,
	`extends` text,
	`policy` text NOT NULL,
	`is_built_in` integer DEFAULT false NOT NULL,
	`registered_at` integer NOT NULL
);
