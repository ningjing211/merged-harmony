const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
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
};