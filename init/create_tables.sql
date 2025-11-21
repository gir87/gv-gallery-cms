-- Users Table with Auth Token
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `auth_token` varchar(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin user (Password is 'gvgallery123') or generate at https://bcrypt-generator.com
INSERT IGNORE INTO `users` (`username`, `password_hash`) VALUES
('admin', '$2a$12$EYYSXN24vccK/vriUEvkDuBIsf8OcY36TgK.5ei5TPFJSyfTarPV2');

-- Series Table
CREATE TABLE IF NOT EXISTS `series` (
  `id` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `cover_photo_id` varchar(50) DEFAULT NULL,
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Photos Table (with Homepage flag and Sort Order)
CREATE TABLE IF NOT EXISTS `photos` (
  `id` varchar(50) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `series_id` varchar(50) DEFAULT NULL,
  `tags` text,
  `created_at` bigint(20) NOT NULL,
  `width` int(11) DEFAULT 0,
  `height` int(11) DEFAULT 0,
  `is_homepage` TINYINT(1) DEFAULT 0,
  `order_index` INT DEFAULT 9999,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- App Settings (About Page)
CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_key` varchar(50) NOT NULL,
  `setting_value` text,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO `app_settings` (`setting_key`, `setting_value`) VALUES
('about_title', 'About Me'),
('about_text', 'Welcome to my portfolio.'),
('about_image_url', '');
