import { useRef, useCallback } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

const OFFLINE_QUEUE_KEY = 'vhta_sync_queue';
const TABLE = 'profiles_v2'; // jsonb-model table (xem supabase_jsonb_migration.sql)

function loadQueue() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]'); } catch { return []; }
}

function saveQueue(q) {
  try { localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q)); } catch {}
}

// Đóng gói profile JS (camelCase) thành 1 row jsonb cho Supabase
function toRow(profile, userId) {
  return {
    id: profile.id,
    user_id: userId,
    data: profile, // toàn bộ profile nằm trong cột jsonb `data`
  };
}

export function useSync(userId) {
  const debounceRef = useRef(null);

  const upsertProfile = useCallback(async (profile) => {
    if (!isSupabaseEnabled() || !userId || !profile?.id) return;
    // Đảm bảo có updatedAt để phân giải xung đột last-write-wins
    const stamped = { ...profile, updatedAt: profile.updatedAt || new Date().toISOString() };
    const { error } = await supabase
      .from(TABLE)
      .upsert(toRow(stamped, userId), { onConflict: 'id' });
    if (error) {
      const queue = loadQueue();
      queue.push({ type: 'upsert_profile', payload: stamped, ts: Date.now() });
      saveQueue(queue);
    }
  }, [userId]);

  const upsertProfileDebounced = useCallback((profile) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => upsertProfile(profile), 2000);
  }, [upsertProfile]);

  // Đọc về toàn bộ profile của user, unwrap cột `data` → mảng profile JS
  const loadProfiles = useCallback(async () => {
    if (!isSupabaseEnabled() || !userId) return null;
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, data, updated_at')
      .eq('user_id', userId)
      .order('created_at');
    if (error || !data) return null;
    return data.map(row => ({
      ...(row.data || {}),
      id: row.id,
      updatedAt: row.data?.updatedAt || row.updated_at,
    }));
  }, [userId]);

  const flushOfflineQueue = useCallback(async () => {
    if (!isSupabaseEnabled() || !userId) return;
    const queue = loadQueue();
    if (queue.length === 0) return;
    const remaining = [];
    for (const item of queue) {
      try {
        if (item.type === 'upsert_profile') {
          const { error } = await supabase
            .from(TABLE)
            .upsert(toRow(item.payload, userId), { onConflict: 'id' });
          if (error) remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }
    saveQueue(remaining);
  }, [userId]);

  return { upsertProfile, upsertProfileDebounced, loadProfiles, flushOfflineQueue };
}
