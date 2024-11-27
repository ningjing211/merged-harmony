const cloudinary = require('cloudinary').v2;
require('dotenv').config();const fs = require('fs');

const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const restoreAndDeleteFolder = async (oldFolderName, currentFolderName) => {
    try {
      // 列出 Wonderful 資料夾內的資源
      console.log(`Fetching assets in the folder: ${currentFolderName}`);
      const assets = await cloudinary.api.resources({
        type: 'upload',
        prefix: currentFolderName,
      });
  
      if (assets.resources.length === 0) {
        console.log(`No resources found in the folder: ${currentFolderName}`);
      } else {
        // 將 Public ID 改回 Nature Loves You Back
        console.log(`Renaming assets to ${oldFolderName}`);
        for (const asset of assets.resources) {
          const newPublicId = asset.public_id.replace(currentFolderName, oldFolderName);
          await cloudinary.uploader.rename(asset.public_id, newPublicId);
          console.log(`Renamed ${asset.public_id} to ${newPublicId}`);
        }
  
        // 刪除 Nature Loves You Back 資料夾下的所有資源
        console.log(`Deleting resources in the folder: ${oldFolderName}`);
        await cloudinary.api.delete_resources_by_prefix(oldFolderName);
  
        // 刪除資料夾
        console.log(`Deleting the folder: ${oldFolderName}`);
        await cloudinary.api.delete_folder(oldFolderName);
        console.log(`Folder ${oldFolderName} deleted successfully.`);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  // 測試函式
  restoreAndDeleteFolder('uploads/Nature Loves You Back', 'uploads/Wonderful');