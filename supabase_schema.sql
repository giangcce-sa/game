-- Chạy file này trong Supabase SQL Editor (app.supabase.com → SQL Editor)

-- Bảng profiles: mỗi phụ huynh có thể có nhiều hồ sơ con
CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,  -- client-generated id (p_xxxx)
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  avatar TEXT,
  age TEXT,
  pin_code TEXT,

  -- Currency
  stars INT DEFAULT 0,
  coins INT DEFAULT 20,
  streak INT DEFAULT 0,
  last_day DATE,
  last_daily_claim DATE,

  -- Game levels
  pic_level INT DEFAULT 1,
  mem_level INT DEFAULT 1,
  arc_level INT DEFAULT 1,
  quiz_level INT DEFAULT 1,
  wri_level INT DEFAULT 1,

  -- CEFR
  cefr_level TEXT DEFAULT 'A1',
  cefr_mastery JSONB DEFAULT '{"A1":0,"A2":0,"B1":0,"B2":0}',

  -- Inventory & customization
  owned_items JSONB DEFAULT '["first"]',
  badges JSONB DEFAULT '["first"]',
  equipped_pet TEXT,
  equipped_skin TEXT,

  -- Learning data (jsonb cho linh hoạt)
  analytics JSONB DEFAULT '{}',
  srs_data JSONB DEFAULT '{}',
  failed_seeds JSONB DEFAULT '[]',
  pet_friendship JSONB DEFAULT '{}',
  custom_vocab JSONB DEFAULT '[]',

  -- Curriculum
  selected_grade TEXT DEFAULT 'grade3',
  completed_units JSONB DEFAULT '[]',
  read_stories JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security: mỗi user chỉ thấy profile của mình
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own profiles"
  ON profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Bảng custom_stories (truyện phụ huynh tự tạo)
CREATE TABLE IF NOT EXISTS custom_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE custom_stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own stories"
  ON custom_stories FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index tăng tốc query
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON custom_stories(user_id);

-- Trigger tự cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
