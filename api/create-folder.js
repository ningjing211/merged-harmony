const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
    // 僅接受 POST 方法
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed, use POST' });
    }
    const { folderName } = req.body;
    // 驗證 folderName 是否提供
    if (!folderName || typeof folderName !== 'string') {
        return res.status(400).json({ error: 'Invalid folderName provided' });
    }

    const targetFolder = path.join(__dirname, 'uploads', folderName);
    
    try {
        // 檢查資料夾是否已存在，若不存在則創建
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
            res.status(201).json({ message: 'Folder created successfully', folderName });
        } else {
            res.status(200).json({ message: 'Folder already exists', folderName });
        }
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ error: 'Failed to create folder' });
    }
};