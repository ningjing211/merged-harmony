const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const streamifier = require('streamifier');

const { Readable } = require('stream');
const fetch = require('node-fetch');


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

// 這兩行必要
const multer = require('multer');
const storage = multer.memoryStorage(); // 文件存儲到內存
const upload = multer({ storage: storage });  


module.exports = async function handler(req, res) {
    coverUpload.single('coverImage')(req, res, async (err) => {
        const folderIndex = req.query.folderIndex; // 從 query 參數中讀取 folderIndex
        console.log('Received folderIndex:', folderIndex);

        try {
            // 確認是否有文件
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // 使用 Stream 上傳到 Cloudinary
            const streamifier = require('streamifier');
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: `uploads/Group - ${folderIndex}`, // 根據 Group - ${folderIndex} 命名資料夾
                    public_id: 'cover-image', // 固定使用 `cover-image` 作為 public_id
                    overwrite: true,
                },
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        return res.status(500).json({ error: 'Failed to upload to Cloudinary' });
                    }

                    console.log('Cloudinary upload success:', result.secure_url);
                    res.json({
                        message: 'Cover image uploaded successfully',
                        coverUrl: result.secure_url,
                    });
                }
            );

            streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

        } catch (error) {
            console.error('Upload cover error:', error);
            res.status(500).json({ error: 'Failed to upload cover image' });
        }
    });
}