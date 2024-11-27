const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
require('dotenv').config();

// 配置 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

(async () => {
  try {
    // 1. 獲取 imagesOrder.json 文件的 URL
    const resource = await cloudinary.api.resource('uploads/imagesOrder.json', { resource_type: 'raw' });
    const fileUrl = resource.secure_url;

    // 2. 下載 imagesOrder.json 文件
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error('Failed to fetch imagesOrder.json from Cloudinary');
    const jsonData = await response.json();

    console.log('Original JSON:', jsonData);

    // 3. 修改特定的 imageDescription
    const targetGroup = jsonData.find(group => group.folderName === 'Nature Loves You Back');
    if (!targetGroup) throw new Error('Folder "Nature Loves You Back" not found in imagesOrder.json');

    const targetImage = targetGroup.additionalImages.find(img => img.name === '5.jpg');
    if (!targetImage) throw new Error('Image "5.jpg" not found in folder "Nature Loves You Back"');

    targetImage.imageDescription = 'I Love you all. Yes!';
    console.log('Updated JSON:', jsonData);

    // 4. 將修改後的 JSON 上傳並覆蓋
    const updatedData = JSON.stringify(jsonData, null, 2);
    const uploadResponse = await cloudinary.uploader.upload(
      `data:application/json;base64,${Buffer.from(updatedData).toString('base64')}`,
      { resource_type: 'raw', public_id: 'uploads/imagesOrder.json', overwrite: true }
    );

    console.log('Updated imagesOrder.json uploaded:', uploadResponse.secure_url);
  } catch (err) {
    console.error('Error updating imagesOrder.json:', err);
  }
})();