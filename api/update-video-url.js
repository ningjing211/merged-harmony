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
    const { folderName, newUrl } = req.body; // 獲取前端傳入的資料

    try {
        
        // 1. 從 Cloudinary 獲取 imagesOrder.json 的資源
        const resource = await cloudinary.api.resource('uploads/imagesOrder.json', { resource_type: 'raw' });
        const fileUrl = resource.secure_url;
        console.log('Current imagesOrder.json URL:', fileUrl);

        // 2. 下載並解析 JSON
        const response = await fetch(fileUrl);
        const imagesOrder = await response.json();

        // 3. 找到對應的資料夾並更新影片連結
        const group = imagesOrder.find(g => g.folderName === folderName);

        if (group) {
            group.video = group.video || {}; // 確保 group.video 存在
            console.log('group.video.url:', group.video.url);
            console.log('newURL:', newUrl);
            group.video.url = newUrl; // 更新影片 URL
            console.log('after-group.video.url:', group.video.url);
            // 4. 將更新後的 JSON 上傳回 Cloudinary
            const updatedImagesOrderBase64 = Buffer.from(JSON.stringify(imagesOrder, null, 2)).toString('base64');
            const uploadResponse = await cloudinary.uploader.upload(
                `data:application/json;base64,${updatedImagesOrderBase64}`,
                {
                    resource_type: 'raw',
                    public_id: 'uploads/imagesOrder.json', // 確保覆蓋現有檔案
                    overwrite: true
                }
            );

            console.log('Updated imagesOrder.json uploaded to Cloudinary:', uploadResponse.secure_url);
            res.json({
                message: 'Video URL updated successfully',
                cloudinaryUrl: uploadResponse.secure_url
            });
        } else {
            res.status(404).json({ error: 'Folder not found or video not defined' });
        }
    } catch (err) {
        console.error('Failed to update video URL:', err);
        res.status(500).json({ error: 'Failed to update video URL on Cloudinary' });
    }
}