import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';

export const config = {
  api: {
    bodyParser: false, // 禁用內建 bodyParser，使用 multer 處理 multipart/form-data
  },
};

// 使用 multer 來處理文件上傳
const storage = multer.diskStorage({
  destination: '/tmp', // 將文件存儲到 /tmp
  filename: (req, file, cb) => {
    cb(null, `${req.query.folderName}.jpg`);
  },
});
const upload = multer({ storage });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed, use POST' });
  }

  const folderName = req.query.folderName;
  const imagesOrderPath = path.join(process.cwd(), 'public', 'imagesOrder.json');

  try {
    // 讀取 imagesOrder.json 文件
    const data = await fs.readFile(imagesOrderPath, 'utf8');
    const imagesOrder = JSON.parse(data);

    const group = imagesOrder.find(g => g.folderName === folderName);
    if (!group) {
      return res.status(404).json({ error: `Folder not found: ${folderName}` });
    }

    // 使用 multer 處理上傳文件
    upload.single('coverImage')(req, {}, async (err) => {
      if (err) {
        console.error('File upload failed:', err);
        return res.status(500).json({ error: 'File upload failed' });
      }

      const tempFilePath = path.join('/tmp', `${folderName}.jpg`);
      const finalCoverPath = path.join(process.cwd(), 'public', 'uploads', folderName, `${folderName}.jpg`);

      try {
        // 移動文件到目標目錄
        await fs.mkdir(path.dirname(finalCoverPath), { recursive: true });
        await fs.rename(tempFilePath, finalCoverPath);

        console.log(`Cover image uploaded for ${folderName}: ${finalCoverPath}`);
        res.json({ message: 'Cover image uploaded successfully' });
      } catch (fileError) {
        console.error('Failed to set cover image:', fileError);
        res.status(500).json({ error: 'Failed to set cover image' });
      }
    });
  } catch (readError) {
    console.error('Failed to read imagesOrder.json:', readError);
    res.status(500).json({ error: 'Failed to read imagesOrder.json' });
  }
}
