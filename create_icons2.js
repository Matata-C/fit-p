const fs = require('fs');
const path = require('path');

console.log('创建PNG图标...');

// 彩色图标数据 - 正方形PNG (图标更大，16x16像素)
const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAABX0lEQVQ4jZWSzUoCURTH/3eG5mM+hpFZhGCL0iARFzbQrl7AbcueQDcto0XQI/QGLmrTMmjRouilIqJNQrQyEBxNx7kjIjPeWXpWl3vP+Z37Od8DnCJ6Sz+Tyfj0B2OfJoXICTljrIqIZUTU2G61nvY+Pm6SKYMR5XJXrNPZvNvacicSiaHv08iybPi+31BK3WuaVjSLCjwYDCYArAOYY8YmAPDo86BUqu1HUVgsFq2fSBHGS6XS8SyDo0qlAsMwwMxTx6emRz4GWCjGgNfrPXc89zmdTssrK6uq1/tvkJc0NxdP9Pt9y/PcHdMM38rlcnZR1WrlbO42+DQMYyaA7/sBgHVd14X83xvMKKJngO2iVqvVTFHVqhRieW9neztgWZYSsQCiWNM07XlqEEWRKoQQHYCYTiYpZtdxnJFt23EiIgALBwcHnfG44rFdN5Lij5MvtAMAlmVRPujtLDo8/gUzW+cHdSsVVrJ3CFMAAAAASUVORK5CYII=', 'base64');

// 激活状态图标 - 绿色风格
const activePngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAABaElEQVQ4jZWSvUoDQRDHf3e5yyUxiYVEBCUQbAQRxMLGMtiIvoCdnY2dpY2dpaWNYKflC2jjg1hayEcjgknMB7nc3e6OzeWS3CXRKZa9mf3PzDL/gWOIv8Isy5L0j7GmGyEyB2fGujFmW1W3S8XiU/nt7TGXNDiiSiaTcD1v7WZz050ZGxsKMqlUyjcm2jPGrOu6vmYX5YDneRMisgHMi8g5EJruyN9XqVSyQRBs5fP58TQDx3G89va2l8vlvicQxcLT01P7OAan4YCZzc1gfX19QUWWHMfdWlpaHo/D8Cf5zwg+lMvl5jxYCX72fZ9UKpUj8FVV91V140wJk8kkuVzuZcB4LCBERFW/AfUn+Pn5qXEQLZc3LkZHM1QqFTIZOyNEg2q1+jIweH9/V1X1m6o2J05OqDWatY+Pd9t13UEROezt63sN9jVsteo27O8PCs4RoA3gsuy3FWKh0C7mKZ9/Ag4BSqWSrfV6P/ZvoX0KPhcvuXIAAAAASUVORK5CYII=', 'base64');

// 确保目录存在
const dirs = ['images', 'images/icons'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
});

// 创建图标文件
const icons = {
  'icon_home': { name: '首页图标', active: false },
  'icon_home_active': { name: '首页激活图标', active: true },
  'icon_analysis': { name: '分析图标', active: false },
  'icon_analysis_active': { name: '分析激活图标', active: true },
  'icon_profile': { name: '我的图标', active: false },
  'icon_profile_active': { name: '我的激活图标', active: true }
};

Object.keys(icons).forEach(iconName => {
  const filePath = path.join('images', `${iconName}.png`);
  const iconData = icons[iconName].active ? activePngData : pngData;
  console.log(`创建 ${filePath} (${icons[iconName].name})`);
  fs.writeFileSync(filePath, iconData);
});

console.log('创建完成!'); 