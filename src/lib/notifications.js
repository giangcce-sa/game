// Notification helper — uses Web Notifications API + Service Worker showNotification.
// MVP: in-app scheduling (works while SPA is open or backgrounded but installed as PWA).
// Cross-device push (works when phone offline) requires backend VAPID setup — left as Phase 2.

const PREF_KEY = 'vhta_notify_enabled';
const LAST_SHOWN_KEY = 'vhta_notify_last_shown';

const REMINDER_MESSAGES = [
  { title: '🦉 Cú đang đợi bé!', body: 'Hôm nay bé chưa học tiếng Anh với Cú. Vào chơi 10 phút nhé?' },
  { title: '⭐ Sao đang chờ bé!', body: 'Bé đã giữ chuỗi {streak} ngày — đừng để mất hôm nay nha!' },
  { title: '📖 Truyện hôm nay đã sẵn sàng', body: 'Cú vừa tạo một câu chuyện mới cho bé. Vào đọc thử nhé!' },
  { title: '🎁 Rương ngày đang chờ', body: 'Chỉ 3 game ngắn là bé mở được rương quà hôm nay rồi!' },
];

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export function isReminderEnabled() {
  try { return localStorage.getItem(PREF_KEY) === '1'; } catch { return false; }
}

export function setReminderEnabled(enabled) {
  try { localStorage.setItem(PREF_KEY, enabled ? '1' : '0'); } catch {}
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return 'denied';
  }
}

async function showViaServiceWorker(title, body, data) {
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (!reg) return false;
    await reg.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'cu-daily-reminder',
      renotify: false,
      data,
      vibrate: [200, 100, 200],
    });
    return true;
  } catch {
    return false;
  }
}

function showDirect(title, body) {
  try {
    new Notification(title, { body, icon: '/icon-192.png' });
    return true;
  } catch {
    return false;
  }
}

export async function showDailyReminder(profile) {
  if (!isReminderEnabled()) return false;
  if (getNotificationPermission() !== 'granted') return false;

  // De-dupe: don't show more than once per day
  const today = new Date().toDateString();
  try {
    if (localStorage.getItem(LAST_SHOWN_KEY) === today) return false;
  } catch {}

  // Pick a message — prefer the streak-aware one if bé has a streak
  let msg;
  if (profile?.streak && profile.streak > 0) {
    msg = REMINDER_MESSAGES[1];
  } else if (profile?.dailyStory?.date !== today) {
    msg = REMINDER_MESSAGES[2];
  } else {
    msg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
  }
  const title = msg.title;
  const body = msg.body.replace('{streak}', profile?.streak || 0);

  const sentViaSW = await showViaServiceWorker(title, body, { url: '/' });
  const sent = sentViaSW || showDirect(title, body);

  if (sent) {
    try { localStorage.setItem(LAST_SHOWN_KEY, today); } catch {}
    return true;
  }
  return false;
}

// Trigger reminder check: shows if bé hasn't played today and it's past 17:00
export async function maybeShowReminder(profile) {
  if (!profile) return false;
  const today = new Date().toDateString();
  if (profile.lastDay === today) return false; // already played today
  const hour = new Date().getHours();
  if (hour < 17 || hour > 21) return false; // only late afternoon/evening
  return await showDailyReminder(profile);
}
