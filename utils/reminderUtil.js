// reminderUtil.js

/**
 * 设置每日提醒
 * @param {string} time 提醒时间，格式：HH:mm
 * @returns {Promise} 设置结果
 */
const setDailyReminder = (time) => {
  return new Promise((resolve, reject) => {
    // 请求订阅消息权限
    wx.requestSubscribeMessage({
      tmplIds: ['YOUR_TEMPLATE_ID'], // 需要替换为实际的模板ID
      success: (res) => {
        if (res['YOUR_TEMPLATE_ID'] === 'accept') {
          // 用户同意订阅
          saveReminderSettings(time, true);
          resolve(true);
        } else {
          // 用户拒绝订阅
          saveReminderSettings(time, false);
          resolve(false);
        }
      },
      fail: (err) => {
        console.error('请求订阅消息失败', err);
        reject(err);
      }
    });
  });
};

/**
 * 保存提醒设置
 * @param {string} time 提醒时间
 * @param {boolean} enabled 是否启用
 */
const saveReminderSettings = (time, enabled) => {
  try {
    const settings = {
      time,
      enabled,
      updateTime: new Date().getTime()
    };
    wx.setStorageSync('reminderSettings', settings);
  } catch (e) {
    console.error('保存提醒设置失败', e);
  }
};

/**
 * 获取提醒设置
 * @returns {object} 提醒设置
 */
const getReminderSettings = () => {
  try {
    return wx.getStorageSync('reminderSettings') || {
      time: '08:00',
      enabled: false,
      updateTime: 0
    };
  } catch (e) {
    console.error('获取提醒设置失败', e);
    return {
      time: '08:00',
      enabled: false,
      updateTime: 0
    };
  }
};

/**
 * 取消提醒
 */
const cancelReminder = () => {
  try {
    saveReminderSettings(getReminderSettings().time, false);
    return true;
  } catch (e) {
    console.error('取消提醒失败', e);
    return false;
  }
};

/**
 * 检查是否需要发送提醒
 * 注意：实际应用中，提醒功能应该由服务端实现
 * 这里只是一个模拟实现
 */
const checkReminder = () => {
  const settings = getReminderSettings();
  if (!settings.enabled) return;

  const now = new Date();
  const [hours, minutes] = settings.time.split(':');
  const reminderTime = new Date();
  reminderTime.setHours(parseInt(hours));
  reminderTime.setMinutes(parseInt(minutes));
  reminderTime.setSeconds(0);

  // 如果当前时间在提醒时间的前后5分钟内，则触发提醒
  const diff = Math.abs(now.getTime() - reminderTime.getTime());
  if (diff <= 5 * 60 * 1000) {
    sendReminder();
  }
};

/**
 * 发送提醒
 * 注意：实际应用中应该调用微信订阅消息接口
 * 这里使用本地通知模拟
 */
const sendReminder = () => {
  wx.showToast({
    title: '该记录体重啦！',
    icon: 'none',
    duration: 2000
  });
};

module.exports = {
  setDailyReminder,
  saveReminderSettings,
  getReminderSettings,
  cancelReminder,
  checkReminder
}; 