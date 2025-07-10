const fs = require('fs');

const icons = [
  'icon_home',
  'icon_home_active',
  'icon_analysis',
  'icon_analysis_active',
  'icon_profile',
  'icon_profile_active'
];

icons.forEach(icon => {
  try {
    // 读取Base64文本
    const base64Data = fs.readFileSync(`images/${icon}.txt`, 'utf8');
    
    // 将Base64转换为Buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 写入PNG文件
    fs.writeFileSync(`images/${icon}.png`, buffer);
    
    console.log(`转换完成: ${icon}.png`);
  } catch (error) {
    console.error(`转换 ${icon} 时发生错误:`, error.message);
  }
});

console.log('所有图标转换完成'); 