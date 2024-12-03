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
    const { oldFolderName, newFolderName } = req.body;

    try {
        // Step 1: Fetch imagesOrder.json from Cloudinary
        const imagesOrderResource = await cloudinary.api.resource('uploads/imagesOrder.json', {
            resource_type: 'raw',
        });
        const response = await fetch(imagesOrderResource.secure_url);
        if (!response.ok) throw new Error('Failed to fetch imagesOrder.json from Cloudinary');
        const imagesOrder = await response.json();

        // Step 2: Find and update the group
        const group = imagesOrder.find((g) => g.folderName === oldFolderName);
        if (!group) return res.status(404).json({ error: 'Folder not found in imagesOrder.json' });

        const isNameUsed = imagesOrder.some((g) => g.folderName === newFolderName);
        if (isNameUsed) return res.status(400).json({ error: '此名稱已被使用，請使用別的。' });

        group.folderName = newFolderName;
        console.log('group.folderName', group.folderName, 'newFolderName', newFolderName);
        group.title = newFolderName;
        group.path = group.path.replace(oldFolderName, newFolderName);
        group.path = group.path.split(`${oldFolderName}`).join(`${newFolderName}`);
        console.log('group.path', group.path);
        group.additionalImages.forEach((image) => {
            image.path = image.path.replace(`/uploads/${oldFolderName}/`, `/uploads/${newFolderName}/`);
        });


        // Step 6: Upload updated imagesOrder.json to Cloudinary
        const updatedImagesOrderContent = JSON.stringify(imagesOrder, null, 2);
        console.log('---', JSON.stringify(imagesOrder, null, 2), '---');
        await cloudinary.uploader.upload(
            `data:application/json;base64,${Buffer.from(updatedImagesOrderContent).toString('base64')}`,
            {
                public_id: 'uploads/imagesOrder.json',
                resource_type: 'raw',
                overwrite: true,
            }
        );

        res.json({ message: 'Group name updated successfully.' });
    } catch (error) {
        console.error('Error updating group name:', error);
        res.status(500).json({ error: 'Failed to update group name' });
    }
}