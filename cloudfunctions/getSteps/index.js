const cloud = require('wx-server-sdk')
cloud.init()

exports.main = async (event) => {
  // 直接返回最新步数
  return {
    step: event.weRunData.data.stepInfoList.pop().step
  }
}
  