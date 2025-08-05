function getDevicePixelRatio() {
  try {
    return wx.getSystemInfoSync().pixelRatio;
  } catch (e) {
    return 1;
  }
}

module.exports = {
  getDevicePixelRatio: getDevicePixelRatio
};