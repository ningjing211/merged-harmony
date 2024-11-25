const admin = require('firebase-admin');
const serviceAccount = require('./firebase-key.json'); // 你的密鑰文件路徑

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://merged-harmony-default-rtdb.asia-southeast1.firebasedatabase.app',
});

const db = admin.database();

module.exports = db;


const imagesOrder = {
    images: [
        { id: 1, description: 'Image 1' },
        { id: 2, description: 'Image 2' },
    ],
};

const ref = db.ref('imagesOrder'); // 定義數據庫的路徑

ref.set(imagesOrder, (error) => {
    if (error) {
        console.error('數據更新失敗:', error);
    } else {
        console.log('數據更新成功');
    }
});

ref.remove((error) => {
    if (error) {
        console.error('數據刪除失敗:', error);
    } else {
        console.log('數據刪除成功');
    }
});
