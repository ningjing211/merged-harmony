const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed, use POST' });
    }

    const { folderName, fileName, newDescription } = req.body;

    if (!folderName || !fileName || typeof newDescription !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid parameters' });
    }

    const tmpDir = path.join('/tmp'); // Vercel 上的可寫路徑
    const imagesOrderPath = path.join(tmpDir, 'imagesOrder.json');
    const publicImagesOrderPath = path.join(process.cwd(), 'public', 'imagesOrder.json');

    try {
        // 確保 /tmp 目錄存在
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir);
        }

        let imagesOrder = [];
        if (fs.existsSync(imagesOrderPath)) {
            // 讀取 /tmp/imagesOrder.json
            const data = await fs.promises.readFile(imagesOrderPath, 'utf8');
            imagesOrder = JSON.parse(data);
        } else if (fs.existsSync(publicImagesOrderPath)) {
            // 如果 /tmp 不存在，從 public 複製一份
            const data = await fs.promises.readFile(publicImagesOrderPath, 'utf8');
            imagesOrder = JSON.parse(data);
            await fs.promises.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');
        } else {
            return res.status(404).json({ error: 'imagesOrder.json not found' });
        }

        // 找到目標資料夾與圖片
        const group = imagesOrder.find(group => group.folderName === folderName);
        if (!group) {
            return res.status(404).json({ error: 'Folder not found in imagesOrder.json' });
        }

        const image = group.additionalImages.find(img => img.name === fileName);
        if (!image) {
            return res.status(404).json({ error: 'Image not found in the specified folder' });
        }

        // 更新描述並寫回
        image.imageDescription = newDescription;
        await fs.promises.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');

        res.json({ message: 'Image description updated successfully' });
    } catch (err) {
        console.error('Error updating image description:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
