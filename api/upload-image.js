const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const folderName = req.params.folderName;
        const uploadPath = path.join(process.cwd(), 'uploads', folderName);

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const index = req.params.index;
        cb(null, `${Number(index) + 1}.jpg`);
    }
});

const upload = multer({ storage });
// 導出 API 處理函數
export default function handler(req, res) {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(500).json({ error: 'File upload failed' });
        }
    const folderName = req.params.folderName;
    console.log('先印出foldername1', folderName);
    const index = Number(req.params.index);
    console.log('print index', index);
    const imageDescription = req.params.imageDescription;
    console.log('imageDescription', imageDescription);
    const filePath = path.join(__dirname, 'imagesOrder.json');
    console.log(filePath);
    try {
        // 讀取 imagesOrder.json
        const data = await fs.promises.readFile(filePath, 'utf8');
        let imagesOrder = JSON.parse(data);
        console.log('先印出foldername2', folderName);
        const group = imagesOrder.find(g => g.folderName === folderName);
        console.log(group);
        if (!group) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        if (!group.additionalImages) {
            group.additionalImages = [];
        }

        // 設定檔案名稱和路徑
        const fileName = index + 1;
        console.log(fileName);
        const imageFileName = `${fileName}.jpg`;
        const imagePath = path.join(__dirname, 'uploads', folderName, imageFileName);
        console.log('imagePath:', imagePath);
        // 移動上傳的檔案到目標位置
        console.log(req);
        console.log('breakkkkkkkkkkkkkkkkkkery');
        console.log(req.file);
        console.log(req.file.path);
        await fs.promises.rename(req.file.path, imagePath);

        // 更新 imagesOrder.json 中的路徑
        const image = group.additionalImages.find(file => file.index === index);
        if (image) {
            image.path = `/uploads/${folderName}/${imageFileName}`;
            image.name = imageFileName;
            console.log('xxx', image.path)
        } else {
            group.additionalImages.push({ name: imageFileName, path: `/uploads/${folderName}/${imageFileName}`, imageDescription: imageDescription});
        }

        // 寫回更新後的 imagesOrder.json
        await fs.promises.writeFile(filePath, JSON.stringify(imagesOrder, null, 2), 'utf8');
        console.log(`Image uploaded successfully for ${folderName}, index ${index}: ${imagePath}`);
        res.json({ path: `/uploads/${folderName}/${imageFileName}`, message: 'Image uploaded successfully' });
    } catch (err) {
        console.error('Error handling upload:', err);
        res.status(500).json({ error: 'Failed to handle upload' });
    }
    });
};