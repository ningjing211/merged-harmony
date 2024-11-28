const cloudinary = require('cloudinary').v2;
require('dotenv').config();const fs = require('fs');

const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  // 上傳單一檔案
  const uploadFile = async (filePath, folderPath, publicId, folderName) => {
    try {
      console.log(`Uploading ${filePath} to ${folderPath}`);
      console.log('publicId', publicId);
      
      // 如果檔名包含 folderName，改為 cover-image
      if (publicId.includes(folderName)) {
        console.log(`File name contains folder name (${folderName}), renaming to cover-image`);
        publicId = 'cover-image';
      }

      const result = await cloudinary.uploader.upload(filePath, {
        folder: folderPath,
        public_id: publicId
      });
      console.log(`Uploaded: ${result.secure_url}`);
    } catch (error) {
      console.error(`Error uploading ${filePath}:`, error);
    }
  };
  
  // 上傳資料夾
  const uploadFolder = async (folderName, groupFolder, localFolderPath) => {
    try {
      const files = fs.readdirSync(localFolderPath);
      for (const file of files) {
        // 過濾掉 .DS_Store 和其他隱藏文件
        if (file === '.DS_Store' || file.startsWith('.')) {
          console.log(`Skipping hidden file: ${file}`);
          continue;
        }
        
        const filePath = path.join(localFolderPath, file);
        if (fs.lstatSync(filePath).isFile()) {
          const publicId = path.parse(file).name; // 只取檔名（不含副檔名）
          console.log('publicId', publicId);
          await uploadFile(filePath, `uploads/${groupFolder}/`, publicId, folderName);
        }
      }
    } catch (error) {
      console.error(`Error processing folder ${folderName}:`, error);
    }
  };
  
  // 主流程
  const uploadFromImagesOrder = async () => {
    try {
      const imagesOrderPath = path.join(__dirname, 'imagesOrder.json');
      const uploadsFolderPath = path.join(__dirname, 'uploads');
      
      // 讀取 imagesOrder.json
      const imagesOrder = JSON.parse(fs.readFileSync(imagesOrderPath, 'utf8'));
  
      // 依序處理每個資料夾
      for (const group of imagesOrder) {
        const { folderName, index } = group;
        const groupFolder = `Group - ${index}`; // 組別資料夾名稱
        const localFolderPath = path.join(uploadsFolderPath, folderName);
  
        console.log(`Processing folder: ${folderName} -> ${groupFolder}`);
        console.log('localFolderPath', localFolderPath);
  
        // 確保本地端資料夾存在
        if (fs.existsSync(localFolderPath) && fs.lstatSync(localFolderPath).isDirectory()) {
          await uploadFolder(folderName, groupFolder, localFolderPath);
        } else {
          console.warn(`Local folder not found: ${localFolderPath}`);
        }
      }
  
      console.log('All folders processed successfully!');
    } catch (error) {
      console.error('Error in uploadFromImagesOrder:', error);
    }
  };
  
  // 執行
  uploadFromImagesOrder();
  