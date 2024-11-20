const fs = require('fs');

// 設定檔案路徑
const filePath = './imagesOrder.json';
const outputFilePath = './reversed_imagesOrder.json';

// 讀取 JSON 檔案
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('無法讀取檔案:', err);
    return;
  }

  try {
    // 解析 JSON 檔案
    const jsonData = JSON.parse(data);

    // 將整個陣列順序顛倒
    const reversedData = jsonData.reverse();

    // 將結果寫入新的 JSON 檔案
    fs.writeFile(outputFilePath, JSON.stringify(reversedData, null, 4), 'utf8', writeErr => {
      if (writeErr) {
        console.error('無法寫入檔案:', writeErr);
      } else {
        console.log('處理完成，檔案已儲存為:', outputFilePath);
      }
    });
  } catch (parseErr) {
    console.error('無法解析 JSON 檔案:', parseErr);
  }
});
