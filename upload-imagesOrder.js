const admin = require('firebase-admin');
const fs = require('fs');

// 初始化 Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(require('./firebase-key.json')), // 替換為你的 Firebase 密鑰檔案路徑
        databaseURL: 'https://merged-harmony-default-rtdb.asia-southeast1.firebasedatabase.app' // 替換為你的 Firebase Realtime Database URL
    });
}

const db = admin.database();

// 讀取本地 imagesOrder.json 文件
const imagesOrder = JSON.parse(fs.readFileSync('./imagesOrder.json', 'utf-8'));

// 上傳至 Firebase
async function uploadToFirebase() {
    try {
        const ref = db.ref('imagesOrder'); // 定義 Firebase 中的資料路徑
        await ref.set(imagesOrder); // 將 JSON 數據寫入 Firebase
        console.log('imagesOrder.json 已成功上傳至 Firebase!');
    } catch (error) {
        console.error('上傳失敗:', error);
    }
}

uploadToFirebase();
