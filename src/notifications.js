import { LocalNotifications } from '@capacitor/local-notifications';

// 1. Ask Android 13 for Permission
export async function requestNotificationPermission() {
  try {
    const check = await LocalNotifications.checkPermissions();
    if (check.display !== 'granted') {
      const request = await LocalNotifications.requestPermissions();
      return request.display === 'granted';
    }
    return true;
  } catch (error) {
    console.error("Not running on native mobile device:", error);
    return false;
  }
}

// 2. Schedule a 5-Second Test Alert
export async function scheduleTestNotification() {
  const hasPermission = await requestNotificationPermission();
  
  if (!hasPermission) {
    alert("Please allow notifications in your device settings!");
    return;
  }

  // Schedule an alarm for exactly 5 seconds from now
  await LocalNotifications.schedule({
    notifications: [
      {
        title: "AIO Calendar Active! 📅",
        body: "Your background notifications are wired up and working perfectly.",
        id: 999, // Unique ID for this specific alert
        schedule: { at: new Date(Date.now() + 5000) }, 
        sound: null, // Uses default device notification sound
        smallIcon: "ic_stat_icon_config_sample", // Default capacitor icon
      }
    ]
  });
  
  alert("Test notification scheduled! Close the app and wait 5 seconds.");
}