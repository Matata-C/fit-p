CREATE DATABASE IF NOT EXISTS fitness_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fitness_app;

CREATE TABLE IF NOT EXISTS exercise_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  exercise_type VARCHAR(100) NOT NULL,
  duration INT NOT NULL COMMENT '持续时间(分钟)',
  calories_burned INT NOT NULL COMMENT '消耗卡路里',
  intensity ENUM('低', '中', '高') DEFAULT '中',
  exercise_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, exercise_date),
  INDEX idx_exercise_type (exercise_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS food_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  food_name VARCHAR(255) NOT NULL,
  weight INT NOT NULL COMMENT '重量(克)',
  calories INT NOT NULL,
  protein DECIMAL(5,2) DEFAULT 0 COMMENT '蛋白质(克)',
  carbs DECIMAL(5,2) DEFAULT 0 COMMENT '碳水化合物(克)',
  fat DECIMAL(5,2) DEFAULT 0 COMMENT '脂肪(克)',
  meal_time ENUM('早餐', '午餐', '晚餐', '加餐') DEFAULT '午餐',
  meal_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, meal_date),
  INDEX idx_food_name (food_name),
  INDEX idx_meal_time (meal_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO exercise_records (user_id, exercise_type, duration, calories_burned, intensity, exercise_date) VALUES
('demo_user', '跑步', 30, 300, '中', '2024-01-15 08:00:00'),
('demo_user', '游泳', 45, 400, '高', '2024-01-16 19:30:00'),
('demo_user', '瑜伽', 60, 200, '低', '2024-01-17 07:00:00');

INSERT INTO food_records (user_id, food_name, weight, calories, protein, carbs, fat, meal_time, meal_date) VALUES
('demo_user', '苹果', 200, 104, 0.5, 28.0, 0.3, '早餐', '2024-01-15 08:30:00'),
('demo_user', '鸡胸肉', 150, 248, 46.5, 0, 5.4, '午餐', '2024-01-15 12:00:00'),
('demo_user', '米饭', 100, 130, 2.7, 28.2, 0.3, '午餐', '2024-01-15 12:00:00');

CREATE OR REPLACE VIEW user_daily_stats AS
SELECT 
  user_id,
  DATE(exercise_date) as date,
  SUM(duration) as total_exercise_duration,
  SUM(calories_burned) as total_calories_burned,
  COUNT(*) as exercise_count
FROM exercise_records
GROUP BY user_id, DATE(exercise_date);

CREATE OR REPLACE VIEW user_daily_nutrition AS
SELECT 
  user_id,
  DATE(meal_date) as date,
  SUM(calories) as total_calories,
  SUM(protein) as total_protein,
  SUM(carbs) as total_carbs,
  SUM(fat) as total_fat,
  COUNT(*) as meal_count
FROM food_records
GROUP BY user_id, DATE(meal_date);

SHOW TABLES;

DESCRIBE exercise_records;
DESCRIBE food_records;