const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 刪除資料夾內所有檔案
async function deleteFolder(folderName) {
  try {
    const result = await cloudinary.api.delete_resources_by_prefix(folderName);
    console.log(`資料夾內的檔案已刪除: ${folderName}`, result);

    // 刪除資料夾本身（僅在所有檔案刪除後執行）
    const folderResult = await cloudinary.api.delete_folder(folderName);
    console.log(`資料夾已刪除: ${folderName}`, folderResult);
  } catch (error) {
    console.error('刪除資料夾時發生錯誤:', error);
  }
}

// 執行刪除
deleteFolder('uploads');
