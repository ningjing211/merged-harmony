import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
    // 確定檔案路徑
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads'); // 改用 public/uploads 作為靜態檔案目錄
    const imagesOrderPath = path.join(process.cwd(), 'public', 'imagesOrder.json');

    try {
        // 讀取 imagesOrder.json 檔案
        const data = await fs.readFile(imagesOrderPath, 'utf8');
        let imagesOrder = JSON.parse(data);

        // 將 `imagesOrder.json` 中的內容與 `uploads` 資料夾同步
        for (const group of imagesOrder) {
            const folderPath = path.join(uploadsDir, group.folderName);

            try {
                // 確認 uploads 資料夾中是否存在此資料夾
                const files = await fs.readdir(folderPath);
                const visibleFiles = files.filter(file => !file.startsWith('.'));

                // 找到封面圖片
                const titleImage = visibleFiles.find(file => file === `${group.folderName}.jpg`);
                const otherImages = visibleFiles.filter(file => file !== `${group.folderName}.jpg`).sort();

                // 更新 group.files 結構
                group.files = [
                    titleImage
                        ? { name: titleImage, path: `/uploads/${group.folderName}/${titleImage}`, isTitle: true }
                        : null,
                    ...otherImages.map((file, index) => ({
                        name: file,
                        path: `/uploads/${group.folderName}/${file}`,
                        isTitle: false,
                        index: index + 1
                    }))
                ].filter(Boolean); // 過濾掉可能的 null 值
            } catch (err) {
                console.warn(`Folder not found for group ${group.folderName}:`, err.message);
                group.files = []; // 若無資料夾則設為空
            }
        }

        // 返回同步後的 imagesOrder 結果
        res.status(200).json(imagesOrder);
    } catch (err) {
        console.error('Error reading imagesOrder.json:', err.message);
        res.status(500).json({ error: 'Failed to load image order' });
    }
}
