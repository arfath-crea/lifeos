import { soundEngine } from './audio';

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function sendBrowserNotification(title: string, options?: NotificationOptions & { playSound?: boolean }) {
  if (options?.playSound !== false) {
    soundEngine.playAlarmChime();
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    new Notification(title, {
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      ...options
    });
  } catch (err) {
    console.error('Error triggering notification:', err);
  }
}
