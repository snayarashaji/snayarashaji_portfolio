-- Portfolio Database Setup
CREATE DATABASE IF NOT EXISTS portfolio_db;
USE portfolio_db;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(10) DEFAULT '📁',
    gradient VARCHAR(255) DEFAULT 'linear-gradient(135deg, #667eea, #764ba2)',
    tags VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Education table
CREATE TABLE IF NOT EXISTS education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year_range VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact messages table
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data: Projects
INSERT INTO projects (title, description, icon, gradient, tags) VALUES
('E-Commerce Website', 'A responsive online store with product listings, cart, and checkout. Built with HTML, CSS & JavaScript.', '🛒', 'linear-gradient(135deg, #667eea, #764ba2)', 'HTML,CSS,JS'),
('Student Management System', 'CRUD app for managing student records with login, search, and report generation.', '📚', 'linear-gradient(135deg, #f093fb, #f5576c)', 'Python,Flask,MySQL'),
('Weather Dashboard', 'Real-time weather app with city search and 5-day forecast using a weather API.', '🌤️', 'linear-gradient(135deg, #4facfe, #00f2fe)', 'HTML,CSS,JS'),
('Task Manager', 'Desktop app for daily task management with priorities, deadlines, and tracking.', '✅', 'linear-gradient(135deg, #43e97b, #38f9d7)', 'Java,Swing');

-- Seed data: Skills
INSERT INTO skills (name) VALUES
('HTML & CSS'), ('JavaScript'), ('Python'), ('Java'),
('MySQL'), ('React (Learning)'), ('Git & GitHub'), ('C Programming');

-- Seed data: Education
INSERT INTO education (year_range, title, institution) VALUES
('2023 – Present', 'BCA – Bachelor of Computer Applications', 'University Name'),
('2021 – 2023', 'Higher Secondary (12th)', 'School Name'),
('2021', 'Secondary School (10th)', 'School Name');
