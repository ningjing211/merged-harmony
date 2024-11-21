app.get('/api/images-order', (req, res) => {
    const uploadsDir = path.join(__dirname, 'uploads');
    const imagesOrderPath = path.join(__dirname, 'imagesOrder.json');

    fs.readFile(imagesOrderPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to load image order' });
        }

        let imagesOrder = JSON.parse(data);

        // 將 `imagesOrder.json` 中的內容與 `uploads` 資料夾同步
        imagesOrder.forEach(group => {
            const folderPath = path.join(uploadsDir, group.folderName);
            if (fs.existsSync(folderPath)) {
                let files = fs.readdirSync(folderPath).filter(file => !file.startsWith('.'));

                // 確認封面圖片
                const titleImage = files.find(file => file === `${group.folderName}.jpg`);
                const otherImages = files.filter(file => file !== `${group.folderName}.jpg`).sort();

                // 更新 `group.files` 結構以包含封面和其他圖片
                group.files = [
                    titleImage ? { name: titleImage, path: `/uploads/${group.folderName}/${titleImage}`, isTitle: true } : null,
                    ...otherImages.map((file, index) => ({
                        name: file,
                        path: `/uploads/${group.folderName}/${file}`,
                        isTitle: false,
                        index: index + 1
                    }))
                ].filter(Boolean); // 過濾掉可能的 null 值
            }
        });

        res.json(imagesOrder);
    });
});