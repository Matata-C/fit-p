const cloud = require('wx-server-sdk');
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event, context) => {
  const { encryptedData, iv, sessionKey } = event;

  try {
    const decryptedData = cloud.getWXContext().decryptData(encryptedData, iv, sessionKey);
    return {
      success: true,
      data: decryptedData
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};