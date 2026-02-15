-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    status ENUM('active', 'deactivated') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Logs table for security and activity auditing
CREATE TABLE IF NOT EXISTS logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    mac_address VARCHAR(17),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Products table for Store inventory
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    category ENUM('Running', 'Basketball', 'Training', 'Lifestyle', 'Accessories', 'Soccer') DEFAULT 'Training',
    image LONGTEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Orders table for tracking sales
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order Items table (line items for each order)
CREATE TABLE IF NOT EXISTS order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- Indexing for performance and security
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_users_security_vitals ON users(email, status);
CREATE INDEX idx_logs_security_audit ON logs(action, created_at);

-- Security Views
-- Securely list users without exposing password hashes
CREATE OR REPLACE VIEW view_secure_users AS
SELECT id, username, email, role, status, created_at
FROM users;

-- Show only currently available items
CREATE OR REPLACE VIEW view_available_inventory AS
SELECT * FROM products WHERE stock > 0;

-- Database Triggers for Security and Integrity
-- 1. Integrity: Prevent negative stock
DELIMITER //
CREATE TRIGGER trig_check_stock_integrity
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
    IF NEW.stock < 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Stock cannot be negative';
    END IF;
END //

-- 2. Audit: Automatically log user role or status changes
CREATE TRIGGER trig_audit_user_changes
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    IF OLD.role <> NEW.role OR OLD.status <> NEW.status THEN
        INSERT INTO logs (user_id, action, details)
        VALUES (
            NEW.id, 
            'USER_SEC_CHANGE', 
            CONCAT('User update: Role [', OLD.role, '->', NEW.role, '], Status [', OLD.status, '->', NEW.status, ']')
        );
    END IF;
END //
DELIMITER ;
