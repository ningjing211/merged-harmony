const cloudinary = require('cloudinary').v2;
require('dotenv').config();const fs = require('fs');

const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

async function deleteAndUploadImagesOrder() {
    try {

        // Step 2: 上傳新的 imagesOrder.json
        console.log('Step 2: Uploading new imagesOrder.json to Cloudinary');
        const imagesOrderPath = path.join(__dirname, 'imagesOrder.json');
        const imagesOrderContent = fs.readFileSync(imagesOrderPath, 'utf-8');

        const uploadResponse = await cloudinary.uploader.upload(
            `data:application/json;base64,${Buffer.from(imagesOrderContent).toString('base64')}`,
            { resource_type: 'raw', public_id: 'uploads/imagesOrder.json', overwrite: true }
        );

        console.log('New imagesOrder.json uploaded successfully to Cloudinary:', uploadResponse.secure_url);
    } catch (error) {
        console.error('Error during delete and upload of imagesOrder.json:', error);
    }
}

deleteAndUploadImagesOrder();
