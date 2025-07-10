// polyfill.js - 提供ES6功能的兼容性支持

/**
 * 对象扩展方法，类似Object.assign
 * 用于替代ES6的对象展开语法 {...obj}
 */
function objectSpread(target) {
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  var to = Object(target);
  
  for (var i = 1; i < arguments.length; i++) {
    var nextSource = arguments[i];
    
    if (nextSource != null) {
      for (var nextKey in nextSource) {
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey];
        }
      }
    }
  }
  
  return to;
}

module.exports = {
  objectSpread: objectSpread
}; 