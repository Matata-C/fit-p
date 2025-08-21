const cloud = require('wx-server-sdk')
cloud.init({
  env: 'cloud1-6g0qn8fo7e746837'
})

exports.main = async (event) => {
  // 直接返回最新步数
  return {
    step: event.weRunData.data.stepInfoList.pop().step
  }
}
  