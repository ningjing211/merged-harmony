const admin = require('firebase-admin');

// 初始化 Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(require('./firebase-key.json')), // 替換為你的 Firebase 密鑰檔案路徑
        databaseURL: 'https://merged-harmony-default-rtdb.asia-southeast1.firebasedatabase.app' // 替換為你的 Firebase Realtime Database URL
    });
}

const db = admin.database();

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed, use POST' });
    }

    const { folderName, fileName, newDescription } = req.body;

    if (!folderName || !fileName || typeof newDescription !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid parameters' });
    }

    try {
        // 取得現有的 imagesOrder 資料
        const ref = db.ref('imagesOrder');
        const snapshot = await ref.once('value');
        const imagesOrder = snapshot.val();

        if (!imagesOrder) {
            return res.status(404).json({ error: 'imagesOrder not found' });
        }

        // 找到指定的資料夾
        const group = imagesOrder.find(group => group.folderName === folderName);
        if (!group) {
            return res.status(404).json({ error: 'Folder not found in imagesOrder' });
        }

        // 找到指定的圖片
        const image = group.additionalImages.find(img => img.name === fileName);
        if (!image) {
            return res.status(404).json({ error: 'Image not found in the specified folder' });
        }

        // 更新圖片描述
        image.imageDescription = newDescription;

        // 將更新後的資料寫回 Firebase
        await ref.set(imagesOrder);

        res.json({ message: 'Image description updated successfully', updatedContent: imagesOrder });
    } catch (err) {
        console.error('Error updating image description:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
