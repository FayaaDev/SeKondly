CREATE TABLE IF NOT EXISTS "notification_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"token" text NOT NULL,
	"platform" varchar NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "notification_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"case_likes" boolean DEFAULT true,
	"case_comments" boolean DEFAULT true,
	"new_followers" boolean DEFAULT true,
	"case_approvals" boolean DEFAULT true,
	"mentions" boolean DEFAULT true,
	"weekly_digest" boolean DEFAULT false,
	"push_notifications" boolean DEFAULT true,
	"email_notifications" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "notification_preferences_user_id_unique" UNIQUE("user_id")
);

-- Add constraint for platform enum
ALTER TABLE "notification_tokens" ADD CONSTRAINT "notification_tokens_platform_check" CHECK ("platform" IN ('ios', 'android'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_notification_tokens_user_id" ON "notification_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "idx_notification_tokens_active" ON "notification_tokens"("is_active");
CREATE INDEX IF NOT EXISTS "idx_notification_preferences_user_id" ON "notification_preferences"("user_id");
