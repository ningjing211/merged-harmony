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

    // 使用 tmp 資料夾進行操作
    const tmpDir = path.join(process.cwd(), 'tmp');
    const imagesOrderPath = path.join(tmpDir, 'public/imagesOrder.json');
    console.log('有執行到這裡嗎？1')

    try {
        // 檢查 tmp 資料夾是否存在，若不存在則創建
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir);
        }
        console.log('有執行到這裡嗎？2')
        // 讀取原始 imagesOrder.json
        let imagesOrder = [];
        if (fs.existsSync(imagesOrderPath)) {
            const data = await fs.promises.readFile(imagesOrderPath, 'utf8');
            imagesOrder = JSON.parse(data);
            console.log('有執行到這裡嗎？3')
        } else {
            // 如果 tmp 下的 imagesOrder.json 不存在，可以考慮從 public 複製一份
            const publicImagesOrderPath = path.join(process.cwd(), 'public', 'imagesOrder.json');
            if (fs.existsSync(publicImagesOrderPath)) {
                const data = await fs.promises.readFile(publicImagesOrderPath, 'utf8');
                imagesOrder = JSON.parse(data);
                await fs.promises.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');
            } else {
                return res.status(404).json({ error: 'imagesOrder.json not found' });
            }
        }
        console.log('有執行到這裡嗎？4')

        // 找到對應的資料夾
        const group = imagesOrder.find(group => group.folderName === folderName);
        if (!group) {
            return res.status(404).json({ error: 'Folder not found in imagesOrder.json' });
        }
        console.log('有執行到這裡嗎？5')
        // 找到對應的圖片
        const image = group.additionalImages.find(img => img.name === fileName);
        if (!image) {
            return res.status(404).json({ error: 'Image not found in the specified folder' });
        }

        // 更新描述
        image.imageDescription = newDescription;
        console.log('有執行到這裡嗎？6')
        // 寫回更新後的 imagesOrder.json
        await fs.promises.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');
        console.log('Image description updated successfully.');

        res.json({ message: 'Image description updated successfully' });
    } catch (err) {
        console.error('Error updating image description:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
