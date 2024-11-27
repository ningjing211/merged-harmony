const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config();

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// JSON 檔案路徑
const jsonFilePath = path.join(__dirname, 'test.json');

// 上傳 JSON 檔案到 Cloudinary
cloudinary.uploader.upload(
  jsonFilePath,
  {
    resource_type: 'raw', // 指定資源類型為 raw
    folder: 'uploads', // 指定上傳資料夾
    public_id: 'test', // 檔案名稱（無副檔名）
  },
  (error, result) => {
    if (error) {
      console.error('Failed to upload JSON file:', error);
    } else {
      console.log('Successfully uploaded JSON file:', result);
      console.log('Access URL:', result.secure_url); // 返回檔案 URL
    }
  }
);
