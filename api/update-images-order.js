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
    try {
      const newImagesOrder = req.body; // 獲取前端傳送的資料
  
      // Step 1: 從 Cloudinary 讀取 imagesOrder.json
      console.log('Fetching imagesOrder.json from Cloudinary...');
      const resource = await cloudinary.api.resource('uploads/imagesOrder.json', { resource_type: 'raw' });
      const fileUrl = resource.secure_url;
      console.log('印出fileUrl', fileUrl);
  
      // Step 2: 更新 imagesOrder.json 的內容
      console.log('Updating imagesOrder.json content...');
  
      // Step 3: 上傳更新後的 imagesOrder.json 至 Cloudinary
      console.log('Uploading updated imagesOrder.json to Cloudinary...');

      
      // 上傳更新後的 imagesOrder.json
      const updatedImagesOrderContent = JSON.stringify(newImagesOrder, null, 2);
      await cloudinary.uploader.upload(
          `data:application/json;base64,${Buffer.from(updatedImagesOrderContent).toString('base64')}`,
          {
              folder: 'uploads',
              public_id: 'imagesOrder.json',
              resource_type: 'raw',
              overwrite: true,
          },
          (error, result) => {
            if (error) {
              console.error('Failed to upload imagesOrder.json to Cloudinary:', error);
              return res.status(500).json({ error: 'Failed to upload updated imagesOrder.json' });
            }
            console.log('Updated imagesOrder.json uploaded successfully:', result.secure_url);
            res.json({ message: 'Images order updated successfully', fileUrl: result.secure_url });
          }
      );
      console.log('上傳結束ok')
    } catch (error) {
      console.error('Error updating imagesOrder.json:', error);
      res.status(500).json({ error: 'Failed to update imagesOrder.json' });
    }
  }