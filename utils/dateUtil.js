/**
 * 获取当前日期字符串
 * @returns {string} 格式：YYYY-MM-DD
 */
const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  
  const formattedMonth = month < 10 ? '0' + month : month;
  const formattedDay = day < 10 ? '0' + day : day;
  
  return year + '-' + formattedMonth + '-' + formattedDay;
};

/**
 * 获取当前时间字符串
 * @returns {string} 格式：HH:mm
 */
const getCurrentTime = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  const formattedHours = hours < 10 ? '0' + hours : hours;
  const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
  
  return formattedHours + ':' + formattedMinutes;
};

/**
 * 格式化日期
 * @param {Date|string} date 日期对象或日期字符串
 * @param {string} format 格式化模式，默认：YYYY-MM-DD
 * @returns {string} 格式化后的日期字符串
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * 获取相对日期
 * @param {number} days 相对天数，负数表示过去，正数表示未来
 * @returns {string} 格式：YYYY-MM-DD
 */
const getRelativeDate = (days) => {
  const now = new Date();
  const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return formatDate(targetDate);
};

/**
 * 计算两个日期之间的天数差
 * @param {string|Date} date1 日期1
 * @param {string|Date} date2 日期2
 * @returns {number} 天数差
 */
const getDaysDiff = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const timeDiff = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

/**
 * 获取友好的时间描述
 * @param {string|Date} date 日期
 * @returns {string} 友好的时间描述
 */
const getFriendlyTimeDesc = (date) => {
  const now = new Date();
  const targetDate = new Date(date);
  const diff = now.getTime() - targetDate.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) {
    if (days === 1) return '昨天';
    if (days === 2) return '前天';
    if (days <= 7) return `${days}天前`;
    return formatDate(targetDate);
  }

  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
};

/**
 * 格式化时间 HH:mm
 * @param {Date|string} date 日期对象或日期字符串
 * @returns {string} 格式化后的时间字符串
 */
const formatTime = (date) => {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * 获取相对时间描述
 * @param {number} timestamp 时间戳
 * @returns {string} 相对时间描述
 */
const getRelativeTimeDesc = (timestamp) => {
  const now = new Date().getTime();
  const diff = now - timestamp;
  
  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }
  
  // 小于1小时
  if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`;
  }
  
  // 小于24小时
  if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`;
  }
  
  // 小于30天
  if (diff < 2592000000) {
    return `${Math.floor(diff / 86400000)}天前`;
  }
  
  // 大于30天，返回具体日期
  return formatDate(timestamp);
};

module.exports = {
  getCurrentDate,
  getCurrentTime,
  formatDate,
  formatTime,
  getRelativeDate,
  getDaysDiff,
  getFriendlyTimeDesc,
  getRelativeTimeDesc
}; 