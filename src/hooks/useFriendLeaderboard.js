import { useCallback, useEffect, useState } from 'react';
import { supabase, isSupabaseEnabled } from '../lib/supabase';

// Returns sorted leaderboard entries: [{ friendCode, name, avatar, weeklyStars, streak, isSelf }]
export function useFriendLeaderboard(currentProfile) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    if (!currentProfile) { setEntries([]); return; }
    const selfEntry = {
      friendCode: currentProfile.friendCode,
      name: currentProfile.name,
      avatar: currentProfile.avatar,
      weeklyStars: currentProfile.weeklyStars || 0,
      streak: currentProfile.streak || 0,
      isSelf: true,
    };

    const codes = (currentProfile.friendCodes || []).filter(Boolean);
    if (codes.length === 0 || !isSupabaseEnabled()) {
      setEntries([selfEntry]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('friendCode, name, avatar, weeklyStars, streak')
        .in('friendCode', codes);

      if (err) throw err;

      const friendEntries = (data || []).map(d => ({
        friendCode: d.friendCode || d.friend_code,
        name: d.name,
        avatar: d.avatar,
        weeklyStars: d.weeklyStars || d.weekly_stars || 0,
        streak: d.streak || 0,
        isSelf: false,
      }));

      const merged = [selfEntry, ...friendEntries].sort((a, b) => b.weeklyStars - a.weeklyStars);
      setEntries(merged);
    } catch (e) {
      setError(e.message || 'fetch_failed');
      setEntries([selfEntry]);
    } finally {
      setLoading(false);
    }
  }, [currentProfile]);

  useEffect(() => { fetchLeaderboard(); }, [fetchLeaderboard]);

  return { entries, loading, error, refresh: fetchLeaderboard };
}
