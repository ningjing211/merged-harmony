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
        // 獲取 imagesOrder.json 的 Cloudinary URL
        const resource = await cloudinary.api.resource('uploads/imagesOrder.json', { resource_type: 'raw' });
        const fileUrl = resource.secure_url;

        // 下載並解析 imagesOrder.json
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to fetch imagesOrder.json from Cloudinary');
        const imagesOrder = await response.json();

        // 遍歷每個 group
        for (const group of imagesOrder) {
            const folderName = group.folderName;
            const groupFolder = `Group - ${group.index}`; // 對應新的 Group 資料夾名稱
            const folderPath = `uploads/${groupFolder}`; // 新的資料夾路徑
            console.log('folderPath', folderPath);
            // 查詢該資料夾的所有圖片
            const folderResources = await cloudinary.search
                .expression(`folder:"uploads/Group - ${group.index}" AND resource_type:image`)
                .sort_by('public_id', 'asc')
                .max_results(500)
                .execute();
            const files = folderResources.resources;

            console.log(`Files in folder ${folderName}:`, files);

            console.log('`${folderPath}/cover-image`');
            console.log(`${folderPath}/cover-image`);
            
            // 更新封面圖片 path
            let titleImage = null; // 預設為 null
            for (const file of files) {
                console.log('Checking file public_id:', file.public_id); // 印出每個 public_id
                if (file.public_id === `${folderPath}/cover-image`) {
                    titleImage = file; // 找到匹配的檔案
                    break; // 結束迴圈
                }
            }
            
            console.log('titleImage', titleImage);
            
            if (titleImage) {
                console.log('titleImage.secure_url', titleImage.secure_url);
                group.path = titleImage.secure_url;
            }

            // 11-27-2024 這裡因為舊的程式碼的關係，配合多寫一個hack，讓前端loadGallery.js可以順利運作，真正被取用的url在這裡
            group.files = group.files || [];
            // 在陣列的最前面新增一個 { isTitle: true }
            group.files.unshift({ name: folderName, path:titleImage.secure_url, isTitle: true });
            console.log('有沒有group', group);

            // 更新 additionalImages 的 path
            for (const image of group.additionalImages) {
                console.log("\n--- Processing Image ---");
                console.log("Original image.path:", image.path);
                console.log("Image name (from JSON):", image.name);

                // 構造 public_id
                const imageNameWithoutExtension = image.name.replace('.jpg', ''); // 移除 .jpg
                console.log("Expected imageNameWithoutExtension:", imageNameWithoutExtension);

                // 預期的 public_id
                const expectedPublicId = `${folderPath}/${imageNameWithoutExtension}`;
                console.log("Expected public_id:", expectedPublicId);

                // 列出 files 陣列中的所有 public_id
                console.log("\n--- Available files in Cloudinary ---");
                files.forEach(file => console.log("Cloudinary file public_id:", file.public_id));

                // 找到匹配的 file
                const matchingFile = files.find(file => file.public_id === expectedPublicId);
                if (matchingFile) {
                    console.log("\n>>> Match found!");
                    console.log("Matching file secure_url:", matchingFile.secure_url);
                    // 更新 path
                    image.path = matchingFile.secure_url;
                } else {
                    console.warn("\n>>> No match found for this image.");
                    console.warn(`Could not find file with public_id: ${expectedPublicId}`);
                    console.warn("Fallback to relative path.");
                    // 如果找不到，設定一個 fallback 值（可選）
                    image.path = `/uploads/${folderName}/${image.name}`;
                }
                console.log("\n--- Updated image.path:", image.path);
            }

        }

        // 打印更新後的 imagesOrder
        console.log('1111Updated imagesOrder:', JSON.stringify(imagesOrder, null, 2));

        // 返回更新後的數據
        res.json(imagesOrder);
    } catch (error) {
        console.error('Error fetching or updating imagesOrder.json:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}