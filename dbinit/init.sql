CREATE DATABASE IF NOT EXISTS newsfeeddb;
USE newsfeeddb;

CREATE TABLE IF NOT EXISTS invitedUsers (
  invitedUser_id varchar(36) PRIMARY KEY,
  name varchar(36) UNIQUE NOT NULL,
  email varchar(128) UNIQUE NOT NULL,
  created_at timestamp
)

CREATE TABLE IF NOT EXISTS users (
  user_id varchar(36) PRIMARY KEY,
  username varchar(36) UNIQUE NOT NULL,
  email varchar(128) UNIQUE NOT NULL,
  password varchar(64) NOT NULL,
  created_at timestamp,
  edited_at timestamp
)

CREATE TABLE IF NOT EXISTS roles (
  role_id varchar(36) PRIMARY KEY,
  role_name varchar(36) UNIQUE NOT NULL
)

CREATE TABLE IF NOT EXISTS userRoles (
  userRoles_Id INT PRIMARY KEY AUTO_INCREMENT,
  user_id varchar(36),
  role_id varchar(36),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (role_id) REFERENCES roles(role_id)
)

CREATE TABLE IF NOT EXISTS refreshTokens (
  refresh_token_id INT PRIMARY KEY AUTO_INCREMENT,
  token varchar(255) NOT NULL UNIQUE,
  user_id varchar(36),
  expires_at timestamp,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (role_id) REFERENCES roles(role_id)
)

CREATE TABLE IF NOT EXISTS article (
  id varchar(36) PRIMARY KEY,
  title TEXT NOT NULL,
  link TEXT,
  content TEXT,
  user_id varchar(36),
  created_at timestamp,
  edited_at timestamp,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
)
