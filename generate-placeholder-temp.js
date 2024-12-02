function generatePlaceholders(count, group, startIndex) {
    const $imageContainer = $(`.group:contains("${group.folderName}") .imageContainer`);
    
    // 偵測當前已有的 .imageItem 數量
    let existingItemsCount = $imageContainer.find('.imageItem').length;
    
    // 檢查是否達到上限
    if (existingItemsCount >= 20) {
        alert("最多只能上傳20張圖片");
        return; // 結束函數，不再新增
    }

    // 計算可新增的 placeholder 數量（避免超過 20）
    const placeholdersToAdd = Math.min(count, 20 - existingItemsCount);
    
    for (let i = 0; i < placeholdersToAdd; i++) {
        const placeholderIndex = existingItemsCount + i; // 計算新的 placeholder 索引
        
        // 定義上傳目標資料夾
        const targetFolder = `/uploads/${group.folderName}`;
        console.log('要上傳的資料夾為:', targetFolder);
        console.log('folderName', group.folderName);
        console.log('index,', group.index);
        // 檢查 targetFolder 是否存在，若不存在則創建（在前端執行會受到限制，實際應該在伺服器端執行）
        // $.ajax({
        //     url: `/api/create-folder`,
        //     method: 'POST',
        //     contentType: 'application/json',
        //     data: JSON.stringify({ folderName: group.folderName }),
        //     success: function () {
        //         console.log('資料夾檢查/創建成功');
        //     },
        //     error: function (err) {
        //         console.error('資料夾檢查/創建失敗', err);
        //     }
        // });
        let imageURL = '';
        // 請求複製 upload.jpg 到目標資料夾
        $.ajax({
            url: `/api/copy-image`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                folderName: `${group.folderName}`,
                newFileName: `${placeholderIndex + 1}`,
                folderIndex: group.index
            }),
            success: function (data) {
                // 從後端回傳的資料中取得圖片 URL
                console.log('成功傳回來了', data.imageUrl);
                imageUrl = data.imageUrl; // 確認後端回傳的 key 是 `imageUrl`
                console.log('Successfully uploaded: (placeHolder URL)', imageUrl);
            },
            error: function (err) {
                console.error(`複製 upload.jpg 到 ${targetFolder}/${placeholderIndex + 1}.jpg 失敗`, err);
            }
        });

        const $imgDiv = $('<div>').addClass('imageItem');
        
        const $img = $('<img>').attr({
            src: imageUrl,
            alt: `${placeholderIndex + 1}.jpg`
        }).css({ width: '300px', margin: '10px 0', opacity: 1 });

        const $caption = $('<p>').addClass('caption').html(`${group.index}.${placeholderIndex + 1} <br> ${placeholderIndex + 1}.jpg`);
        
        // 可編輯 Group 名稱的區域
        const $descriptionInput = $('<input>')
        .attr('type', 'text')
        .addClass('description-input')
        .val("")
        .css({ display: 'none' }); // 初始隱藏

        const $descriptionText = $(`<div class="image-description" data-index="${placeholderIndex}"></div>`);


        const $editButtonDes = $('<button>').text('編輯文字').on('click', function () {
            $descriptionText.hide();
            $descriptionInput.show().focus();
        });

        const $saveButtonDes = $('<button>').text('保存更新').on('click', function () {
            const newDescription = $descriptionInput.val();
            console.log('see group:', group)
            console.log('111-file.name', `${placeholderIndex + 1}.jpg`);
            updateImageDescription(group.folderName, `${placeholderIndex + 1}.jpg`, newDescription);
            $descriptionText.text(newDescription).show();
            $descriptionInput.hide();
        });

         // Upload button
         const $uploadButton = $('<button>').text('上傳圖片').attr('data-index', placeholderIndex).on('click', function () {
            const $fileInput = $('<input>').attr({
                type: 'file',
                accept: '.jpg'
            }).css({ display: 'none' });

            $fileInput.on('change', async function () {
                console.log('ooo-',this.files[0]);
                const file = this.files[0];
                if (file && file.type === 'image/jpeg') {
                    try {
              
                        const clickedIndex = $uploadButton.data('index');
                        console.log("1111", group.folderName, clickedIndex, file);

                        const imageItems = $imageContainer.find('.imageItem').toArray();
                        
                        const hasImage = imageItems.filter(item => {
                            const altText = $(item).find('img').attr('alt');
                            return altText !== 'no image yet';
                        });

                        console.log("目前有的格子數:", imageItems);
                        console.log("所有的位置的長度:", imageItems.length);
                        console.log("有照片的格子:", hasImage);
                        console.log("有照片的格子長度:", hasImage.length);

                        // 使用 await 等待上傳完成
                        await uploadImage(group.folderName, clickedIndex, file, $img, group.index);
                    } catch (error) {
                        console.error('Error during image upload:', error);
                        alert('Failed to upload image');
                    }
                } else {
                    alert('Please upload a .jpg file');
                }
            });

            $fileInput.click(); // Trigger file selection dialog
        });
        
        // Remove button with server sync
        const $removeButton = $('<button>').text('移除圖片').attr('data-index', placeholderIndex).on('click', function () {
            const folderName = group.folderName;
            const imageName = $(this).siblings('img').attr('alt');
            
            const imageIndex = $(this).parent().index() - 1; // 獲取圖片在 additionalImages 中的索引
            
            console.log('Removing image:', { folderName, imageName, imageIndex }); // Debug log

            // Send delete request to the server
            $.ajax({
                url: '/api/remove-image',
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ folderName, imageName, imageIndex }), // 確保這裡包含 imageIndex
                success: function () {
                    alert('Image removed successfully, placeholder');
                    $imgDiv.remove(); // 成功刪除後才移除 DOM 元素
                    loadGallery(); // Reload the gallery to reflect changes
                },
                error: function (error) {
                    console.error('Failed to remove image:', error);
                    alert('Failed to remove image, placeholder');
                }
            });
        });
        
        $imgDiv.append($img, $caption, $uploadButton, $removeButton, $descriptionText, $descriptionInput, $editButtonDes, $saveButtonDes);

        $imageContainer.append($imgDiv);
    }
}
