-- Supabase 数据库表创建脚本
-- 请在 Supabase 项目的 SQL 编辑器中执行此脚本

-- 创建小说表
CREATE TABLE IF NOT EXISTS public.novels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    genre TEXT,
    word_count INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    description TEXT,
    tags TEXT[],
    cover_image TEXT,
    author TEXT,
    target_word_count INTEGER DEFAULT 100000,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- 创建角色表
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    role TEXT,
    appearance TEXT,
    personality TEXT,
    background TEXT,
    relationships TEXT,
    abilities TEXT,
    character_arc TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- 创建大纲表
CREATE TABLE IF NOT EXISTS public.outlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT,
    order_num INTEGER DEFAULT 0,
    parent_id UUID REFERENCES outlines(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- 创建地点表
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT,
    importance TEXT,
    geography TEXT,
    climate TEXT,
    politics TEXT,
    economy TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- 创建文化设定表
CREATE TABLE IF NOT EXISTS public.cultures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'culture',
    tags TEXT[],
    traditions TEXT,
    values TEXT,
    arts TEXT,
    religion TEXT,
    language TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- 创建科技设定表
CREATE TABLE IF NOT EXISTS public.technologies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'technology',
    tags TEXT[],
    level TEXT,
    applications TEXT,
    limitations TEXT,
    core_tech TEXT,
    impact TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- 创建魔法设定表
CREATE TABLE IF NOT EXISTS public.magics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'magic',
    tags TEXT[],
    sources TEXT,
    rules TEXT,
    spells TEXT,
    system TEXT,
    items TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- 创建历史设定表
CREATE TABLE IF NOT EXISTS public.histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'history',
    tags TEXT[],
    timeline TEXT,
    events TEXT,
    figures TEXT,
    periods TEXT,
    consequences TEXT,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- 创建世界观设定通用表（用于存储所有类型的世界观设定）
CREATE TABLE IF NOT EXISTS public.world_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    novel_id UUID REFERENCES novels(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT, -- 'culture', 'technology', 'magic', 'history'
    tags TEXT[],
    details JSONB, -- 存储特定类型的详细信息
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_modified TIMESTAMPTZ DEFAULT NOW()
);

-- 启用行级安全性（可选，用于多用户支持）
ALTER TABLE novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultures ENABLE ROW LEVEL SECURITY;
ALTER TABLE technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE magics ENABLE ROW LEVEL SECURITY;
ALTER TABLE histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_settings ENABLE ROW LEVEL SECURITY;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_characters_novel_id ON characters(novel_id);
CREATE INDEX IF NOT EXISTS idx_outlines_novel_id ON outlines(novel_id);
CREATE INDEX IF NOT EXISTS idx_outlines_parent_id ON outlines(parent_id);
CREATE INDEX IF NOT EXISTS idx_locations_novel_id ON locations(novel_id);
CREATE INDEX IF NOT EXISTS idx_cultures_novel_id ON cultures(novel_id);
CREATE INDEX IF NOT EXISTS idx_technologies_novel_id ON technologies(novel_id);
CREATE INDEX IF NOT EXISTS idx_magics_novel_id ON magics(novel_id);
CREATE INDEX IF NOT EXISTS idx_histories_novel_id ON histories(novel_id);
CREATE INDEX IF NOT EXISTS idx_world_settings_novel_id ON world_settings(novel_id);
CREATE INDEX IF NOT EXISTS idx_world_settings_type ON world_settings(type);

-- 创建存储过程来初始化表（如果不存在）
-- 注意：这些存储过程需要在 Supabase 中手动创建
/*
CREATE OR REPLACE FUNCTION create_novels_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- 表已通过上面的 CREATE TABLE IF NOT EXISTS 创建
    -- 这里可以添加额外的初始化逻辑
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_characters_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- 表已通过上面的 CREATE TABLE IF NOT EXISTS 创建
    -- 这里可以添加额外的初始化逻辑
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_outlines_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- 表已通过上面的 CREATE TABLE IF NOT EXISTS 创建
    -- 这里可以添加额外的初始化逻辑
END;
$$ LANGUAGE plpgsql;
*/