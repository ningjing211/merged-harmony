const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
    const newImagesOrder = req.body; // 獲取前端傳送的資料
    const filePath = path.join(__dirname, 'imagesOrder.json');

    // 將接收到的資料寫入 imagesOrder.json
    fs.writeFile(filePath, JSON.stringify(newImagesOrder, null, 2), 'utf8', (err) => {
        if (err) {
            console.error('Failed to write imagesOrder.json:', err);
            return res.status(500).json({ error: 'Failed to update image order file' });
        }

        console.log('Images order updated successfully');
        res.json({ message: 'Images order updated successfully' });
    });
};