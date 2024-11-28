const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const fs = require('fs');
const path = require('path');

// 初始化 Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const copyAFolder = async (oldFolderName, newFolderName) => {
    console.log(`Starting to copy folder: ${oldFolderName} -> ${newFolderName}`);

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
            public_id: 'temp.jpg', // 可自行命名，這裡命名為 temp
        });
        console.log('File uploaded successfully:', uploadResponse);

        // Step 1: Fetch all files in the old folder
        const { resources } = await cloudinary.api.resources({
            type: 'upload',
            prefix: `uploads/${oldFolderName}/`,
        });

        if (resources.length === 0) {
            console.log(`No files found in folder: uploads/${oldFolderName}`);
            return;
        }

        // Step 3: Rename files to the new folder
        for (const file of resources) {
            const oldPublicId = file.public_id;

            console.log('oldPublicId', oldPublicId);
            console.log('file', file);

            // Replace oldFolderName with newFolderName
            const newPublicId = oldPublicId.split(`${oldFolderName}`).join(`${newFolderName}`);
            console.log('newPublicId:', newPublicId);

            await cloudinary.uploader.rename(oldPublicId, newPublicId, {
                overwrite: true,
            });
            console.log(`Copied: ${oldPublicId} -> ${newPublicId}`);
        }


        console.log(`Folder copied successfully: ${oldFolderName} -> ${newFolderName}`);
    } catch (error) {
        console.error('Error copying folder:', error);
    }
};

// Example usage
copyAFolder('Nature Loves You Back', 'Dance');
