const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const streamifier = require('streamifier');

const { Readable } = require('stream');
const fetch = require('node-fetch');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

const session = require('express-session');

app.use(express.json()); // This line is critical for parsing JSON in requests
app.use(express.urlencoded({ extended: true })); // 若使用 URL 編碼表單，需啟用這行

// 初始化會話中間件
app.use(
    session({
        secret: 'your-secret-key', // 替換為隨機字串
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true, // 防止客户端通过 JS 访问 cookie
            secure: false, // 如果是 HTTPS，设置为 true
            sameSite: 'lax', // 防止 CSRF 攻击
        }
    })
);

module.exports = async function handler(req, res) {

    const { username, password } = req.body; // 從 body 提取數據
    console.log('帳號:', username, '密碼:', password);

    try {
        // 從 Cloudinary 獲取 accounts.json
        const response = await fetch('https://res.cloudinary.com/dgjpg3g8s/raw/upload/v1234567890/uploads/accounts.json');
        if (!response.ok) throw new Error('無法獲取 accounts.json');
        const accounts = await response.json();

        // 驗證帳號與密碼
        const account = accounts.find((acc) => acc.accounts === username);
        if (!account) {
            return res.status(401).json({ message: '查無此帳號' });
        }
        if (account.password !== password) {
            return res.status(401).json({ message: '密碼錯誤' });
        }

        // 設置 session
        // 設置 session
        console.log('Before session set:', req.session);
        req.session.username = username;
        console.log('After session set:', req.session);

        res.status(200).json({ message: '登入成功' });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: '系統錯誤，請稍後再試' });
    }

};