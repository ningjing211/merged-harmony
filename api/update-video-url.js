// 更新影片連結的 API
const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
    const { folderName, newUrl } = req.body; // Now req.body should be defined
    const filePath = path.join(__dirname, 'imagesOrder.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to load image order' });
        }

        const imagesOrder = JSON.parse(data);
        const group = imagesOrder.find(g => g.folderName === folderName);

        if (group) {
            // Ensure group.video exists before updating
            group.video = group.video || {};
            group.video.url = newUrl;

            fs.writeFile(filePath, JSON.stringify(imagesOrder, null, 2), (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to save image order' });
                }
                res.json({ message: 'Video URL updated successfully' });
            });
        } else {
            res.status(404).json({ error: 'Folder not found or video not defined' });
        }
    });
};