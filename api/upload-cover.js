const fs = require('fs/promises');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false, // 禁用內建 bodyParser，使用 multer 處理 multipart/form-data
  },
};

// 使用 multer 處理文件上傳到內存中
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  const folderName = req.query.folderName;
  const imagesOrderPath = path.join(process.cwd(), 'public', 'imagesOrder.json');

  try {
    // 讀取 imagesOrder.json 文件
    const data = await fs.readFile(imagesOrderPath, 'utf8');
    const imagesOrder = JSON.parse(data);

    const group = imagesOrder.find((g) => g.folderName === folderName);
    if (!group) {
      return res.status(404).json({ error: `Folder not found: ${folderName}` });
    }

    // 使用 multer 處理上傳文件
    upload.single('coverImage')(req, {}, async (err) => {
      if (err) {
        console.error('File upload failed:', err);
        return res.status(500).json({ error: 'File upload failed' });
      }

      try {
        // 將封面圖上傳至 Cloudinary
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `uploads/${folderName}`, // Cloudinary 資料夾
            public_id: `${folderName}.jpg`, // 使用資料夾名稱作為封面 public_id
            overwrite: true, // 覆蓋舊的封面
          },
          async (error, result) => {
            if (error) {
              console.error('Cloudinary upload failed:', error);
              return res.status(500).json({ error: 'Failed to upload to Cloudinary' });
            }

            console.log(`封面圖已更新: ${result.secure_url}`);

            // 更新 imagesOrder.json 文件中的封面 URL
            group.coverUrl = result.secure_url;
            await fs.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');

            res.json({ message: 'Cover image uploaded successfully', coverUrl: result.secure_url });
          }
        );

        // 將檔案 buffer 傳遞給 Cloudinary
        streamifier = require('streamifier');
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      } catch (uploadError) {
        console.error('Failed to process file upload:', uploadError);
        res.status(500).json({ error: 'Failed to process file upload' });
      }
    });
  } catch (readError) {
    console.error('Failed to read imagesOrder.json:', readError);
    res.status(500).json({ error: 'Failed to read imagesOrder.json' });
  }
};
