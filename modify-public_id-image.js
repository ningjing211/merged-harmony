const cloudinary = require('cloudinary').v2;
require('dotenv').config();
// 初始化 Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

async function updatePublicId(oldPublicId, newPublicId) {
    try {
        console.log(`Step 1: Fetching existing file with Public ID: ${oldPublicId}`);
        const resource = await cloudinary.api.resource(oldPublicId, { resource_type: 'image' });

        console.log('Step 2: Re-uploading file with new Public ID');
        const uploadResponse = await cloudinary.uploader.upload(resource.secure_url, {
            public_id: newPublicId,
            resource_type: 'image', // 根據檔案類型選擇 'image' 或 'raw'
            overwrite: true,
        });

        console.log(`File re-uploaded successfully with new Public ID: ${newPublicId}`);

        console.log('Step 3: Deleting old file');
        await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'image' });

        console.log(`Old file deleted successfully: ${oldPublicId}`);
    } catch (error) {
        console.error('Error updating Public ID:', error);
    }
}

// 使用範例
updatePublicId(
    'uploads/Always can one Love/Always can one Love.jpg',
    'uploads/Always can one Love/Nature Loves You Back.jpg'
);
