CREATE TABLE "case_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "case_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "case_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"case_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"history" text NOT NULL,
	"specialty" varchar NOT NULL,
	"author_id" varchar NOT NULL,
	"is_approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"approved_at" timestamp,
	"approved_by" varchar,
	"image_urls" text[],
	"likes_count" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"views_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"file_name" varchar NOT NULL,
	"file_url" varchar NOT NULL,
	"file_type" varchar NOT NULL,
	"is_approved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"approved_at" timestamp,
	"approved_by" varchar,
	"rejected_at" timestamp,
	"rejected_by" varchar,
	"rejection_reason" text
);
--> statement-breakpoint
CREATE TABLE "hidden_specialties" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"specialty" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"related_id" integer,
	"from_user_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" varchar NOT NULL,
	"following_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"username" varchar,
	"password" varchar NOT NULL,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"phone" varchar,
	"medical_board" varchar,
	"fellowship" varchar,
	"experience" varchar,
	"institution" varchar,
	"specialty" varchar,
	"is_approved" boolean DEFAULT false,
	"is_admin" boolean DEFAULT false,
	"approved_at" timestamp,
	"approved_by" varchar,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");