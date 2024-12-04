const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const streamifier = require('streamifier');

const { Readable } = require('stream');
const fetch = require('node-fetch');

const fs = require('fs');
const path = require('path');


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

module.exports = async function handler(req, res) {
    try {
        const { folderName, newFileName, folderIndex, howManytoAdds } = req.body; // 確認接收到 folderName 和 newFileName
        console.log('folderName:', folderName);
        console.log('newFileName:', newFileName);
        console.log('folderIndex:', folderIndex);
        const index = Number(newFileName - 1);
        console.log('看一下index', index);
        console.log('要新增幾張', howManytoAdds);

        // 定義 local 的來源檔案路徑
        // 移除 public
        const localFilePath = path.join(__dirname, 'uploads', 'upload.jpg');
        if (!fs.existsSync(localFilePath)) {
            return res.status(404).json({ error: 'Local upload.jpg not found' });
        }

        // 定義來源和目標路徑
        const targetPublicId = `uploads/Group - ${folderIndex}/${newFileName}`;
        console.log('targetPublicId',targetPublicId)

        const result = await cloudinary.uploader.upload(localFilePath, {
            folder: `uploads/Group - ${folderIndex}`,
            public_id: newFileName,
            overwrite: true,
        });
        console.log(`Successfully uploaded to ${result.secure_url}`);

        // 獲取 imagesOrder.json
        const imagesOrderResource = await cloudinary.api.resource('uploads/imagesOrder.json', { resource_type: 'raw' });
        const response = await fetch(imagesOrderResource.secure_url);
        if (!response.ok) throw new Error('Failed to fetch imagesOrder.json from Cloudinary');
        const imagesOrder = await response.json();

        // 更新 imagesOrder.json
        const group = imagesOrder.find(group => group.folderName === folderName);
        if (!group) {
            return res.status(404).json({ error: 'Folder not found in imagesOrder.json' });
        }

        if (!group.additionalImages) {
            group.additionalImages = [];
        }
        
        
        group.additionalImages.push({
            name: `${newFileName}.jpg`,
            path: `/uploads/${folderName}/${newFileName}.jpg`,
            index: index,
            imageDescription: 'type your words'
        });
        console.log('Updated additionalImages array:', JSON.stringify(group.additionalImages, null, 2));

        // 上傳更新後的 imagesOrder.json
        const updatedImagesOrderContent = JSON.stringify(imagesOrder, null, 2);
        await cloudinary.uploader.upload(
            `data:application/json;base64,${Buffer.from(updatedImagesOrderContent).toString('base64')}`,
            {
                folder: 'uploads',
                public_id: 'imagesOrder.json',
                resource_type: 'raw',
                overwrite: true,
            }
        );
        console.log('測試一下', result.secure_url);
        // 回應成功訊息
        res.json({
            message: `Successfully copied to ${targetPublicId}`,
            imageUrl: result.secure_url, // 回傳圖片的 URL
        });

        } catch (err) {
        console.error('Error copying file:', err);
        res.status(500).json({ error: 'Failed to copy file' });
    }
}