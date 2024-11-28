const cloudinary = require('cloudinary').v2;
require('dotenv').config();const fs = require('fs');

const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const deleteFolderAndContents = async (folderName) => {
    try {
      console.log(`Fetching resources in the folder: ${folderName}`);
      
      // 列出資料夾內的所有檔案
      const { resources } = await cloudinary.api.resources({
        type: 'upload',
        prefix: folderName,
        max_results: 500, // 設置最大值，確保能取得所有檔案
      });
  
      // 刪除所有檔案
      if (resources.length > 0) {
        const publicIds = resources.map((resource) => resource.public_id);
        console.log(`Deleting resources: ${publicIds}`);
        await cloudinary.api.delete_resources(publicIds);
      }
  
      // 列出所有子資料夾
      const { folders } = await cloudinary.api.sub_folders(folderName);
      if (folders && folders.length > 0) {
        for (const subFolder of folders) {
          console.log(`Recursively deleting sub-folder: ${subFolder.path}`);
          await deleteFolderAndContents(subFolder.path); // 遞迴刪除子資料夾
        }
      }
  
      // 刪除資料夾本身
      console.log(`Deleting the folder: ${folderName}`);
      await cloudinary.api.delete_folder(folderName);
      console.log(`Folder ${folderName} deleted successfully.`);
    } catch (error) {
      console.error('Error while deleting folder:', error);
    }
  };
  
  // 測試函式
  deleteFolderAndContents('Group-1');