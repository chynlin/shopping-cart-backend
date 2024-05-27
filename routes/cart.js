const express = require('express');
const router = express.Router();

// 引入 sqlite3
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '..', 'db', 'database.db');
const db = new sqlite3.Database(dbPath);

// 購物車相關路由

module.exports = router;
