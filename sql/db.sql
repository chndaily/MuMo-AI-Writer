CREATE TABLE novels (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  published_date TIMESTAMP WITH TIME ZONE,
  series_index VARCHAR(50),
  state VARCHAR(20) NOT NULL CHECK (state IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  cover_url VARCHAR(512)
);

CREATE TABLE acts (
  id VARCHAR(64) PRIMARY KEY,
  novel_id VARCHAR(64) REFERENCES novels(id),
  title VARCHAR(255),
  numerate BOOLEAN NOT NULL DEFAULT true,
  state VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sort_order INTEGER
);

CREATE TABLE chapters (
  id VARCHAR(64) PRIMARY KEY,
  act_id VARCHAR(64) NOT NULL REFERENCES acts(id) ON DELETE CASCADE,
  title VARCHAR(255),
  numerate BOOLEAN NOT NULL DEFAULT true,
  state VARCHAR(20) NOT NULL CHECK (state IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sort_order INTEGER,
  
  -- 索引优化
  INDEX idx_chapters_act_id (act_id),
  INDEX idx_chapters_sort_order (sort_order)
);

-- 章节与场景的多对多关联表
CREATE TABLE chapter_scenes (
  chapter_id VARCHAR(64) NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  scene_id VARCHAR(64) NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  
  PRIMARY KEY (chapter_id, scene_id),
  INDEX idx_chapter_scenes_scene_id (scene_id)
);

CREATE TABLE codex_fields (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  novel_id VARCHAR(64) NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);


CREATE TABLE codex_entries (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(255),
  aliases VARCHAR(255)[],
  tags VARCHAR(255)[],
  description TEXT,
  notes TEXT,
  always_include BOOLEAN NOT NULL DEFAULT false,
  do_not_track BOOLEAN NOT NULL DEFAULT false,
  no_auto_include BOOLEAN NOT NULL DEFAULT false,
  hide_from_ai BOOLEAN NOT NULL DEFAULT false,
  match_exclusions VARCHAR(255)[],
  match_case_sensitive BOOLEAN NOT NULL DEFAULT false,
  prompt_inclusions VARCHAR(255)[],
  novel_id VARCHAR(64) NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  codex_field_ids VARCHAR(64)[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE ccodex_field_values (
  id VARCHAR(64) PRIMARY KEY,