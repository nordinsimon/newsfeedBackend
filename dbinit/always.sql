CREATE DATABASE IF NOT EXISTS newsfeeddb;

USE newsfeeddb;

CREATE TABLE IF NOT EXISTS users(
    user_id varchar(36) PRIMARY KEY,
  username varchar(36) UNIQUE NOT NULL,
  email varchar(128) UNIQUE NOT NULL,
  password varchar(64) NOT NULL,
  created_at timestamp,
  edited_at timestamp
);

CREATE TABLE rums (
  id varchar(36) PRIMARY KEY,
  title TEXT NOT NULL,
  link TEXT,
  content TEXT,
  user_id varchar(36),
  created_at timestamp,
  edited_at timestamp
);