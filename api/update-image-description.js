const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
    // 僅接受 POST 請求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed, use POST' });
    }

    const { folderName, fileName, newDescription } = req.body;

    // 驗證必要參數
    if (!folderName || !fileName || typeof newDescription !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid parameters' });
    }

    const imagesOrderPath = path.join(process.cwd(), 'imagesOrder.json');

    try {
        // 1. 讀取並解析 imagesOrder.json
        const data = await fs.promises.readFile(imagesOrderPath, 'utf8');
        const imagesOrder = JSON.parse(data);

        // 2. 找到對應的資料夾
        const group = imagesOrder.find(group => group.folderName === folderName);
        if (!group) {
            return res.status(404).json({ error: 'Folder not found in imagesOrder.json' });
        }

        // 3. 找到對應的圖片
        const image = group.additionalImages.find(img => img.name === fileName);
        if (!image) {
            return res.status(404).json({ error: 'Image not found in the specified folder' });
        }

        // 4. 更新描述
        image.imageDescription = newDescription;

        // 5. 寫回更新後的 imagesOrder.json
        await fs.promises.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');
        console.log('Image description updated successfully.');

        res.json({ message: 'Image description updated successfully' });
    } catch (err) {
        console.error('Error updating image description:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
