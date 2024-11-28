const cloudinary = require('cloudinary').v2;
require('dotenv').config();const fs = require('fs');

const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

// 上傳 temp.jpg 檔案到指定的新資料夾
const uploadTempFile = async (newFolderName) => {
    try {
        // 檢查本地 temp.jpg 是否存在
        const localFilePath = path.join(__dirname, 'temp.jpg');
        if (!fs.existsSync(localFilePath)) {
            console.error(`File not found: ${localFilePath}`);
            return;
        }

        console.log(`Uploading temp.jpg to folder: ${newFolderName}`);

        // 上傳 temp.jpg 到 Cloudinary 的指定資料夾
        const uploadResponse = await cloudinary.uploader.upload(localFilePath, {
            folder: `uploads/${newFolderName}`,
            public_id: 'temp', // 可自行命名，這裡命名為 temp
        });

        console.log('File uploaded successfully:', uploadResponse);
    } catch (error) {
        console.error('Error uploading temp.jpg:', error);
    }
};

// 呼叫函式並指定 newFolderName
const newFolderName = 'Happy'; // 將此處改為你的資料夾名稱
uploadTempFile(newFolderName);