const cloudinary = require('cloudinary').v2;
require('dotenv').config();const fs = require('fs');

const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

// Function: 上傳圖片到 Cloudinary 指定資料夾
async function uploadImageToAFolder(localFolderName, CloudinaryFolderName) {
    try {
      const imagesOrderPath = path.join(__dirname, 'imagesOrder.json');
      const localFolderPath = path.join(__dirname, 'uploads', localFolderName);
  
      // 讀取 imagesOrder.json 檔案
      const imagesOrderData = JSON.parse(fs.readFileSync(imagesOrderPath, 'utf8'));
      const group = imagesOrderData.find((g) => g.folderName === localFolderName);
  
      if (!group) {
        throw new Error(`Folder ${localFolderName} not found in imagesOrder.json`);
      }
  
      console.log(`Processing folder: ${localFolderName}`);
      console.log(`Target Cloudinary folder: ${CloudinaryFolderName}`);
      
      // 上傳封面圖片(not working)

      const coverImagePath = group.path.split('?')[0];;
      console.log('coverImagePath', coverImagePath);
      const localCoverImagePath = path.join(__dirname, coverImagePath);

      if (fs.existsSync(localCoverImagePath)) {
      console.log(`Uploading cover image: ${localCoverImagePath}`);

      const coverUploadResponse = await cloudinary.uploader.upload(localCoverImagePath, {
          folder: `uploads/${CloudinaryFolderName}`,
          public_id: `${CloudinaryFolderName}.jpg`,
      });

      console.log(`Cover image uploaded: ${coverUploadResponse.public_id}`);
      } else {
      console.warn(`Cover image not found: ${localCoverImagePath}, skipping.`);
      }

      
   
      // 獲取 additionalImages 資料
      const additionalImages = group.additionalImages;
  
      // 確認 localFolderPath 是否存在
      if (!fs.existsSync(localFolderPath)) {
        throw new Error(`Local folder not found: ${localFolderPath}`);
      }
  
      // 上傳圖片
      for (const image of additionalImages) {
        const imageName = image.name;
        const localImagePath = path.join(localFolderPath, imageName);
  
        // 確認圖片是否存在於 local 資料夾中
        if (!fs.existsSync(localImagePath)) {
          console.warn(`Image not found: ${localImagePath}, skipping.`);
          continue;
        }
  
        // 使用原本檔案名稱中的數字，並添加新的資料夾名稱
        const imageNumber = imageName.match(/\d+/)?.[0] || ''; // 取得數字部分
        const newPublicId = `uploads/${CloudinaryFolderName}/${imageNumber}.jpg`;
  
        console.log(`Uploading ${localImagePath} to Cloudinary as ${newPublicId}`);
  
        // 上傳圖片到 Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(localImagePath, {
          folder: `uploads/${CloudinaryFolderName}`,
          public_id: newPublicId,
        });
  
        console.log(`Uploaded: ${uploadResponse.public_id}`);
      }
  
      console.log(`All images from ${localFolderName} uploaded to ${CloudinaryFolderName}.`);
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  // 測試函式
  uploadImageToAFolder('Nature Loves You Back', 'Dance');