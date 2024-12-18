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
    const { folderName, imageName, imageIndex } = req.body;
    console.log('Received remove request:', { folderName, imageName, imageIndex });

    try {
        // 獲取 imagesOrder.json 從 Cloudinary
        const imagesOrderResource = await cloudinary.api.resource('uploads/imagesOrder.json', { resource_type: 'raw' });
        const response = await fetch(imagesOrderResource.secure_url);
        if (!response.ok) throw new Error('Failed to fetch imagesOrder.json from Cloudinary');
        const imagesOrder = await response.json();

        // 找到對應的 group
        const group = imagesOrder.find(g => g.folderName === folderName);
        if (!group || !group.additionalImages[imageIndex] || group.additionalImages[imageIndex].name !== imageName) {
            return res.status(404).json({ error: 'Image not found in the specified group' });
        }

        // 刪除指定索引的圖片
        console.log('Removing image:', group.additionalImages[imageIndex]);
        console.log('Group index of removing image:', group.index);
        const folderIndex = group.index;

        const targetPublicId = `uploads/Group - ${folderIndex}/${imageName.replace('.jpg', '')}`;
        console.log('Target Public ID:', targetPublicId);

        try {
            // 從 Cloudinary 刪除圖片
            await cloudinary.uploader.destroy(targetPublicId, { resource_type: 'image' });
            console.log(`Image ${imageName} deleted from Cloudinary`);
        } catch (destroyErr) {
            console.error('Failed to delete image from Cloudinary:', destroyErr);
            return res.status(500).json({ error: 'Failed to delete image from Cloudinary' });
        }

        // 刪除陣列中的對應圖片
        group.additionalImages.splice(imageIndex, 1);

        // 處理剩餘圖片
        async function processRemainingImages(group, folderIndex, folderName) {
            console.log('Starting to process remaining images...');
            console.log('Initial group:', JSON.stringify(group, null, 2));
            console.log(`Folder Index: ${folderIndex}, Folder Name: ${folderName}`);
        
            for (let i = imageIndex; i < group.additionalImages.length; i++) {
                const image = group.additionalImages[i];
                const oldPublicId = `uploads/Group - ${folderIndex}/${image.name.replace('.jpg', '')}`;
                const newName = `${i + 1}.jpg`;  // 重新命名
                const newPublicId = newName.replace('.jpg', '');
        
                console.log(`Processing image at index ${i}`);
                console.log(`Old Public ID: ${oldPublicId}`);
                console.log(`New Name: ${newName}`);
                console.log(`New Public ID: ${newPublicId}`);
        
                // 下載圖片到記憶體
                const imageUrl = image.path;
                console.log(`Old Public ID: ${oldPublicId}`);
                console.log(`Image URL for download: ${imageUrl}`);
                
                const response = await fetch(imageUrl);
                if (!response.ok) {
                    console.error(`Failed to fetch image from ${imageUrl}`);
                    throw new Error(`Fetch failed for URL: ${imageUrl}`);
                }
                const imageBuffer = await response.buffer();
                console.log(`Image buffer downloaded for ${oldPublicId}`);
        
                // 刪除 Cloudinary 中舊的圖片
                try {
                    await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'image' });
                    console.log(`Successfully deleted old image: ${oldPublicId}`);
                } catch (error) {
                    console.error(`Error deleting old image: ${oldPublicId}`, error);
                    throw error;
                }
        
                // 上傳圖片到 Cloudinary，並更新名稱
                try {
                    await new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream(
                            {
                                public_id: newPublicId,
                                folder: `uploads/Group - ${folderIndex}`,
                                resource_type: 'image',
                            },
                            (error, result) => {
                                if (error) {
                                    console.error(`Error uploading new image: ${newName}`, error);
                                    reject(error);
                                } else {
                                    console.log(`Successfully uploaded and renamed image: ${newName}`);
                                    
                                    // 更新 image.path 為 Cloudinary 的 secure_url
                                    image.path = result.secure_url;
                                    console.log(`Updated image path with Cloudinary secure_url: ${image.path}`);
                                    resolve(result);
                                }
                            }
                        );
                
                        // 將 buffer 傳遞到上傳流
                        const bufferStream = new (require('stream').PassThrough)();
                        bufferStream.end(imageBuffer);
                        bufferStream.pipe(uploadStream);
                    });
                } catch (error) {
                    console.error(`Error during image upload for ${newName}`, error);
                    throw error;
                }
                
                // 更新 metadata
                image.name = newName;
                console.log(`Updated image metadata:`, image);
            }

        }

        await processRemainingImages(group, folderIndex, folderName);

        // 上傳更新後的 imagesOrder.json 回到 Cloudinary
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

        console.log('imagesOrder.json updated successfully on Cloudinary');
        res.json({ message: 'Image removed and renumbered successfully' });

    } catch (err) {
        console.error('Error processing remove request:', err);
        res.status(500).json({ error: 'Failed to process remove request' });
    }
}