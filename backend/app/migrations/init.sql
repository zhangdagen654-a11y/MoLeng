-- 收集箱表
CREATE TABLE IF NOT EXISTS inbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processed')),
    processed_date DATE
);
CREATE INDEX IF NOT EXISTS idx_inbox_status ON inbox(status);

-- 日记表
CREATE TABLE IF NOT EXISTS diary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE UNIQUE NOT NULL,
    content TEXT NOT NULL,
    source TEXT CHECK(source IN ('manual', 'merged', 'mixed')),
    confirmed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_diary_date ON diary(date);

-- 复盘表
CREATE TABLE IF NOT EXISTS review (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    diary_id INTEGER NOT NULL REFERENCES diary(id),
    event TEXT,
    decision TEXT,
    deviation TEXT,
    attribution TEXT,
    tags TEXT,
    confirmed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_review_diary_id ON review(diary_id);

-- 心得表
CREATE TABLE IF NOT EXISTS insight (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER NOT NULL REFERENCES review(id),
    knowledge TEXT,
    action TEXT,
    related_insight_id INTEGER REFERENCES insight(id),
    confirmed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_insight_review_id ON insight(review_id);
