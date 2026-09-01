CREATE DATABASE ai_interior_designer;
SHOW DATABASES;
USE ai_interior_designer;
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE themes (
    theme_id INT AUTO_INCREMENT PRIMARY KEY,
    theme_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);
CREATE TABLE user_projects (
    project_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    project_name VARCHAR(100),
    room_type VARCHAR(50),
    design_type ENUM('New Design','Renovation'),
    theme_id INT,
    budget DECIMAL(10,2),
    status ENUM('Draft','Completed') DEFAULT 'Draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (theme_id) REFERENCES themes(theme_id)
);
CREATE TABLE uploaded_rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    original_image VARCHAR(255),
    width INT,
    height INT,
    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES user_projects(project_id)
);

CREATE TABLE room_analysis (
    analysis_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    detected_objects JSON,
    empty_space JSON,
    wall_color VARCHAR(50),
    floor_type VARCHAR(50),
    FOREIGN KEY (room_id) REFERENCES uploaded_rooms(room_id)
);
CREATE TABLE furniture_catalog (
    furniture_id INT AUTO_INCREMENT PRIMARY KEY,
    furniture_name VARCHAR(100),
    category VARCHAR(50),
    style VARCHAR(50),
    price DECIMAL(10,2),
    width DECIMAL(5,2),
    length DECIMAL(5,2),
    image_path VARCHAR(255)
);
CREATE TABLE recommendations (
    recommendation_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    furniture_id INT NOT NULL,
    quantity INT DEFAULT 1,
    estimated_price DECIMAL(10,2),
    recommendation_reason TEXT,
    FOREIGN KEY (project_id) REFERENCES user_projects(project_id),
    FOREIGN KEY (furniture_id) REFERENCES furniture_catalog(furniture_id)
);
CREATE TABLE constraint_checks (
    check_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    door_access BOOLEAN,
    window_access BOOLEAN,
    walkway BOOLEAN,
    budget_ok BOOLEAN,
    remarks TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES user_projects(project_id)
);
CREATE TABLE chat_history (
    chat_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    sender ENUM('User','Bot'),
    message TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES user_projects(project_id)
);
CREATE TABLE shopping_list (
    shopping_id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    furniture_id INT NOT NULL,
    quantity INT,
    price DECIMAL(10,2),
    total DECIMAL(10,2),
    FOREIGN KEY (project_id) REFERENCES user_projects(project_id),
    FOREIGN KEY (furniture_id) REFERENCES furniture_catalog(furniture_id)
);
INSERT INTO themes (theme_name, description) VALUES
('Modern','Modern interior design'),
('Luxury','Luxury interior design'),
('Paris','Paris style bedroom'),
('Gaming','Gaming room'),
('Kids','Kids bedroom'),
('Minimal','Minimal design'),
('Traditional','Traditional interior'),
('Sports','Sports themed room');
SHOW TABLES;
SELECT * FROM users;
DELETE FROM user;
DROP TABLE uploaded_rooms;
CREATE TABLE room_uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    original_image_name VARCHAR(255),
    original_image_path VARCHAR(500),
    detected_image_name VARCHAR(255),
    detected_image_path VARCHAR(500),
    detected_objects TEXT,
    total_objects INT,
    status VARCHAR(30) DEFAULT 'Detected',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
SELECT * FROM room_uploads;
select * from chat_history;
select * from constraint_checks;
select * from recommendations;
ALTER TABLE room_uploads ADD COLUMN object_counts TEXT;
select * from users;
delete from users where user_id in (16,17,18,19,20,21,22,23,24);
select * from shopping_list;