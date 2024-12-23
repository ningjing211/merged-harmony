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

  
module.exports = async function handler(req, res) {
    try {
        // 從 Cloudinary 獲取 imagesOrder.json 的 URL
        const resource = await cloudinary.api.resource('uploads/imagesOrder.json', { resource_type: 'raw' });
        const fileUrl = resource.secure_url;

        // 使用 fetch 下載 JSON 資料
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to fetch imagesOrder.json from Cloudinary');

        // 將資料轉換為 JSON 格式
        const data = await response.json();

        // 回傳 JSON 給前端
        res.json(data);
    } catch (error) {
        console.error('Error fetching JSON file from Cloudinary:', error);
        res.status(500).send('Error reading data from Cloudinary');
        try {
            const localFilePath = path.join(__dirname, 'public', 'imagesOrder.json');
            const localData = await fs.promises.readFile(localFilePath, 'utf-8');
            const imagesOrder = JSON.parse(localData);
            res.json(imagesOrder);
        } catch (localError) {
            console.error('Error reading local imagesOrder.json file:', localError);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}