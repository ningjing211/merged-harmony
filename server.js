const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

const iconv = require('iconv-lite');
const chokidar = require('chokidar');

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

// 定義來源和目標資料夾路徑
const sourceDir = path.join(__dirname, 'uploads');
const targetDir = path.join(__dirname, 'public', 'uploads');
const imagesOrderFile = path.join(__dirname, 'imagesOrder.json');
const imagesOrderTarget = path.join(__dirname, 'public', 'imagesOrder.json');

// // 資料夾同步函式
// function copyFolderSync(src, dest) {
//     if (!fs.existsSync(dest)) {
//         fs.mkdirSync(dest, { recursive: true });
//     }

//     const entries = fs.readdirSync(src, { withFileTypes: true });

//     entries.forEach(entry => {
//         const srcPath = path.join(src, entry.name);
//         const destPath = path.join(dest, entry.name);

//         if (entry.isDirectory()) {
//             copyFolderSync(srcPath, destPath); // 遞迴處理子資料夾
//         } else {
//             fs.copyFileSync(srcPath, destPath); // 複製檔案
//         }
//     });
// }

// // 清空目標資料夾
// function clearFolder(dest) {
//     if (fs.existsSync(dest)) {
//         fs.readdirSync(dest).forEach(file => {
//             const currentPath = path.join(dest, file);
//             if (fs.lstatSync(currentPath).isDirectory()) {
//                 clearFolder(currentPath); // 遞迴刪除子資料夾
//             } else {
//                 fs.unlinkSync(currentPath); // 刪除檔案
//             }
//         });
//         fs.rmdirSync(dest); // 刪除目標資料夾
//     }
// }

// // 同步單一檔案
// function syncFile(src, dest) {
//     if (fs.existsSync(src)) {
//         fs.copyFileSync(src, dest);
//         console.log(`檔案同步成功: ${src} -> ${dest}`);
//     }
// }

// // 初始化監視器（監視資料夾變動）
// const folderWatcher = chokidar.watch(sourceDir, {
//     persistent: true,
//     ignoreInitial: false,
// });

// folderWatcher.on('all', (event, filePath) => {
//     console.log(`[${event}] ${filePath}`);
//     clearFolder(targetDir);
//     copyFolderSync(sourceDir, targetDir);
//     console.log(`資料夾同步完成: ${sourceDir} -> ${targetDir}`);
// });

// // 初始化監視器（監視 imagesOrder.json）
// const fileWatcher = chokidar.watch(imagesOrderFile, {
//     persistent: true,
//     ignoreInitial: false,
// });

// fileWatcher.on('change', (filePath) => {
//     console.log(`檔案變動: ${filePath}`);
//     syncFile(imagesOrderFile, imagesOrderTarget);
// });

// // 初次執行時同步 imagesOrder.json
// syncFile(imagesOrderFile, imagesOrderTarget);

// console.log('監視器啟動中...');

// 設定靜態資源
app.use(express.static(path.join(__dirname)));
app.use(express.static(path.join(__dirname, 'dist')));


app.use('/public', express.static(path.join(__dirname, 'public')));
// app.use('/src', express.static(path.join(__dirname, 'src')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/index.html'));
  });


app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
  
app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});


// 提供 JSON 檔案資料的 API
// 這可能是給別的地方用的 先一起改一改 11-28-2024
app.get('/api/images', async (req, res) => {
    try {
        // 從 Cloudinary 獲取 imagesOrder.json 的 URL
        const resource = await cloudinary.api.resource('uploads/imagesOrder.json', { resource_type: 'raw' });
        const fileUrl = resource.secure_url;

        // 使用 fetch 下載 JSON 資料
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to fetch imagesOrder.json from Cloudinary');

        // 將資料轉換為 JSON 格式
        const data = await response.json();

        // 回傳 JSON 給前端
        res.json(data);
    } catch (error) {
        console.error('Error fetching JSON file from Cloudinary:', error);
        res.status(500).send('Error reading data from Cloudinary');
    }
});

// 動態設置上傳目標資料夾
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const folderName = req.params.folderName; // 獲取資料夾名稱
//         const uploadPath = path.join(__dirname, 'uploads', folderName);

//         // 如果資料夾不存在，則創建
//         if (!fs.existsSync(uploadPath)) {
//             fs.mkdirSync(uploadPath, { recursive: true });
//         }

//         cb(null, uploadPath);
//     },
//     filename: (req, file, cb) => {
//         const folderName = req.params.folderName;
//         const uploadPath = path.join(__dirname, 'uploads', folderName);
//         const newFileIndex = Number(req.params.index) + 1; // index + 1 才會變成file name
//         // 讀取現有的文件並確定下一個文件的序號
//         const existingFiles = fs.readdirSync(uploadPath).filter(f => f.endsWith('.jpg'));
//         console.log('sssssssss-existingFiles', newFileIndex);
//         const newFileName = `${newFileIndex}.jpg`; // 使用新文件序號作為文件名
//         cb(null, newFileName);
//     }
// });

//11-26-2024 使用內存存儲代替本地存儲

const storage = multer.memoryStorage(); // 文件存儲到內存



const upload = multer({ storage: storage });

// 新增一個函數，用於更新 imagesOrder.json

app.use(express.json()); // This line is critical for parsing JSON in requests

// Set up storage for multer for cover image uploads
// const coverStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const folderName = req.params.folderName;
//         const uploadPath = path.join(__dirname, 'uploads', folderName);

//         if (!fs.existsSync(uploadPath)) {
//             fs.mkdirSync(uploadPath, { recursive: true });
//         }

//         cb(null, uploadPath);
//     },
//     filename: (req, file, cb) => {
//         const folderName = req.params.folderName;
//         cb(null, `${folderName}.jpg`); // Save cover image with a fixed name
//     }
// });

// const coverUpload = multer({ storage: coverStorage });

// 使用 Multer 的記憶體存儲
const coverStorage = multer.memoryStorage();
const coverUpload = multer({ storage: coverStorage });

app.post('/api/upload-cover/:folderIndex', coverUpload.single('coverImage'), async (req, res) => {
    const folderIndex = req.params.folderIndex;
    console.log('folderIndex1234', folderIndex);

    try {
        // 確認是否有文件
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // 使用 Stream 上傳到 Cloudinary
        const streamifier = require('streamifier');
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `uploads/Group - ${folderIndex}`, // 根據 Group - ${folderIndex} 命名資料夾
                public_id: 'cover-image', // 固定使用 `cover-image` 作為 public_id
                overwrite: true,
            },
            (error, result) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return res.status(500).json({ error: 'Failed to upload to Cloudinary' });
                }

                console.log('Cloudinary upload success:', result.secure_url);
                res.json({
                    message: 'Cover image uploaded successfully',
                    coverUrl: result.secure_url,
                });
            }
        );

        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

    } catch (error) {
        console.error('Upload cover error:', error);
        res.status(500).json({ error: 'Failed to upload cover image' });
    }
});


// API 路由：讀取 imagesOrder.json 並提供給前端
// server.js
app.get('/api/images-order', async (req, res) => {
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
});

  



// 更新影片連結的 API
app.post('/api/update-video-url', async (req, res) => {
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
});

app.post('/api/update-images-order', async (req, res) => {
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
  });

  app.post('/api/upload-image/:folderIndex/:index', upload.single('image'), async (req, res) => {
    const folderIndex = req.params.folderIndex;
    const index = Number(req.params.index);
    // console.log('req.body.imageDescription1', req.body.imageDescription);
    // const imageDescription = req.body.imageDescription || 'Default description';
    // console.log('imageDescription', req.body.imageDescription);

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
        const fileName = index + 1;
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
});


app.post('/reorder-images/:folderName', (req, res) => {
    const folderName = req.params.folderName;
    const uploadsDir = path.join(__dirname, 'uploads', folderName);
    const imagesOrderPath = path.join(__dirname, 'imagesOrder.json');

    // 檢查資料夾是否存在
    if (!fs.existsSync(uploadsDir)) {
        return res.status(404).json({ error: 'Folder not found' });
    }

    // 讀取並重新命名資料夾內的圖片檔案
    let imagesOrder;
    try {
        imagesOrder = JSON.parse(fs.readFileSync(imagesOrderPath, 'utf8'));
    } catch (err) {
        console.error('Failed to load image order:', err);
        return res.status(500).json({ error: 'Failed to load image order' });
    }

    const group = imagesOrder.find(g => g.folderName === folderName);
    if (!group) {
        return res.status(404).json({ error: 'Folder not found in imagesOrder.json' });
    }

    // 過濾出有效圖片並排序
    const files = fs.readdirSync(uploadsDir).filter(file => file.endsWith('.jpg') && !file.startsWith(folderName)).sort();

    // 重新命名圖片和更新 group.files
    group.files = [];
    files.forEach((file, index) => {
        const newFileName = `${index + 1}.jpg`;
        const oldPath = path.join(uploadsDir, file);
        const newPath = path.join(uploadsDir, newFileName);

        // 更新圖片名稱
        fs.renameSync(oldPath, newPath);

        // 更新 group.files 內容
        group.files.push({
            name: newFileName,
            path: `/uploads/${folderName}/${newFileName}`
        });
    });

    // 將更新後的 imagesOrder 寫回檔案
    fs.writeFileSync(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');
    console.log(`Images in ${folderName} reordered successfully`);

    res.json({ message: 'Images reordered successfully' });
});


// Serve uploads 資料夾中的圖片
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));


app.post('/api/remove-image', async (req, res) => {
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
            const renamePromises = [];

            for (let i = imageIndex; i < group.additionalImages.length; i++) {
                const image = group.additionalImages[i];
                const oldPublicId = `uploads/Group - ${folderIndex}/${image.name.replace('.jpg', '')}`;
                const newName = `${i + 1}.jpg`;
                const newPublicId = `${newName.replace('.jpg', '')}`;

                console.log(`Processing image: ${image.name}`);

                // 下載圖片到記憶體
                const imageUrl = cloudinary.url(oldPublicId, { resource_type: 'image' });
                const response = await fetch(imageUrl);
                const imageBuffer = await response.buffer();

                // 刪除 Cloudinary 中舊的圖片
                await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'image' });
                console.log(`Deleted ${oldPublicId} from Cloudinary`);

                // 上傳圖片到 Cloudinary，並更新名稱
                const uploadPromise = cloudinary.uploader.upload_stream(
                    {
                        public_id: newPublicId,
                        folder: `uploads/Group - ${folderIndex}`,
                        resource_type: 'image',
                    },
                    (error, result) => {
                        if (error) {
                            console.error(`Failed to upload ${newName}:`, error);
                            throw error;
                        }
                        console.log(`Uploaded and renamed to ${newPublicId}`);
                    }
                );

                // 將 Buffer 傳遞到上傳流
                const bufferStream = new (require('stream').PassThrough)();
                bufferStream.end(imageBuffer);
                bufferStream.pipe(uploadPromise);

                // 更新 metadata 並更新檔案路徑
                image.name = newName;
                image.path = `/uploads/${folderName}/${newName}`;
            }

            await Promise.all(renamePromises);
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
});



// 創建資料夾 API
// app.post('/api/create-folder', (req, res) => {
//     const { folderName } = req.body;
//     const targetFolder = path.join(__dirname, 'uploads', folderName);
    
//     if (!fs.existsSync(targetFolder)) {
//         fs.mkdirSync(targetFolder, { recursive: true });
//     }
//     res.status(200).send({ message: 'Folder created or already exists' });
// });

// 複製圖片 API
// 複製圖片 API
app.post('/api/copy-image', async (req, res) => {
    try {
        const { folderName, newFileName, folderIndex, howManytoAdds } = req.body; // 確認接收到 folderName 和 newFileName
        console.log('folderName:', folderName);
        console.log('newFileName:', newFileName);
        console.log('folderIndex:', folderIndex);
        const index = Number(newFileName - 1);
        console.log('看一下index', index);
        console.log('要新增幾張', howManytoAdds);

        // 定義 local 的來源檔案路徑
        const localFilePath = path.join(__dirname, 'public', 'uploads', 'upload.jpg');
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
});


app.post('/api/update-group-name', async (req, res) => {
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
});




// 調用函數
// addDescriptionFieldToImagesOrder();
// 更新圖片描述的 API
// app.post('/api/update-image-description', async (req, res) => {
//     const { folderName, fileName, newDescription } = req.body;

//     // 1. 定義文件路徑
//     const imagesOrderPath = path.join(__dirname, 'imagesOrder.json');

//     try {
//         // 2. 讀取並解析 imagesOrder.json
//         const data = await fs.promises.readFile(imagesOrderPath, 'utf8');
//         const imagesOrder = JSON.parse(data);

//         // 3. 找到對應的資料夾
//         const group = imagesOrder.find(group => group.folderName === folderName);
//         if (!group) {
//             return res.status(404).json({ error: 'Folder not found in imagesOrder.json' });
//         }

//         // 4. 找到對應的圖片並更新描述
//         const image = group.additionalImages.find(img => img.name === fileName);
//         if (!image) {
//             return res.status(404).json({ error: 'Image not found in the specified folder' });
//         }

//         image.imageDescription = newDescription;

//         // 5. 寫回更新後的 imagesOrder.json
//         await fs.promises.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');
//         console.log('Image description updated successfully.');

//         res.json({ message: 'Image description updated successfully' });
//     } catch (err) {
//         console.error('Error updating image description:', err);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

app.post('/api/update-image-description', async (req, res) => {
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
});



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
