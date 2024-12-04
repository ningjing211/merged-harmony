$(document).ready(function () {
    const placeholderPath = 'https://placehold.co/600x400?text=upload'; // placeholder圖片的路徑
    const expectedImageCount = 20; // 每個資料夾預期有20張圖片

    function loadGallery() {
        $.ajax({
            url: '/api/images-order',
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                displayGallery(data);
            },
            error: function () {
                console.error('Error loading gallery:', jqXHR.responseText || jqXHR.statusText);
                alert('Error loading gallery');
            }
        });
    }

    function collectGalleryData() {
        const data = [];
    
        $('.group').each(function (index) {
            const folderName = $(this).find('h3').text().split(' - ')[1].trim(); // 提取資料夾名稱
            const coverImage = $(this).find('.coverDiv img').attr('src');
            const videoUrl = $(this).find('.videoContainer iframe').attr('src').replace("https://www.youtube.com/embed/", "https://youtu.be/");
            console.log('folderName', folderName);
            console.log('coverImage', coverImage);
            console.log('videoUrl', videoUrl);

            // 收集其他圖片
            const additionalImages = [];
            $(this).find('.imageContainer img').each(function (imgIndex) {
                console.log('imgIndex', imgIndex);
                // 找到對應的 imageDescription
                const descriptionElement = $(this).closest('.imageContainer').find(`.image-description[data-index="${imgIndex}"]`);
                const imageDescription = descriptionElement.length > 0 ? descriptionElement.text().trim() : ""; // 默認值為空
    
                // 將圖片資訊推入 additionalImages
                additionalImages.push({
                    name: $(this).attr('alt'),
                    path: $(this).attr('src'),
                    index: imgIndex, // 設置索引
                    imageDescription: imageDescription // 添加圖片描述
                });
            });
    
            data.push({
                folderName: folderName,
                title: folderName,
                path: coverImage,
                additionalImages: additionalImages,
                index: index + 1, // 設定索引，從 1 開始
                video: {
                    url: videoUrl
                }
            });
        });
    
        return data;
    }
    
    

    function updateImagesOrderOnServer() {
        const galleryData = collectGalleryData(); // 使用 collectGalleryData 函數獲取資料
    
        $.ajax({
            url: '/api/',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(galleryData),
            success: function (response) {
                alert('Images order updated successfully');
                
                function displayGallery(data) {
                    const $galleryContainer = $('#galleryContainer');
                    $galleryContainer.empty();
                
                    $.each(data, function (index, group) {
                        
                        // const $groupDiv = $('<div>').addClass('group');
                        // $groupDiv.append(`<h3 class="group-name">Group ${group.index} - ${group.folderName}</h3>`);
            
                        const $groupDiv = $('<div>').addClass('group');
            
                        // 可編輯 Group 名稱的區域
                        const $groupNameInput = $('<input>')
                            .attr('type', 'text')
                            .addClass('group-name-input')
                            .val(`${group.folderName}`)
                            .css({ display: 'none' }); // 初始隱藏
            
                        const $groupNameText = $(`<h3 class="group-name">Group ${group.index} - ${group.folderName}</h3>`);
            
                        const $editButton = $('<button>').text('編輯文字').on('click', function () {
                            $groupNameText.hide();
                            $groupNameInput.show().focus();
                        });
            
                        const $saveButton = $('<button>').text('保存更新').on('click', function () {
                            const newName = $groupNameInput.val();
                            updateGroupName(group.folderName, newName); // 更新 Group 名稱的函數
                            $groupNameText.text(newName).show();
                            $groupNameInput.hide();
                        });
                
                        const coverImage = group.files.find(file => file.isTitle);
                        if (coverImage) {
                            const $coverImageContainer = $('<div>').addClass('coverImageContainer').css({ display: 'flex', alignItems: 'baseline' });
                
                            const $titleDiv = $('<div>').addClass('imageItem').addClass('coverDiv');
                            const $titleImg = $('<img>').attr({
                                src: `${coverImage.path}?t=${new Date().getTime()}`, // 加入時間戳避免緩存
                                alt: coverImage.name
                            }).css({ width: '100%', marginRight: '20px' });
                
                            const $titleCaption = $('<p>').addClass('caption').text(`Cover Image: ${group.folderName}.jpg`);
                
                            // Cover Image Upload Input
                            const $coverInput = $('<input>').attr({
                                type: 'file',
                                accept: '.jpg'
                            }).css({ marginTop: '10px' });
                
                            // Button to Upload Cover Image
                            const $uploadButton = $('<button>').text('上傳封面圖片 ( 僅限 .jpg)').css({ marginTop: '5px' });
                            $uploadButton.on('click', function () {
                                const file = $coverInput[0].files[0];
                                if (file) {
                                    const fileExtension = file.name.split('.').pop().toLowerCase();
                                    if (fileExtension === 'jpg') {
                                        uploadCoverImage(group.folderName, file, group.index);
                                    } else {
                                        alert('請上傳.jpg檔案');
                                    }
                                } else {
                                    alert('Please select a file to upload.');
                                }
                            });
                
                            $titleDiv.append($titleImg).append($titleCaption);
                            $coverImageContainer.append($titleDiv);
                            $titleDiv.append($coverInput).append($uploadButton);
                            $groupDiv.append($coverImageContainer);
                
                            // Video Embed and Edit URL
                            const embedUrl = group.video.url.replace("https://youtu.be/", "https://www.youtube.com/embed/");
                            const $videoEmbed = $('<iframe>').attr({
                                src: embedUrl,
                                width: "840",
                                height: "473",
                                title: "YouTube video player",
                                frameborder: "0",
                                allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
                                referrerpolicy: "strict-origin-when-cross-origin",
                                allowfullscreen: true
                            });
                
                            const $videoContainer = $('<div>').addClass('videoContainer').append($videoEmbed);
                            
                            // New input and save button for editing video URL
                            const $inputContainer = $('<div>').addClass('inputContainer');
                            const $videoInput = $('<input>').attr({
                                type: 'text',
                                value: group.video.url,
                                placeholder: 'Enter new video URL'
                            }).css({ marginTop: '10px', width: '100%' });
                
                            const $saveButton = $('<button>').text('儲存更新').css({ marginTop: '5px' });
                            $saveButton.on('click', function () {
                                const newUrl = $videoInput.val();
                                updateVideoUrl(group.folderName, newUrl);
                            });
                
                            $inputContainer.append($videoInput).append($saveButton);
                            $videoContainer.append($inputContainer);
                
                            $coverImageContainer.append($videoContainer);
                            $groupDiv.append($coverImageContainer);
                        }
                
                        // 添加 "Upload More Image" 按鈕，不計入索引
                        
                        const $imageContainer = $('<div>').addClass('imageContainer');
                        const $buttonDiv = $('<div>').addClass('uploadMoreImage');
                        const $uploadMoreButton = $('<button>').text('Upload More Images');
                        const $caption = $('<p>').addClass('caption').html(`上傳更多圖片`);
                
                        $buttonDiv.append($uploadMoreButton).append($caption);
                        $imageContainer.append($buttonDiv);
                
                        // 點擊 "Upload More Images" 按鈕時彈出對話框
                        $uploadMoreButton.on('click', function () {
                            const numberOfImages = prompt('請問要上傳幾張照片？');
                            if (numberOfImages && !isNaN(numberOfImages) && numberOfImages > 0) {
                                generatePlaceholders(numberOfImages, group, 1);
                                
                                // Collect updated gallery data
                                const updatedGalleryData = collectGalleryData();
                                
                                // Send updated order to server
                                $.ajax({
                                    url: '/api/update-images-order',
                                    method: 'POST',
                                    contentType: 'application/json',
                                    data: JSON.stringify(updatedGalleryData),
                                    success: function () {
                                        alert('Images order updated successfully');
                                    },
                                    error: function (error) {
                                        console.error('Failed to update images order:', error);
                                        alert('Failed to update images order');
                                    }
                                });
                            }
                        });
                
                        // 顯示資料夾內的圖片，從索引 1 開始
                        const sortedFiles = group.additionalImages
                            .filter(file => !file.isTitle)
                            .sort((a, b) => {
                            const numA = parseInt(a.name.split('.')[0], 10);
                            const numB = parseInt(b.name.split('.')[0], 10);
                            return numA - numB;
                        });
                
                        // 顯示資料夾內的圖片，並且僅顯示一個 placeholder 在最後
                        let lastUploadedIndex = sortedFiles.length; //目前有的照片數
                        console.log('test', group.additionalImages[0].index, index, lastUploadedIndex);
                        for (let i = 1; i <= lastUploadedIndex; i++) {  // 更新此處條件
                            const file = sortedFiles[i - 1];
                            const $imgDiv = $('<div>').addClass('imageItem');
                
                            if (file) {
                                const $img = $('<img>').attr({
                                    src: file.path,
                                    alt: file.name
                                }).css({ width: '300px', margin: '10px 0' });
                                const $caption = $('<p>').addClass('caption').html(`${group.index}.${i} <br> ${file.name}`);
                
                                // 可編輯 Group 名稱的區域
                                const $descriptionInput = $('<input>')
                                .attr('type', 'text')
                                .addClass('description-input')
                                .val(`${file.imageDescription}` || "")
                                .css({ display: 'none' }); // 初始隱藏
            
                                const $descriptionText = $(`<div class="image-description" data-index="${i-1}">${file.imageDescription}</div>`);
            
                                const $editButtonDes = $('<button>').text('編輯文字').on('click', function () {
                                    $descriptionText.hide();
                                    $descriptionInput.show().focus();
                                });
            
                                const $saveButtonDes = $('<button>').text('保存更新').on('click', function () {
                                    const newDescription = $descriptionInput.val();
                                    console.log('updateServer-file-name', file.name);
                                    updateImageDescription(group.folderName, file.name, newDescription);
                                    $descriptionText.text(newDescription).show();
                                    $descriptionInput.hide();
                                });
            
                                
                                 // Upload button
                                const $uploadButton = $('<button>').text('上傳圖片').attr('data-index', i - 1).on('click', function () {
            
                                    const $fileInput = $('<input>').attr({
                                        type: 'file',
                                        accept: '.jpg'
                                    }).css({ display: 'none' });
            
                                    console.log('uploadbutton clicked:',group.folderName, i - 1);
                                    console.log(file, $img);
                                    
                                    
                                    console.log('here or not');
            
                                    $fileInput.on('change', async function () {
                                        const xFile = this.files[0];
                                        if (xFile && xFile.type === 'image/jpeg') {
                                            try {
                                                // const clickedIndex = $uploadButton.data('index');
                                                // console.log("1111", group.folderName, clickedIndex, xFile);
                                
                                                // const imageItems = $imageContainer.find('.imageItem').toArray();
                                                
                                                // const hasImage = imageItems.filter(item => {
                                                //     const altText = $(item).find('img').attr('alt');
                                                //     return altText !== 'no image yet';
                                                // });
                                
                                                // console.log("目前有的格子數:", imageItems);
                                                // console.log("所有的位置的長度:", imageItems.length);
                                                // console.log("有照片的格子:", hasImage);
                                                // console.log("有照片的格子長度:", hasImage.length);
                                
                                                // 使用 await 等待上傳完成
                                                console.log('sss', group.folderName, i - 1, xFile, $img);
                                                await uploadImage(group.folderName, i - 1, xFile, $img, group.index);
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
                
                                // Remove button
                                // Remove button with server sync
                                // Remove button with server sync
                                const $removeButton = $('<button>').text('移除圖片')
                                .attr('data-index', i - 1) // 設置唯一的 data-index
                                .on('click', function () {
                                const folderName = group.folderName;
                                const imageName = $(this).siblings('img').attr('alt');
                                const imageIndex = Number($(this).data('index'));
            
                                console.log('Removing image:', { folderName, imageName, imageIndex });
            
                                // 發送刪除請求
                                $.ajax({
                                    url: '/api/remove-image',
                                    method: 'POST',
                                    contentType: 'application/json',
                                    data: JSON.stringify({ folderName, imageName, imageIndex }),
                                    success: function () {
                                        console.log($imgDiv);
                                        alert('Image removed successfully, another');
                                        $imgDiv.remove();
                                        loadGallery(); // Reload the gallery to reflect changes
                                    },
                                    error: function (error) {
                                        console.error('Failed to remove image:', error);
                                        alert('Failed to remove image, another');
                                    }
                                });
                                });
            
                                
                                $imgDiv.append($img, $caption, $uploadButton, $removeButton, $descriptionText, $descriptionInput, $editButtonDes, $saveButtonDes);
                
                            } else {
                                const $img = $('<img>').attr({
                                    src: placeholderPath,
                                    alt: 'Placeholder'
                                }).css({ width: '300px', margin: '10px 0', opacity: 1 });
                
                                const $caption = $('<p>').addClass('caption').html(`${group.index}.${i} <br> no image yet`);
                                $imgDiv.append($img).append($caption);
                
                            }
                
                            $imageContainer.append($imgDiv);
                        }
                
                        $groupDiv.append($groupNameText, $groupNameInput, $editButton, $saveButton);
                        $groupDiv.append($imageContainer);
                        $galleryContainer.append($groupDiv);
                    });
                }
                loadGallery(); // 可選：重新加載畫廊來顯示更新
            },
            error: function (error) {
                console.error('Failed to update images order:', error);
                alert('Failed to update images order');
            }
        });
    }
    
    // 例如，在某個按鈕點擊時觸發
    $('#saveButton').on('click', updateImagesOrderOnServer);
    
    
    
    

    

    function displayGallery(data) {
        const $galleryContainer = $('#galleryContainer');
        $galleryContainer.empty();
    
        $.each(data, function (index, group) {
            
            // const $groupDiv = $('<div>').addClass('group');
            // $groupDiv.append(`<h3 class="group-name">Group ${group.index} - ${group.folderName}</h3>`);

            const $groupDiv = $('<div>').addClass('group');

            // 可編輯 Group 名稱的區域
            const $groupNameInput = $('<input>')
                .attr('type', 'text')
                .addClass('group-name-input')
                .val(`${group.folderName}`)
                .css({ display: 'none' }); // 初始隱藏

            const $groupNameText = $(`<h3 class="group-name">Group ${group.index} - ${group.folderName}</h3>`);

            const $editButton = $('<button>').text('編輯文字').on('click', function () {
                $groupNameText.hide();
                $groupNameInput.show().focus();
            });

            const $saveButton = $('<button>').text('保存更新').on('click', function () {
                const newName = $groupNameInput.val();
                updateGroupName(group.folderName, newName); // 更新 Group 名稱的函數
                $groupNameText.text(newName).show();
                $groupNameInput.hide();
            });
    
            const coverImage = group.files.find(file => file.isTitle);
            if (coverImage) {
                const $coverImageContainer = $('<div>').addClass('coverImageContainer').css({ display: 'flex', alignItems: 'center' });
    
                const $titleDiv = $('<div>').addClass('imageItem').addClass('coverDiv');
                const $titleImg = $('<img>').attr({
                    src: `${coverImage.path}?t=${new Date().getTime()}`, // 加入時間戳避免緩存
                    alt: coverImage.name
                }).css({ width: '100%', marginRight: '20px' });
    
                const $titleCaption = $('<p>').addClass('caption').text(`Cover Image: ${group.folderName}.jpg`);
    
                // Cover Image Upload Input
                const $coverInput = $('<input>').attr({
                    type: 'file',
                    accept: '.jpg'
                }).css({ marginTop: '10px' });
    
                // Button to Upload Cover Image
                const $uploadButton = $('<button>').text('上傳 / 更新 - 封面圖片 ( 僅限 .jpg)').css({ marginTop: '5px' });
                $uploadButton.on('click', function () {
                    const file = $coverInput[0].files[0];
                    if (file) {
                        const fileExtension = file.name.split('.').pop().toLowerCase();
                        if (fileExtension === 'jpg') {
                            uploadCoverImage(group.folderName, file, group.index);
                        } else {
                            alert('請上傳.jpg檔案');
                        }
                    } else {
                        alert('Please select a file to upload.');
                    }
                });
    
                $titleDiv.append($titleImg).append($titleCaption);
                $coverImageContainer.append($titleDiv);
                $titleDiv.append($coverInput).append($uploadButton);
                $groupDiv.append($coverImageContainer);
    
                // Video Embed and Edit URL
                const embedUrl = group.video.url.replace("https://youtu.be/", "https://www.youtube.com/embed/");
                const $videoEmbed = $('<iframe>').attr({
                    src: embedUrl,
                    width: "840",
                    height: "473",
                    title: "YouTube video player",
                    frameborder: "0",
                    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
                    referrerpolicy: "strict-origin-when-cross-origin",
                    allowfullscreen: true
                });
    
                const $videoContainer = $('<div>').addClass('videoContainer').append($videoEmbed);
                
                // New input and save button for editing video URL
                const $inputContainer = $('<div>').addClass('inputContainer');
                const $videoInput = $('<input>').attr({
                    type: 'text',
                    value: group.video.url,
                    placeholder: 'Enter new video URL'
                }).css({ marginTop: '10px', width: '100%' });
    
                const $saveButton = $('<button>').text('儲存更新').css({ marginTop: '5px' });
                $saveButton.on('click', function () {
                    const newUrl = $videoInput.val();
                    updateVideoUrl(group.folderName, newUrl);
                });
    
                $inputContainer.append($videoInput).append($saveButton);
                $videoContainer.append($inputContainer);
    
                $coverImageContainer.append($videoContainer);
                $groupDiv.append($coverImageContainer);
            }
    
            // 添加 "Upload More Image" 按鈕，不計入索引
            
            const $imageContainer = $('<div>').addClass('imageContainer');
            const $buttonDiv = $('<div>').addClass('uploadMoreImage');
            const $uploadMoreButton = $('<button>').text('Upload More Images');
            const $caption = $('<p>').addClass('caption').html(`上傳更多圖片`);
    
            $buttonDiv.append($uploadMoreButton).append($caption);
            $imageContainer.append($buttonDiv);
    
            // 點擊 "Upload More Images" 按鈕時彈出對話框
            $uploadMoreButton.on('click', function () {
                const numberOfImages = prompt('請問要上傳幾張照片？');
                if (numberOfImages && !isNaN(numberOfImages) && numberOfImages > 0) {
                    console.log('呼叫generatePlaceholders之前先print出group:', group);
                    generatePlaceholders(numberOfImages, group, 1);
                    
                    // Collect updated gallery data
                    const updatedGalleryData = collectGalleryData();
                    
                    // Send updated order to server
                    $.ajax({
                        url: '/api/update-images-order',
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify(updatedGalleryData),
                        success: function () {
                            alert('Images order updated successfully');
                        },
                        error: function (error) {
                            console.error('Failed to update images order:', error);
                            alert('Failed to update images order');
                        }
                    });
                }
            });
    
            // 顯示資料夾內的圖片，從索引 1 開始
            const sortedFiles = group.additionalImages
                .filter(file => !file.isTitle)
                .sort((a, b) => {
                const numA = parseInt(a.name.split('.')[0], 10);
                const numB = parseInt(b.name.split('.')[0], 10);
                return numA - numB;
            });
    
            // 顯示資料夾內的圖片，並且僅顯示一個 placeholder 在最後
            let lastUploadedIndex = sortedFiles.length; //目前有的照片數
            console.log('test', group.additionalImages[0].index, index, lastUploadedIndex);
            for (let i = 1; i <= lastUploadedIndex; i++) {  // 更新此處條件
                const file = sortedFiles[i - 1];
                const $imgDiv = $('<div>').addClass('imageItem');
    
                if (file) {
                    const $img = $('<img>').attr({
                        src: file.path,
                        alt: file.name
                    }).css({ width: '300px', margin: '10px 0' });
                    const $caption = $('<p>').addClass('caption').html(`${group.index}.${i} <br> ${file.name}`);
    
                    // 可編輯 Group 名稱的區域
                    const $descriptionInput = $('<input>')
                    .attr('type', 'text')
                    .addClass('description-input')
                    .val(`${file.imageDescription}` || "")
                    .css({ display: 'none' }); // 初始隱藏

                    const $descriptionText = $(`<div class="image-description" data-index="${i-1}">${file.imageDescription}</div>`);

                    const $editButtonDes = $('<button>').text('編輯文字').on('click', function () {
                        $descriptionText.hide();
                        $descriptionInput.show().focus();
                    });

                    const $saveButtonDes = $('<button>').text('保存更新').on('click', function () {
                        const newDescription = $descriptionInput.val();
                        console.log('displayGaleery-file.name', file.name);
                        updateImageDescription(group.folderName, file.name, newDescription);
                        $descriptionText.text(newDescription).show();
                        $descriptionInput.hide();
                    });

                    
                     // Upload button
                    const $uploadButton = $('<button>').text('上傳圖片').attr('data-index', i - 1).on('click', function () {

                        const $fileInput = $('<input>').attr({
                            type: 'file',
                            accept: '.jpg'
                        }).css({ display: 'none' });

                        console.log('uploadbutton clicked:',group.folderName, i - 1);
                        console.log(file, $img);
                        
                        
                        console.log('here or not');

                        $fileInput.on('change', async function () {
                            const xFile = this.files[0];
                            if (xFile && xFile.type === 'image/jpeg') {
                                try {
                                    // const clickedIndex = $uploadButton.data('index');
                                    // console.log("1111", group.folderName, clickedIndex, xFile);
                    
                                    // const imageItems = $imageContainer.find('.imageItem').toArray();
                                    
                                    // const hasImage = imageItems.filter(item => {
                                    //     const altText = $(item).find('img').attr('alt');
                                    //     return altText !== 'no image yet';
                                    // });
                    
                                    // console.log("目前有的格子數:", imageItems);
                                    // console.log("所有的位置的長度:", imageItems.length);
                                    // console.log("有照片的格子:", hasImage);
                                    // console.log("有照片的格子長度:", hasImage.length);
                    
                                    // 使用 await 等待上傳完成
                                    console.log('sss', group.folderName, i - 1, xFile, $img);
                                    await uploadImage(group.folderName, i - 1, xFile, $img, group.index);
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
    
                    // Remove button
                    // Remove button with server sync
                    // Remove button with server sync
                    const $removeButton = $('<button>').text('移除圖片')
                    .attr('data-index', i - 1) // 設置唯一的 data-index
                    .on('click', function () {
                    const folderName = group.folderName;
                    const imageName = $(this).siblings('img').attr('alt');
                    const imageIndex = Number($(this).data('index'));

                    console.log('Removing image:', { folderName, imageName, imageIndex });

                    // 發送刪除請求
                    $.ajax({
                        url: '/api/remove-image',
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({ folderName, imageName, imageIndex }),
                        success: function () {
                            console.log($imgDiv);
                            alert('Image removed successfully, another');
                            $imgDiv.remove();
                            loadGallery(); // Reload the gallery to reflect changes
                        },
                        error: function (error) {
                            console.error('Failed to remove image:', error);
                            alert('Failed to remove image, another');
                        }
                    });
                    });

                    
                    $imgDiv.append($img, $caption, $uploadButton, $removeButton, $descriptionText, $descriptionInput, $editButtonDes, $saveButtonDes);
    
                } else {
                    const $img = $('<img>').attr({
                        src: placeholderPath,
                        alt: 'Placeholder'
                    }).css({ width: '300px', margin: '10px 0', opacity: 1 });
    
                    const $caption = $('<p>').addClass('caption').html(`${group.index}.${i} <br> no image yet`);
                    $imgDiv.append($img).append($caption);
    
                }
    
                $imageContainer.append($imgDiv);
            }
    
            $groupDiv.append($groupNameText, $groupNameInput, $editButton, $saveButton);
            $groupDiv.append($imageContainer);
            $galleryContainer.append($groupDiv);
        });
    }

    function updateImageDescription(folderName, fileName, newDescription) {
        console.log('inside-file-name', fileName);
        console.log('更新圖片描述:', folderName, fileName, newDescription);
        $.ajax({
            url: '/api/update-image-description',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ folderName, fileName, newDescription }),
            success: function () {
                alert('圖片描述更新成功');
                // 可選：重新載入圖片畫廊，讓畫面即時更新
                loadGallery();
            },
            error: function (err) {
                console.error('更新圖片描述失敗:', err);
                alert('更新圖片描述失敗');
            }
        });
    }
    

    function updateGroupName(oldFolderName, newFolderName) {
        console.log('folderName, newName', oldFolderName, newFolderName);
        $.ajax({
            url: '/api/update-group-name',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ oldFolderName, newFolderName }),
            success: function () {
                alert('Group 名稱更新成功');
                loadGallery(); // 重新加載畫廊顯示更新
            },
            error: function (err) {
                console.error('更新 Group 名稱失敗:', err);
                alert('更新 Group 名稱失敗');
            }
        });
    }
    

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
        console.log('placehodersToAdd', placeholdersToAdd, '新增幾張');
    
        // 將 AJAX 請求包裝成 Promise
        const copyImageToServer = (folderName, newFileName, folderIndex, placeholdersToAdd) => {
            console.log('進來了 copyImageToServer');
            return new Promise((resolve, reject) => {
                $.ajax({
                    url: `/api/copy-image`,
                    method: 'POST',
                    contentType: 'application/json',
                    data: JSON.stringify({
                        folderName: folderName,
                        newFileName: newFileName,
                        folderIndex: folderIndex,
                        howManytoAdds: placeholdersToAdd
                    }),
                    success: function (data) {
                        // console.log('成功傳回來了ok', data.imageUrl); 
                        console.log('copyImageToServer從Server回來了');
                        resolve(data.imageUrl); // 傳回圖片 URL
                    },
                    error: function (err) {
                        console.error('圖片複製失敗:', err);
                        reject(err);
                    }
                });
            });
        };
    
        const createPlaceholder = async (placeholderIndex) => {
            // 定義上傳目標資料夾
            const targetFolder = `/uploads/${group.folderName}`;
            console.log('要上傳的資料夾為:', targetFolder);
    
            try {
                // 複製圖片並取得 URL
                console.log('準備呼叫copyImageToServer了');
                const imageUrl = await copyImageToServer(group.folderName, `${placeholderIndex + 1}`, group.index, placeholdersToAdd);
                console.log('呼叫完copyImageToServer了, 印出imageURL:', imageUrl);
                // 建立圖片區塊
                const $imgDiv = $('<div>').addClass('imageItem');
                
                const $img = $('<img>').attr({
                    src: imageUrl,
                    alt: `${placeholderIndex + 1}.jpg`
                }).css({ width: '300px', margin: '10px 0', opacity: 1 });
    
                const $caption = $('<p>').addClass('caption').html(`${group.index}.${placeholderIndex + 1} <br> ${placeholderIndex + 1}.jpg`);
                
                const $descriptionInput = $('<input>')
                    .attr('type', 'text')
                    .addClass('description-input')
                    .val("")
                    .css({ display: 'none' });
    
                const $descriptionText = $(`<div class="image-description" data-index="${placeholderIndex}"></div>`);
    
                const $editButtonDes = $('<button>').text('編輯文字').on('click', function () {
                    $descriptionText.hide();
                    $descriptionInput.show().focus();
                });
    
                const $saveButtonDes = $('<button>').text('保存更新').on('click', function () {
                    const newDescription = $descriptionInput.val();
                    updateImageDescription(group.folderName, `${placeholderIndex + 1}.jpg`, newDescription);
                    $descriptionText.text(newDescription).show();
                    $descriptionInput.hide();
                });
    
                const $uploadButton = $('<button>').text('上傳圖片').attr('data-index', placeholderIndex).on('click', function () {
                    const $fileInput = $('<input>').attr({
                        type: 'file',
                        accept: '.jpg'
                    }).css({ display: 'none' });
    
                    $fileInput.on('change', async function () {
                        const file = this.files[0];
                        if (file && file.type === 'image/jpeg') {
                            try {
                                const clickedIndex = placeholderIndex;
                                await uploadImage(group.folderName, clickedIndex, file, $img, group.index);
                            } catch (error) {
                                console.error('圖片上傳過程中出錯:', error);
                                alert('圖片上傳失敗');
                            }
                        } else {
                            alert('請上傳 .jpg 格式的圖片');
                        }
                    });
    
                    $fileInput.click();
                });
                console.log('placeholderIndex333', placeholderIndex);
                const $removeButton = $('<button>').text('移除圖片').attr('data-index', placeholderIndex).on('click', function () {
                    const folderName = group.folderName;
                    const imageName = $(this).siblings('img').attr('alt');
                    const imageIndex = Number($(this).data('index'));
                    console.log('Removing image333:', { folderName, imageName, imageIndex });

                    $.ajax({
                        url: '/api/remove-image',
                        method: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({ folderName, imageName, imageIndex }),
                        success: function () {
                            alert('圖片移除成功');
                            $imgDiv.remove();
                            loadGallery();
                        },
                        error: function (error) {
                            console.error('移除圖片失敗222:', error);
                            alert('移除圖片失敗222');
                        }
                    });
                });
    
                $imgDiv.append($img, $caption, $uploadButton, $removeButton, $descriptionText, $descriptionInput, $editButtonDes, $saveButtonDes);
                $imageContainer.append($imgDiv);
            } catch (error) {
                console.error('Placeholder 創建失敗:', error);
            }
        };
    
        // 依序建立 placeholders
        (async () => {
            for (let i = 0; i < placeholdersToAdd; i++) {
                const placeholderIndex = existingItemsCount + i;
                await createPlaceholder(placeholderIndex);
            }
        })();
    }
    

    function rebindRemoveButtons($imageContainer) {
        $imageContainer.find('.imageItem').each(function (index) {
            const newIndex = index + 1;
   
            // 更新 remove 按鈕事件綁定
            $(this).find('button:contains("Remove")').off('click').on('click', function () {
                $(this).closest('.imageItem').remove();
                rebindRemoveButtons($imageContainer); // 重新綁定所有 remove 按鈕
            });
        });
    }
    
    
    function updateImageOrder($imageContainer) {
        $imageContainer.find('.imageItem').each(function (index) {
            // 更新每個 .imageItem 的順序顯示
            $(this).find('.caption').html(`1.${index + 1} <br> ${$(this).find('img').attr('alt')}`);
        });
    }

    function removeImage(folderName, index) {
        console.log(`Removing image at ${folderName}, index ${index}`);
        // 可以在這裡添加刪除圖片的伺服器端邏輯
    }
    

    async function uploadImage(folderName, index, file, $imgElement, folderIndex) {
        console.log('uploadImage 執行:', folderName, index, file, $imgElement, folderIndex);
        const fileName = Number(index) + 1;
        console.log('fn', fileName);
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('imageDescription', 'Your image description'); // 描述
            console.log('這裡印出folderIndex', index);
            $.ajax({
                url: `/api/upload-image/${folderIndex}/${index}`,
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (response) {
                    console.log(`Image uploaded successfully for ${folderName}, index ${index}`);
                    $imgElement.attr('src', response.path);
                    $imgElement.attr('alt', `${fileName}.jpg`); // 更新圖片 src
                    const $caption = $imgElement.siblings('.caption');
                    const existingText = $caption.contents().first().text().trim(); // 取得 "1.3"
                    $caption.html(`${existingText}<br>${fileName}.jpg`); // 保留格式並更新圖片名稱
                    resolve(response); // 成功後 resolve
                },
                error: function (err) {
                    console.error('Failed to upload image:', err);
                    reject(err); // 發生錯誤時 reject
                }
            });
        });
    }
    

    function reorderImages(folderName) {
        const $images = $(`.group:contains("${folderName}") .imageContainer .imageItem`);
        $images.each(function (index) {
            const newIndex = index + 1; // 重新計算 index
            const $img = $(this).find('img');
            const newFileName = `${newIndex}.jpg`; // 新的檔案名稱
    
            // 更新顯示的索引和名稱
            $(this).find('.caption').html(`${folderName}.${newIndex} <br> ${newFileName}`);
            
            // 可以在伺服器端進行重新命名操作
            // Example: send a request to rename the file on the server
            $.ajax({
                url: `/rename-image/${folderName}/${$img.attr('alt')}`,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ newFileName }),
                success: function () {
                    console.log(`Image renamed successfully to ${newFileName}`);
                    $img.attr('alt', newFileName); // 更新 alt 屬性
                },
                error: function (err) {
                    console.error('Failed to rename image:', err);
                }
            });
        });
    }
    

    function uploadCoverImage(folderName, file, folderIndex) {
        console.log('index-222', folderIndex);
        const formData = new FormData();
        formData.append('coverImage', file);

        $.ajax({
            url: `/api/upload-cover/${folderIndex}`,
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function () {
                console.log('111Cover image uploaded successfully');
                alert('Cover image uploaded successfully');
                loadGallery(); // Reload gallery to see the new cover image
            },
            error: function (err) {
                console.error('Failed to upload cover image:', err);
                alert('Failed to upload cover image');
            }
        });
    }
    

    function updateVideoUrl(folderName, newUrl) {
        $.ajax({
            url: `/api/update-video-url`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ folderName, newUrl }),
            success: function () {
                alert('Video URL updated successfully');
                loadGallery(); // Reload gallery to see changes
            },
            error: function (err) {
                console.error('Failed to update video URL:', err);
                alert('Failed to update video URL');
            }
        });
    }


    

    loadGallery();
});
