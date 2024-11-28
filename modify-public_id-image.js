const cloudinary = require('cloudinary').v2;
require('dotenv').config();
// 初始化 Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  (async () => {
    try {
      console.log('Fetching folders in "uploads"...');
  
      // 使用 Cloudinary 的 API 獲取資料夾列表
      const result = await cloudinary.api.sub_folders('uploads');
  
      console.log('Folders in "uploads":');
      result.folders.forEach(folder => {
        console.log(`- ${folder.name}`);
      });
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  })();

  async function updateFolderPublicIds(folderName, newFolderName) {
    try {
        console.log(`Fetching all files from folder: ${folderName}`);
        const resources = await cloudinary.api.resources({
            type: 'upload',
            prefix: `uploads/${folderName}/`,
        });

        const files = resources.resources;

        if (files.length === 0) {
            console.log(`No files found in folder: uploads/${folderName}`);
            return;
        }

        console.log(`Found ${files.length} files. Proceeding to update public IDs...`);

        for (const file of files) {
            const oldPublicId = file.public_id;
            const newPublicId = oldPublicId.split(`${folderName}`).join(`${newFolderName}`);

            console.log(`Renaming: ${oldPublicId} -> ${newPublicId}`);

            try {
                await cloudinary.uploader.rename(oldPublicId, newPublicId, {
                    overwrite: true,
                });
                console.log(`Successfully renamed: ${oldPublicId} -> ${newPublicId}`);
            } catch (renameError) {
                console.error(`Error renaming file: ${oldPublicId}`, renameError);
            }
        }

        console.log(`Successfully updated public IDs for all files in folder: uploads/${folderName}`);
    } catch (error) {
        console.error('Error updating folder public IDs:', error);
    }
}

// 使用範例
updateFolderPublicIds('Dance', 'Nature Loves You Back');