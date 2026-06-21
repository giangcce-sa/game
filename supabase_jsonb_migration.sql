-- Phase 0: Chuyển bảng profiles sang mô hình JSONB
-- Toàn bộ profile (camelCase JS object) lưu trong cột `data`.
-- Các cột phục vụ truy vấn (leaderboard bạn bè, sắp xếp) được GENERATED từ `data`
-- nên KHÔNG cần đồng bộ tay và KHÔNG phá vỡ useFriendLeaderboard.js
-- (vốn select: friendCode, name, avatar, weeklyStars, streak).
--
-- Chạy file này trong Supabase SQL Editor. An toàn để chạy lại (idempotent).

-- 1. Tạo bảng mới theo mô hình jsonb (nếu chưa có)
CREATE TABLE IF NOT EXISTS profiles_v2 (
  id      TEXT PRIMARY KEY,                       -- client id (p_xxxx)
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  data    JSONB NOT NULL DEFAULT '{}',            -- toàn bộ profile JS (camelCase)

  -- Cột truy vấn sinh tự động từ `data` (read-only, luôn khớp với data)
  name        TEXT  GENERATED ALWAYS AS (data->>'name') STORED,
  avatar      TEXT  GENERATED ALWAYS AS (data->>'avatar') STORED,
  "friendCode" TEXT GENERATED ALWAYS AS (data->>'friendCode') STORED,
  "weeklyStars" INT GENERATED ALWAYS AS (COALESCE((data->>'weeklyStars')::int, 0)) STORED,
  streak      INT   GENERATED ALWAYS AS (COALESCE((data->>'streak')::int, 0)) STORED,
  stars       INT   GENERATED ALWAYS AS (COALESCE((data->>'stars')::int, 0)) STORED,

  -- updatedAt phục vụ phân giải xung đột last-write-wins (đọc từ data, fallback now())
  updated_at  TIMESTAMPTZ DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 2. RLS: mỗi user chỉ thao tác profile của mình
ALTER TABLE profiles_v2 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own profiles v2" ON profiles_v2;
CREATE POLICY "Users manage own profiles v2"
  ON profiles_v2 FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Index
CREATE INDEX IF NOT EXISTS profiles_v2_user_id_idx ON profiles_v2(user_id);
CREATE INDEX IF NOT EXISTS profiles_v2_friendcode_idx ON profiles_v2("friendCode");

-- 4. Di chuyển dữ liệu từ bảng cũ `profiles` (nếu tồn tại) sang `profiles_v2`.
--    Gói toàn bộ cột cũ thành jsonb rồi loại các cột hạ tầng.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    INSERT INTO profiles_v2 (id, user_id, data, updated_at, created_at)
    SELECT
      p.id,
      p.user_id,
      (to_jsonb(p) - 'user_id' - 'created_at' - 'updated_at') AS data,
      COALESCE(p.updated_at, now()),
      COALESCE(p.created_at, now())
    FROM profiles p
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- 5. Trigger cập nhật updated_at khi data đổi (đồng bộ với updatedAt trong data nếu có)
CREATE OR REPLACE FUNCTION sync_profiles_v2_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = COALESCE(
    NULLIF(NEW.data->>'updatedAt', '')::timestamptz,
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_v2_updated_at ON profiles_v2;
CREATE TRIGGER profiles_v2_updated_at
  BEFORE INSERT OR UPDATE ON profiles_v2
  FOR EACH ROW EXECUTE FUNCTION sync_profiles_v2_updated_at();

-- LƯU Ý: sau khi xác nhận dữ liệu đã sang profiles_v2 đầy đủ, có thể đổi tên:
--   ALTER TABLE profiles RENAME TO profiles_legacy;
--   ALTER TABLE profiles_v2 RENAME TO profiles;
-- (useFriendLeaderboard select friendCode/name/avatar/weeklyStars/streak vẫn chạy
--  vì đó là các generated columns.)
