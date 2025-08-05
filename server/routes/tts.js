const express = require('express');
const router = express.Router();

const TTS_CONFIG = {
  url: 'https://tts.baidu.com/text2audio',
  params: {
    lan: 'zh',
    ie: 'UTF-8',
    spd: '5',
    aue: '3'
  }
};

router.get('/text2audio', (req, res) => {
  try {
    const { text } = req.query;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数: text'
      });
    }

    const queryParams = new URLSearchParams({
      ...TTS_CONFIG.params,
      text: encodeURIComponent(text)
    });

    const ttsUrl = `${TTS_CONFIG.url}?${queryParams.toString()}`;

    res.redirect(ttsUrl);
  } catch (error) {
    console.error('TTS服务错误:', error);
    res.status(500).json({
      success: false,
      message: '语音合成失败'
    });
  }
});

module.exports = router;