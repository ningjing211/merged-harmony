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

  app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});


// 提供 JSON 檔案資料的 API
app.get('/api/images', (req, res) => {
    const jsonFilePath = path.join(__dirname, 'imagesOrder.json');
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading JSON file:', err);
            res.status(500).send('Error reading data');
        } else {
          res.json(JSON.parse(data));
        }
    });
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

app.post('/api/upload-cover/:folderName', coverUpload.single('coverImage'), async (req, res) => {
    const folderName = req.params.folderName;
    const localUploadPath = path.join(__dirname, 'uploads', folderName);

    try {
        // 確認是否有文件
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // 如果資料夾不存在，則創建
        if (!fs.existsSync(localUploadPath)) {
            fs.mkdirSync(localUploadPath, { recursive: true });
        }

        // 保存文件到本地
        const localFilePath = path.join(localUploadPath, `${folderName}.jpg`);
        await fs.promises.writeFile(localFilePath, req.file.buffer);

        console.log(`Local file saved at: ${localFilePath}`);

        // 將文件上傳到 Cloudinary
        const streamifier = require('streamifier');
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `uploads/${folderName}`,
                public_id: `${folderName}.jpg`,
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
                group.path = titleImage.secure_url;
            }

            // 11-27-2024 這裡因為舊的程式碼的關係，配合多寫一個hack，讓前端loadGallery.js可以順利運作，真正被取用的url在這裡
            group.files = group.files || [];
            // 在陣列的最前面新增一個 { isTitle: true }
            group.files.unshift({ name: folderName, path:titleImage.secure_url, isTitle: true });
            console.log('有沒有group', group);

            // 更新 additionalImages 的 path
            for (const image of group.additionalImages) {
                console.log("Original image.path:", image.path);
                console.log('image.name', image.name);
                const imageNameWithoutExtension = image.name.replace('.jpg', ''); // 移除 .jpg
                console.log('imageNameWithoutExtension', imageNameWithoutExtension);
                const matchingFile = files.find(file => file.public_id === `${folderPath}/${imageNameWithoutExtension}`);
                if (matchingFile) {
                    console.log("Found matching file:", matchingFile.secure_url);
                    image.path = matchingFile.secure_url;
                } else {
                    console.warn(`No matching file for image ${image.name} in folder ${folderName}`);
                }
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
  
      // Step 2: 更新 imagesOrder.json 的內容
      console.log('Updating imagesOrder.json content...');
      const updatedImagesOrder = JSON.stringify(newImagesOrder, null, 2);
  
      // Step 3: 上傳更新後的 imagesOrder.json 至 Cloudinary
      console.log('Uploading updated imagesOrder.json to Cloudinary...');
      const uploadResponse = await cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: 'uploads/imagesOrder',
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
  
      // 寫入資料到 Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(uploadResponse);
      uploadStream.end(Buffer.from(updatedImagesOrder, 'utf-8'));
    } catch (error) {
      console.error('Error updating imagesOrder.json:', error);
      res.status(500).json({ error: 'Failed to update imagesOrder.json' });
    }
  });

app.post('/api/upload-image/:folderName/:index', upload.single('image'), async (req, res) => {
    const folderName = req.params.folderName;
    console.log('先印出foldername1', folderName);
    const index = Number(req.params.index);
    console.log('print index', index);
    const imageDescription = req.params.imageDescription;
    console.log('imageDescription', imageDescription);
    const filePath = path.join(__dirname, 'imagesOrder.json');
    console.log(filePath);
    try {
        // 讀取 imagesOrder.json
        const data = await fs.promises.readFile(filePath, 'utf8');
        let imagesOrder = JSON.parse(data);
        console.log('先印出foldername2', folderName);
        const group = imagesOrder.find(g => g.folderName === folderName);
        console.log(group);
        if (!group) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        if (!group.additionalImages) {
            group.additionalImages = [];
        }

        // 設定檔案名稱和路徑
        const fileName = index + 1;
        console.log(fileName);
        const imageFileName = `${fileName}.jpg`;
        const imagePath = path.join(__dirname, 'uploads', folderName, imageFileName);
        console.log('imagePath:', imagePath);
        // 移動上傳的檔案到目標位置
        console.log(req);
        console.log('breakkkkkkkkkkkkkkkkkkery');
        console.log(req.file);
        console.log(req.file.path);
        await fs.promises.rename(req.file.path, imagePath);

        // 更新 imagesOrder.json 中的路徑
        const image = group.additionalImages.find(file => file.index === index);
        if (image) {
            image.path = `/uploads/${folderName}/${imageFileName}`;
            image.name = imageFileName;
            console.log('xxx', image.path)
        } else {
            group.additionalImages.push({ name: imageFileName, path: `/uploads/${folderName}/${imageFileName}`, imageDescription: imageDescription});
        }

        // 寫回更新後的 imagesOrder.json
        await fs.promises.writeFile(filePath, JSON.stringify(imagesOrder, null, 2), 'utf8');
        console.log(`Image uploaded successfully for ${folderName}, index ${index}: ${imagePath}`);
        res.json({ path: `/uploads/${folderName}/${imageFileName}`, message: 'Image uploaded successfully' });
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
    console.log(req.body);
    console.log('Received remove request:', { folderName, imageName, imageIndex }); // Debug log

    const imagesOrderPath = path.join(__dirname, 'imagesOrder.json');
    // console.log('imagesOrderPath', imagesOrderPath);

    try {
        // 讀取並解析 imagesOrder.json
        const data = await fs.promises.readFile(imagesOrderPath, 'utf8');
        let imagesOrder = JSON.parse(data);
        // console.log('imagesOrder', imagesOrder);
        console.log('imageIndex', imageIndex, 'imageIndex');
        console.log('imageName', imageName);
        console.log('folderName', folderName);

        // 找到對應的 group
        const group = imagesOrder.find(g => g.folderName === folderName);
        console.log('group Before:', group);
        console.log('----分隔線----');
        console.log(group.additionalImages[imageIndex]);
        console.log(group.additionalImages[imageIndex].name);
        console.log(imageName);

        if (group && group.additionalImages[imageIndex] && group.additionalImages[imageIndex].name === imageName) {
            // 刪除指定索引的圖片
            console.log('有進來嗎?')
            
            let hasNotDeleted = true;
            // 刪除伺服器上的圖片檔案
            const imagePath = path.join(__dirname, 'uploads', folderName, imageName);
            console.log('有imagePath嗎?', imagePath)
            const originalLength = group.additionalImages.length;
            

            // 遞補剩餘圖片的 index 和 name，並重新命名伺服器中的實際檔案
            for (const [index, image] of group.additionalImages.entries()) {
                console.log('在一開頭印出index', index);
                console.log('在一開頭印出group.additionalImages.length', group.additionalImages.length);
                console.log('index:', index, 'imageIndex:', imageIndex);
                console.log('abc - image.name', image.name);
                console.log('abc - imageName', imageName);
                console.log('確定是不是最後一個:', imageIndex == originalLength - 1);
                console.log('group.additionalImages.length - 1', originalLength - 1);
                // Check if file exists before unlinking
                try {
                    if (image.name !== "no image yet" && image.name == imageName && hasNotDeleted) {

                        console.log('在刪除陣列前印出index, image', index, image);
                        console.log('...', group.additionalImages[index]);
                        group.additionalImages.splice(imageIndex, 1); //刪除陣列裡面的 8.jpg, index: 7

                        console.log('長度:', originalLength)
                        console.log(index != originalLength - 1)
                        if(index != originalLength - 1) {
                            console.log('在刪除陣列後印出index, image', index, image);
                            console.log('動作前...', group.additionalImages[index]); //這個才是真實的陣列
                            const theOldName = group.additionalImages[index].name;
                            console.log('theOldName', theOldName);
                            const nextUpIndex = index + 1;
                            group.additionalImages[index].name = `${nextUpIndex}.jpg`;
                            group.additionalImages[index].path = `/uploads/${folderName}/${nextUpIndex}.jpg`;
                            const theNewName = group.additionalImages[index].name;
                            console.log('theNewName', theNewName);

                            const newName = `${index + 1}.jpg`; // 新的名稱，例如 "8.jpg", index: 7
                
                            const theOldPath = path.join(__dirname, 'uploads', folderName, theOldName);
                            const theNewPath = path.join(__dirname, 'uploads', folderName, theNewName);

                            group.additionalImages[index].index = index;
                            console.log('動作後...', group.additionalImages[index]); //這個才是真實的陣列
                            await fs.promises.stat(imagePath);
                            console.log('執的行imagePath?', imagePath);
                            console.log('有執行到這裡嗎?');
                            await fs.promises.unlink(imagePath); //刪除實體檔案的 8.jpg, index: 7
                            await fs.promises.rename(theOldPath, theNewPath); //把原本的9.jpg變成8.jpg[路徑]
                            console.log('在刪除檔案後印出index, image', index, image);
                            console.log('...', group.additionalImages[index]); //這個才是真實的陣列
                            console.log('漢堡1')
                            hasNotDeleted = !hasNotDeleted;
                            console.log('漢堡2')
                            console.log(`Image ${imageName} removed successfully from ${folderName}`);
                        } else {
                            await fs.promises.unlink(imagePath); //刪除實體檔案的 8.jpg, index: 7
                        }
                    } 
                } catch (unlinkErr) {
                    if (unlinkErr.code === 'ENOENT') {
                        console.log(`File ${imageName} does not exist, skipping unlink.`);
                    } else {
                        console.error('Failed to delete image file:', unlinkErr);
                        return res.status(500).json({ error: 'Failed to delete image file' });
                    }
                }
                

                // 更新 image: 代表迴圈裡面的每一個物件{} 另外一個空間, 非真實的陣列
                
                image.index = index; //7
                console.log('外面------image', image); // { name: '8.jpg', path: '/uploads/image-1/8.jpg', index: 7 }
                console.log('外面------index', index); // 7
                console.log('image.name', image.name); //8.jpg
                const oldName = image.name; //8.jpg

                // 確認 oldName 不是 "no image yet" 才執行重新命名
                if (image.name !== "no image yet" && index != originalLength - 1) {
                    
                    const newName = `${index + 1}.jpg`; // 新的名稱，例如 "8.jpg", index: 7
                    image.name = newName; // 8.jpg 。 這時old與new一樣
                    console.log('new', newName);
                    image.path = `/uploads/${folderName}/${newName}`;
                    console.log('xxxxxxxxxxxxxxxx', image.path);
                    console.log('old', oldName);
                    const oldPath = path.join(__dirname, 'uploads', folderName, oldName);
                    const newPath = path.join(__dirname, 'uploads', folderName, newName);
                    try {
                        console.log('yyyyyyyyyy有進來嗎?');
                        console.log(oldPath);
                        console.log(newPath);
                        console.log('準備跳進去');
                        console.log(oldPath != newPath) // 這時一樣
                        console.log(!hasNotDeleted)
                        if( oldPath != newPath && !hasNotDeleted) {
                            console.log('在轉換網址前印出index', index);
                            await fs.promises.rename(oldPath, newPath);
                            console.log(`Renamed ${oldPath} to ${newPath}`);
                        }
                        console.log('跳出來了');
                        // await fs.promises.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');
                        console.log('裡面index', index);
                        console.log('裡面group After:', group);
                    } catch (renameErr) {
                        if (renameErr.code !== 'ENOENT') {
                            console.error('重新命名圖片檔案失敗:', renameErr);
                            return res.status(500).json({ error: 'Failed to rename image file' });
                        }
                    }
                } else {
                    console.log(`Skipping rename for ${oldName}`);
                }
            }

            // 写入更新后的 imagesOrder.json
            try {
                await fs.promises.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');
                console.log('已更新 imagesOrder.json');
            } catch (writeErr) {
                console.error('写入 imagesOrder.json 失败:', writeErr);
                return res.status(500).json({ error: 'Failed to update image order file' });
            }

            res.json({ message: 'Image removed and renumbered successfully' });
        } else {
            console.error(`Image not found at specified imageIndex in images order file: ${folderName}`);
            res.status(404).json({ error: 'Image not found at specified imageIndex' });
        }
    } catch (err) {
        console.error('Error processing remove request:', err);
        res.status(500).json({ error: 'Failed to process remove request' });
    }
});

// 創建資料夾 API
app.post('/api/create-folder', (req, res) => {
    const { folderName } = req.body;
    const targetFolder = path.join(__dirname, 'uploads', folderName);
    
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
    }
    res.status(200).send({ message: 'Folder created or already exists' });
});

// 複製圖片 API
app.post('/api/copy-image', async (req, res) => {
    try {
        const { folderName, newFileName } = req.body; // 確認接收到 folderName 和 newFileName
        console.log('folderName:', folderName);
        console.log('newFileName:', newFileName);

        // 定義來源和目標路徑
        const sourcePath = path.join(__dirname, 'uploads', 'upload.jpg');
        const destinationPath = path.join(__dirname, folderName, `${newFileName}.jpg`);

        // 複製檔案
        await fs.promises.copyFile(sourcePath, destinationPath);
        console.log(`Successfully copied to ${destinationPath}`);

        // 回應成功訊息
        res.json({ message: `Successfully copied to ${destinationPath}` });
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
