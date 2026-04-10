-- 全文搜索虚拟表（trigram 分词支持中文）
CREATE VIRTUAL TABLE IF NOT EXISTS fts_content USING fts5(
    source_type,
    source_id UNINDEXED,
    title,
    body,
    tokenize='trigram'
);
