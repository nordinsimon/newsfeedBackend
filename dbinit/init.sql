CREATE DATABASE IF NOT EXISTS newsfeeddb;
USE newsfeeddb;


DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS userRoles;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS article;


CREATE TABLE users (
  user_id varchar(36) PRIMARY KEY,
  username varchar(36) UNIQUE NOT NULL,
  email varchar(128) UNIQUE NOT NULL,
  password varchar(64) NOT NULL,
  created_at timestamp,
  edited_at timestamp
);

CREATE TABLE roles (
  role_id varchar(36) PRIMARY KEY,
  role_name varchar(36) UNIQUE NOT NULL
);

CREATE TABLE userRoles (
  userRoles_Id INT PRIMARY KEY,
  user_id varchar(36),
  role_id varchar(36),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE article (
  id varchar(36) PRIMARY KEY,
  title TEXT NOT NULL,
  link TEXT,
  content TEXT,
  user_id varchar(36),
  created_at timestamp,
  edited_at timestamp,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

