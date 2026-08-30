import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// 1. Create Dual Channels (Vibrate vs Silent)
export async function setupNotifications() {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const check = await LocalNotifications.checkPermissions();
    if (check.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    // Channel 1: High Importance + Vibration
    await LocalNotifications.createChannel({
      id: 'aio-vibrate',
      name: 'AIO Alerts (Vibrate)',
      description: 'High priority alerts with vibration',
      importance: 5,
      visibility: 1,
      vibration: true,
    });

    // Channel 2: High Importance, NO Vibration
    await LocalNotifications.createChannel({
      id: 'aio-silent',
      name: 'AIO Alerts (Silent)',
      description: 'High priority alerts without vibration',
      importance: 5,
      visibility: 1,
      vibration: false,
    });

    return true;
  } catch (error) {
    console.error("Not running on native mobile device:", error);
    return false;
  }
}

// 2. The Master Sync Engine (Handles Classes & Tasks)
export async function syncAllAlarms(classes, tasks, settings) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    // 1. Wipe all existing alarms to prevent duplicates
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }

    const newAlarms = [];
    
    // Determine which channel to use based on user settings (default to true if undefined)
    const wantsVibration = settings.vibrateEnabled !== false;
    const activeChannel = wantsVibration ? 'aio-vibrate' : 'aio-silent';

    // 2. Process Classes (Weekly Repeating)
    if (settings.classNotifs && classes && classes.length > 0) {
      const capDays = { Sunday: 1, Monday: 2, Tuesday: 3, Wednesday: 4, Thursday: 5, Friday: 6, Saturday: 7 };
      const leadTime = parseInt(settings.classLeadTime, 10); 

      classes.forEach((lecture) => {
        let [hour, minute] = lecture.startTime.split(':').map(Number);
        minute -= leadTime;
        if (minute < 0) {
          minute += 60;
          hour -= 1;
          if (hour < 0) hour += 24;
        }

        newAlarms.push({
          id: Math.floor(Math.random() * 100000) + lecture.id, // Ensure unique ID
          title: `Class: ${lecture.courseCode || lecture.courseName}`,
          body: `Starts in ${leadTime} mins at ${lecture.building || 'TBA'} ${lecture.room ? 'Room ' + lecture.room : ''}`,
          channelId: activeChannel,
          schedule: { on: { weekday: capDays[lecture.day], hour: hour, minute: minute }, allowWhileIdle: true },
          smallIcon: "ic_stat_icon_config_sample"
        });
      });
    }

    // 3. Process Tasks (One-Time Exact Dates)
    if (settings.taskNotifs && tasks && tasks.length > 0) {
      const currentYear = new Date().getFullYear();
      const taskLead = parseInt(settings.taskLeadTime, 10); // in minutes

      tasks.forEach((task) => {
        if (!task.completed && task.due && task.time) {
          // Parse native HTML5 date (YYYY-MM-DD) and time (HH:MM)
          const dateString = `${task.due}T${task.time}:00`;
          const targetDate = new Date(dateString);
          
          // Subtract the lead time
          targetDate.setMinutes(targetDate.getMinutes() - taskLead);

          // Only schedule if the alarm time is still in the future!
          if (targetDate > new Date()) {
            newAlarms.push({
              id: Math.floor(Math.random() * 100000) + task.id,
              title: `${task.type}: ${task.title}`,
              body: `Due in ${taskLead >= 60 ? (taskLead/60) + ' hours' : taskLead + ' mins'}. Location: ${task.location || 'N/A'}`,
              channelId: activeChannel,
              schedule: { at: targetDate, allowWhileIdle: true },
              smallIcon: "ic_stat_icon_config_sample"
            });
          }
        }
      });
    }

    // 4. Register everything with Android
    if (newAlarms.length > 0) {
      await LocalNotifications.schedule({ notifications: newAlarms });
      console.log(`Successfully scheduled ${newAlarms.length} background alarms.`);
    }

  } catch (error) {
    console.error("Failed to sync alarms:", error);
  }
}

// 3. Updated Test Function (Respects Vibration Toggle)
export async function scheduleTestNotification(vibrateEnabled) {
  if (!Capacitor.isNativePlatform()) { // <-- UPDATE THIS FUNCTION
    return alert("Native notifications are only available on the Android app!");
  }
  const hasPermission = await setupNotifications();
  if (!hasPermission) return alert("Please allow notifications!");

  const activeChannel = vibrateEnabled !== false ? 'aio-vibrate' : 'aio-silent';

  await LocalNotifications.schedule({
    notifications: [{
      title: vibrateEnabled !== false ? "Vibration ON! 📳" : "Silent Mode ON! 🤫",
      body: "Testing the dynamic channel routing.",
      id: 999,
      channelId: activeChannel,
      schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true }, 
      smallIcon: "ic_stat_icon_config_sample",
    }]
  });
  alert("Test scheduled! Lock your phone and wait 5 seconds.");
}