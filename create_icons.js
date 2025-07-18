const fs = require("fs");
const path = require("path");

console.log("创建PNG图标...");

const icons = ["home", "analysis", "profile"];
const types = ["", "_active"];

// 确保images目录存在
if (!fs.existsSync("images")) {
    fs.mkdirSync("images");
}

for(let icon of icons) {
    for(let type of types) {
        const filename = `icon_${icon}${type}.png`;
        console.log(`创建 ${filename}`);
        fs.writeFileSync(
            path.join("images", filename), 
            Buffer.from("iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGESURBVGiB7ZixSgNBEIb/EQsLwUoQBCstxFJIGkHwBXwCC8HGB7CxFHwCX0CwFcHOSkGwEGKjYKWFhYVgYRFIjMXlQo7c3u3e7d6CPB8M7O3M7P/P3O5xC1gsFovFYvn/dABMALwBmGdxl+Y6hVADMAQwA7DMiVn6rFaEfhXAA4BvJOW9+AZwD6BSgI5qxvcAfKYE4McngF4OOhTjmwC+Mgbg4hNAM4WWVH0j4/ddPAJoKGiJ1TcyPu/iHsC5oKVW38j4vItbAC1CS62+kfF5F9cALgUtsfpGxuddXAO4ErSk6hsZn3dxDeBW0BKrb2R83sU1gAdBi62+kfF5F9cAxoIWW30j4/MurgFMBS2x+kbG512WAPqEjgqAJ4VBHgGcGqDFjc+7LAHUE3pKyBYvABwboMWNz7ssAfBPUgPALYA3AIsM8QJgAOBIqZY0Pu+yBCDVqQM4AzAC8JIGMk1zI+RbF6XxeZe8AuB0ygAuABwCqKe5i/RZX1GHxWKxWCyWAvgBCxJMXcCwJg8AAAAASUVORK5CYII=", "base64")
        );
    }
}

console.log("创建完成");
