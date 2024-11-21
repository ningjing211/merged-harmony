const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
    // 僅接受 POST 方法
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed, use POST' });
    }

    try {
        // 從請求中提取參數
        const { folderName, newFileName } = req.body;

        if (!folderName || !newFileName) {
            return res.status(400).json({ error: 'Missing folderName or newFileName' });
        }

        // 定義來源和目標路徑
        const sourcePath = path.join(process.cwd(), 'uploads', 'upload.jpg');
        const destinationPath = path.join(process.cwd(), 'uploads', folderName, `${newFileName}.jpg`);

        console.log('Source Path:', sourcePath);
        console.log('Destination Path:', destinationPath);

        // 檢查目標資料夾是否存在
        const targetFolder = path.join(process.cwd(), 'uploads', folderName);
        if (!fs.existsSync(targetFolder)) {
            fs.mkdirSync(targetFolder, { recursive: true });
            console.log('Target folder created:', targetFolder);
        }

        // 複製檔案
        await fs.promises.copyFile(sourcePath, destinationPath);
        console.log(`Successfully copied to ${destinationPath}`);

        // 回應成功訊息
        res.status(200).json({ message: `Successfully copied to ${destinationPath}` });
    } catch (err) {
        console.error('Error copying file:', err);
        res.status(500).json({ error: 'Failed to copy file' });
    }
}
