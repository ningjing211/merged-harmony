const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const streamifier = require('streamifier');
const axios = require('axios');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

// 獲取 imagesOrder.json 並讀取內容
cloudinary.api.resource('uploads/imagesOrder.json', { resource_type: 'raw' })
    .then(async (response) => {
        const fileUrl = response.secure_url;
        console.log('Fetching imagesOrder.json content...');
        const res = await axios.get(fileUrl); // 取得檔案內容
        const imagesOrder = res.data; // 解析 JSON 資料

        // 展開並列印 additionalImages 的內容
        imagesOrder.forEach(group => {
            console.log(`Folder: ${group.folderName}`);
            console.log(`Video: ${group.video.url}`);
            console.log(`path(cover-image): ${group.path}`);
            group.additionalImages.forEach(image => {
                console.log(`  Image Name: ${image.name}`);
                console.log(`  Description: ${image.imageDescription}`);
                console.log(`  other Image path: ${image.path}`);

            });
        });
    })
    .catch(error => {
        console.error('Error fetching imagesOrder.json:', error);
    });