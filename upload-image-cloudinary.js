const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 初始化 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 遍歷資料夾並上傳
async function uploadFolder(folderPath, cloudFolderName) {
  try {
    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isFile()) {
        // 過濾隱藏文件和非圖片文件
        if (file.startsWith('.') || !/\.(jpg|jpeg|png|gif|bmp)$/i.test(file)) {
          console.log(`跳過無效文件: ${filePath}`);
          continue;
        }

        // 檢查是否為封面圖片（檔案名與資料夾名相同）
        const isCover = path.parse(file).name === path.basename(folderPath);

        if (isCover) {
          // 處理封面圖片上傳
          console.log(`上傳封面圖片: ${filePath}`);
          await cloudinary.uploader.upload(filePath, {
            folder: cloudFolderName,
            public_id: `${path.basename(folderPath)}.jpg`, // 使用資料夾名稱作為封面 public_id
            overwrite: true,                      // 覆蓋舊的封面
          });
        } else {
          // 處理一般圖片上傳
          console.log(`上傳檔案: ${filePath}`);
          await cloudinary.uploader.upload(filePath, {
            folder: cloudFolderName,
            public_id: `${path.parse(file).name}.jpg`
        });
        }
      } else if (stat.isDirectory()) {
        // 如果是資料夾，遞迴處理子資料夾
        console.log(`進入子資料夾: ${filePath}`);
        await uploadFolder(filePath, `${cloudFolderName}/${file}`);
      }
    }

    console.log('資料夾上傳完成');
  } catch (error) {
    console.error('上傳資料夾時發生錯誤:', error);
  }
}

// 指定本地資料夾和 Cloudinary 資料夾名稱
const localFolderPath = './uploads'; // 本地 uploads 資料夾的路徑
const cloudFolderName = 'uploads';   // Cloudinary 上的目標資料夾名稱

// 開始上傳
uploadFolder(localFolderPath, cloudFolderName);
