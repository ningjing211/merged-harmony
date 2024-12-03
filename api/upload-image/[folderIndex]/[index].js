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
    const { folderIndex, index } = req.query; // 動態路由參數從 req.query 提取
    const imageDescription = req.body.imageDescription || 'Default description';
    const filePath = 'uploads/imagesOrder.json'; // 在 Cloudinary 上的 JSON 路徑

    try {
        // 讀取 imagesOrder.json
        const resource = await cloudinary.api.resource(filePath, { resource_type: 'raw' });
        const fileUrl = resource.secure_url;
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to fetch imagesOrder.json from Cloudinary');
        let imagesOrder = await response.json();

        // 找到對應的 group
        const group = imagesOrder.find(g => g.index === Number(folderIndex));
        if (!group) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        if (!group.additionalImages) {
            group.additionalImages = [];
        }

        // 上傳檔案到 Cloudinary
        const fileName = Number(index) + 1;
        const imageFileName = `${fileName}.jpg`;
        console.log('imageFileName', imageFileName);
        const streamifier = require('streamifier');
        const folderPath = `uploads/Group - ${folderIndex}`; // Cloudinary 資料夾路徑
        console.log('folderPath', folderPath);

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folderPath,
                public_id: fileName, // 使用檔名作為 public_id
                overwrite: true,
            },
            async (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return res.status(500).json({ error: 'Failed to upload to Cloudinary' });
                }

                console.log('Cloudinary upload success:', result.secure_url);

                console.log('測試index', index);
                // 更新 imagesOrder.json 中的路徑
                const image = group.additionalImages.find(file => {
                    // Debug information
                    console.log('Debugging file:', file); // Print the current file being checked
                    console.log('file.index:', file.index); // Print the index of the current file
                    console.log('index:', index); // Print the index being searched for
                    console.log('Comparison result (file.index === index):', file.index === index); // Print the result of the comparison
                
                    // Return the comparison result
                    return file.index === index;
                });            
                // Additional debug if image is not found
                if (!image) {
                    console.warn('No matching image found for index:', index);
                    console.warn('Available indices in additionalImages:', group.additionalImages.map(file => file.index)); // Print all indices
                }
                // 獲取對應的 folderName
                const folderName = group.folderName;
                console.log('找到的 folderName:', folderName);
                
                if (image) {
                    console.log('上傳成功走這條路');
                    console.log('image-index222', image.index);
                    image.path = `/uploads/${folderName}/${imageFileName}`; // 使用 Cloudinary 的 secure_url
                    image.name = imageFileName;
                } else {
                    console.log('上傳不成功???');
                    console.log('image-index333', image.index);
                    group.additionalImages.push({ 
                        name: imageFileName, 
                        path: `/uploads/${folderName}/${imageFileName}`, 
                        imageDescription: 'what happened?' 
                    });
                }

                // 更新 imagesOrder.json 並上傳回 Cloudinary
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

                

                console.log(`Image uploaded successfully for Group - ${folderIndex}, index ${index}`);
                res.json({ 
                    path: result.secure_url, 
                    message: 'Image uploaded successfully' 
                });
            }
        );

        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

    } catch (err) {
        console.error('Error handling upload:', err);
        res.status(500).json({ error: 'Failed to handle upload' });
    }
}