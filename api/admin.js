const path = require('path');
const fs = require('fs');

const express = require('express');
const app = express();
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
    // Step 1: 检查是否有 Cookie
    const cookies = req.headers.cookie || '';
    const usernameCookie = cookies
        .split('; ')
        .find((row) => row.startsWith('username='));
    const username = usernameCookie ? usernameCookie.split('=')[1] : null;

    if (req.method === 'GET') {
        // 如果没有会话，返回 login.html
        if (!username) {
            const loginPath = path.join(process.cwd(), 'public', 'login.html');
            const loginHtml = fs.readFileSync(loginPath, 'utf8');
            res.setHeader('Content-Type', 'text/html');
            return res.status(200).send(loginHtml);
        }

        // 如果有会话，返回 admin.html
        const adminPath = path.join(process.cwd(), 'public', 'admin.html');
        const adminHtml = fs.readFileSync(adminPath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(adminHtml);
    }

    if (req.method === 'POST') {
        // Step 2: 接收登录数据
        let body = '';
        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const { username, password } = JSON.parse(body);
                console.log('帳號:', username, '密碼:', password);

                const accounts = await getAccountsData();
                console.log('accounts.json 內容:', JSON.stringify(accounts, null, 2));


                // Step 4: 验证用户名和密码
                const account = accounts.find((acc) => acc.accounts === username);
                if (!account) {
                    return res.status(401).json({ message: '查無此帳號' });
                }
                if (account.password !== password) {
                    return res.status(401).json({ message: '密碼錯誤' });
                }

                // Step 5: 设置 Cookie 并返回 admin.html
                res.setHeader(
                    'Set-Cookie',
                    `username=${username}; HttpOnly; Path=/; Max-Age=3600; SameSite=Strict`
                );
                console.log('用户成功登录:', username);

                const adminPath = path.join(process.cwd(), 'public', 'admin.html');
                const adminHtml = fs.readFileSync(adminPath, 'utf8');
                res.setHeader('Content-Type', 'text/html');
                return res.status(200).send(adminHtml);
            } catch (error) {
                console.error('Login error:', error);try {
                    const localFilePath = path.join(process.cwd(), 'public', 'accounts.json');
                    const localData = fs.readFileSync(localFilePath, 'utf-8');
                    const accounts = JSON.parse(localData);
        
                    const account = accounts.find((acc) => acc.accounts === username);
                    if (!account) {
                        return res.status(401).json({ message: '查無此帳號' });
                    }
                    if (account.password !== password) {
                        return res.status(401).json({ message: '密碼錯誤' });
                    }
        
                    req.session.username = username;
                    res.status(200).json({ message: '登入成功' });
                } catch (localError) {
                    console.error('Error reading local accounts.json file:', localError);
                    res.status(500).json({ message: '系統錯誤，請稍後再試' });
                }
            }
        });
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};

async function getAccountsData() {
    try {
        const response = await fetch(
            'https://res.cloudinary.com/dgjpg3g8s/raw/upload/v1734507612/uploads/accounts.json'
        );
        if (!response.ok) throw new Error('無法獲取 accounts.json');
        return await response.json();
    } catch (error) {
        console.error('Cloudinary 獲取失敗，切換到本地文件:', error);
        const localFilePath = path.join(process.cwd(), 'public', 'accounts.json');
        const localData = fs.readFileSync(localFilePath, 'utf-8');
        return JSON.parse(localData);
    }
}