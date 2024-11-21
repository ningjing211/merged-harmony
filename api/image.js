const fs = require('fs');
const path = require('path');
// 提供 JSON 檔案資料的 API
export default function handler(req, res) {
    const jsonFilePath = path.join(process.cwd(), 'imagesOrder.json');

    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading JSON file:', err);
            res.status(500).json({ error: 'Failed to read data' });
        } else {
            res.status(200).json(JSON.parse(data));
        }
    });
}
