-- CreateTable
CREATE TABLE "Day" (
    "date" TEXT NOT NULL PRIMARY KEY,
    "rating" INTEGER,
    "note" TEXT
);

-- CreateTable
CREATE TABLE "schedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day_of_week" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT,
    "room" TEXT
);

-- CreateTable
CREATE TABLE "topics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "module" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME
);

-- CreateTable
CREATE TABLE "todos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'daily',
    "due_date" TEXT,
    "time" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "source_topic_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    CONSTRAINT "todos_source_topic_id_fkey" FOREIGN KEY ("source_topic_id") REFERENCES "topics" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "amount" REAL NOT NULL,
    "party" TEXT,
    "reason" TEXT,
    "date" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "prayers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "quran_log" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "amount" TEXT,
    "match_score" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "quran_goals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reference" TEXT NOT NULL,
    "reference_text" TEXT,
    "target_date" TEXT,
    "surah_number" INTEGER,
    "total_ayahs" INTEGER,
    "memorized_ayahs" INTEGER NOT NULL DEFAULT 0,
    "ayahs_per_session" INTEGER NOT NULL DEFAULT 5,
    "achieved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "achieved_at" DATETIME
);

-- CreateTable
CREATE TABLE "topic_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "topic_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "minutes" INTEGER,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "theme" TEXT NOT NULL DEFAULT 'light',
    "language" TEXT NOT NULL DEFAULT 'uz',
    "city" TEXT NOT NULL DEFAULT 'Tashkent',
    "country" TEXT NOT NULL DEFAULT 'Uzbekistan',
    "background_type" TEXT NOT NULL DEFAULT 'preset',
    "background_preset_id" TEXT DEFAULT 'aurora',
    "background_image_path" TEXT,
    "background_position" TEXT NOT NULL DEFAULT 'center',
    "glass_opacity" TEXT NOT NULL DEFAULT 'transparent',
    "accent_color" TEXT NOT NULL DEFAULT 'blue',
    "font_scale" TEXT NOT NULL DEFAULT 'md',
    "profile_name" TEXT,
    "profile_image_path" TEXT,
    "pin_enabled" BOOLEAN NOT NULL DEFAULT false,
    "pin_hash" TEXT,
    "pin_lock_timeout" TEXT NOT NULL DEFAULT 'immediate',
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "skills" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "icon" TEXT,
    "description" TEXT,
    "target_date" TEXT,
    "plan_minutes" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "skill_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "skill_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "minutes" INTEGER,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "skill_sessions_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hadith_entries" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "number" INTEGER NOT NULL,
    "book_name" TEXT NOT NULL DEFAULT 'Sahih al-Bukhari',
    "link" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'new',
    "text_arabic" TEXT,
    "text_ru" TEXT,
    "text_en" TEXT,
    "memorized_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "hadith_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "hadith_id" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "minutes" INTEGER,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hadith_sessions_hadith_id_fkey" FOREIGN KEY ("hadith_id") REFERENCES "hadith_entries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "prayers_date_name_key" ON "prayers"("date", "name");

-- CreateIndex
CREATE UNIQUE INDEX "hadith_entries_number_key" ON "hadith_entries"("number");

