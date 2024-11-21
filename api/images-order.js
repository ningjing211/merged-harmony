import fs from 'fs/promises';
import path from 'path';

export default async function handler(req, res) {
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const imagesOrderPath = path.join(process.cwd(), 'public', 'imagesOrder.json');

    // 讀取 `imagesOrder.json` 檔案
    let imagesOrderData;
    try {
      imagesOrderData = await fs.readFile(imagesOrderPath, 'utf8');
    } catch (err) {
      console.error('Error reading imagesOrder.json:', err);
      return res.status(500).json({ error: 'Failed to load image order' });
    }

    let imagesOrder;
    try {
      imagesOrder = JSON.parse(imagesOrderData);
    } catch (err) {
      console.error('Error parsing JSON:', err);
      return res.status(500).json({ error: 'Invalid JSON format in imagesOrder.json' });
    }

    // 遍歷每個群組，確認封面和其他圖片
    for (const group of imagesOrder) {
      const folderPath = path.join(uploadsDir, group.folderName);

      try {
        const files = await fs.readdir(folderPath);
        const filteredFiles = files.filter(file => !file.startsWith('.'));

        const titleImage = filteredFiles.find(file => file === `${group.folderName}.jpg`);
        const otherImages = filteredFiles.filter(file => file !== `${group.folderName}.jpg`).sort();

        group.files = [
          titleImage ? { name: titleImage, path: `/uploads/${group.folderName}/${titleImage}`, isTitle: true } : null,
          ...otherImages.map((file, index) => ({
            name: file,
            path: `/uploads/${group.folderName}/${file}`,
            isTitle: false,
            index: index + 1,
          })),
        ].filter(Boolean); // 過濾掉可能的 null 值
      } catch (err) {
        console.error(`Error reading directory ${folderPath}:`, err);
        group.files = []; // 若目錄不存在，設定為空
      }
    }

    res.status(200).json(imagesOrder);
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
