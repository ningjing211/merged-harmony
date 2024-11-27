app.post('/api/update-group-name', async (req, res) => {
  const { oldFolderName, newFolderName } = req.body;

  const imagesOrderPath = path.join(__dirname, 'imagesOrder.json');
  const oldFolderPath = path.join(__dirname, 'uploads', oldFolderName);
  const newFolderPath = path.join(__dirname, 'uploads', newFolderName);

  try {
      // 1. 更新 imagesOrder.json
      console.log('Step 1: Updating imagesOrder.json');
      const data = await fs.promises.readFile(imagesOrderPath, 'utf8');
      const imagesOrder = JSON.parse(data);

      const group = imagesOrder.find(g => g.folderName === oldFolderName);
      if (!group) {
          return res.status(404).json({ error: 'Folder not found in imagesOrder.json' });
      }

      // 檢查新名稱是否已被使用
      const isNameUsed = imagesOrder.some(group => group.folderName === newFolderName);
      if (isNameUsed) {
          return res.status(400).json({ error: '此名稱已被使用，請使用別的。' });
      }

      group.folderName = newFolderName;
      group.title = newFolderName;
      group.path = group.path.replace(`/uploads/${oldFolderName}/${oldFolderName}.jpg`, `/uploads/${newFolderName}/${newFolderName}.jpg`); // 更新 group.path

      
      group.additionalImages.forEach(image => {
          image.name = image.name.replace(oldFolderName, newFolderName);
          image.path = image.path.replace(`/uploads/${oldFolderName}/`, `/uploads/${newFolderName}/`);
      });

      await fs.promises.writeFile(imagesOrderPath, JSON.stringify(imagesOrder, null, 2), 'utf8');
      console.log('imagesOrder.json updated successfully.');

      // 2. 更改封面圖片名稱
      console.log('Step 2: Renaming cover image');
      const oldCoverPath = path.join(oldFolderPath, `${oldFolderName}.jpg`);
      const newCoverPath = path.join(oldFolderPath, `${newFolderName}.jpg`);
      if (fs.existsSync(oldCoverPath)) {
          await fs.promises.rename(oldCoverPath, newCoverPath);
          console.log('Cover image renamed successfully.');
      } else {
          console.log('No cover image found to rename.');
      }

      // 3. 更改資料夾名稱
      console.log('Step 3: Renaming folder');
      if (fs.existsSync(oldFolderPath)) {
          await fs.promises.rename(oldFolderPath, newFolderPath);
          console.log('Folder renamed successfully.');
      } else {
          return res.status(404).json({ error: 'Folder not found in file system' });
      }

      res.json({ message: 'Group name updated successfully.' });
  } catch (error) {
      console.error('Error updating group name:', error);
      res.status(500).json({ error: 'Failed to update group name' });
  }
});