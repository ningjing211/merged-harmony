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
      // 1. 获取 test.json 文件的 URL
      const resource = await cloudinary.api.resource('uploads/test.json', { resource_type: 'raw' });
      const fileUrl = resource.secure_url;
  
      // 2. 下载 test.json 文件
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Failed to fetch test.json from Cloudinary');
      const jsonData = await response.json();
  
      console.log('Original JSON:', jsonData);
  
      // 3. 修改 imageDescription 字段
      jsonData.imageDescription = 'Well done';
  
      // 4. 将修改后的 JSON 转换为字符串并上传覆盖
      const updatedData = JSON.stringify(jsonData, null, 2);
      const uploadResponse = await cloudinary.uploader.upload(
        `data:application/json;base64,${Buffer.from(updatedData).toString('base64')}`,
        { resource_type: 'raw', public_id: 'uploads/test.json', overwrite: true }
      );
  
      console.log('Updated test.json uploaded:', uploadResponse.secure_url);
    } catch (err) {
      console.error('Error updating test.json:', err);
    }
  })();