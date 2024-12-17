console.log('admin.js 已加載');

$(document).ready(function () {
    // 綁定表單提交事件
    console.log('有進來嗎？-1')
    $('#loginForm').on('submit', function (e) {
        e.preventDefault(); // 防止表單默認提交行為
        console.log('有進來嗎？-2')
        // 獲取輸入框的值
        const username = $('#username').val().trim();
        const password = $('#password').val().trim();

        // 確保帳號和密碼不為空
        if (!username || !password) {
            alert('請輸入帳號和密碼');
            return;
        }

        // 發送 AJAX 請求到後端
        $.ajax({
            url: '/api/admin', // 後端 API 路徑
            method: 'POST',
            contentType: 'application/json',
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({ username, password }), // 將帳號和密碼轉為 JSON 格式
            success: function (response) {
                console.log('後端來囉:'); // 調試用
                // window.location.href = '/admin.html';
                document.open(); // 清空目前的頁面內容
                document.write(response); // 插入後端返回的 HTML
                document.close(); // 完成頁面更新
            },
            error: function (xhr, status, error) {
                console.error('請求失敗:', error); // 調試用
                alert('請求失敗，請稍後再試');
            }
        });
    });
});