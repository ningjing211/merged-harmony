const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const streamifier = require('streamifier');

const { Readable } = require('stream');
const fetch = require('node-fetch');


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });


module.exports = async function handler(req, res) {
    const { folderName, fileName, newDescription } = req.body;
    console.log('{ folderName, fileName, newDescription }', { folderName, fileName, newDescription })

    try {
        // 1. 獲取 Cloudinary 上的 imagesOrder.json
        const imagesOrderResource = await cloudinary.api.resource('uploads/imagesOrder.json', { resource_type: 'raw' });
        const imagesOrderUrl = imagesOrderResource.secure_url;

        // 2. 下載並解析 JSON
        const response = await fetch(imagesOrderUrl);
        if (!response.ok) throw new Error('Failed to fetch imagesOrder.json from Cloudinary');
        const imagesOrder = await response.json();

        console.log('Original JSON:', imagesOrder);
            

        // 3. 找到對應資料夾與圖片
        const group = imagesOrder.find(group => group.folderName === folderName);
        if (!group) return res.status(404).json({ error: 'Folder not found' });

        const image = group.additionalImages.find(img => img.name === fileName);
        if (!image) return res.status(404).json({ error: 'Image not found' });
 
        image.imageDescription = newDescription;
    

        // 4. 更新 Cloudinary 上的 JSON 文件
        const updatedImagesOrder = JSON.stringify(imagesOrder, null, 2);
        
        const uploadResponse = await cloudinary.uploader.upload(
            `data:application/json;base64,${Buffer.from(updatedImagesOrder).toString('base64')}`,
            { resource_type: 'raw', public_id: 'uploads/imagesOrder.json', overwrite: true }
        );

        console.log('Updated imagesOrder.json uploaded:', uploadResponse);
        res.json({ message: 'Image description updated successfully', url: uploadResponse.secure_url });
    } catch (err) {
        console.error('Error updating image description:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}
