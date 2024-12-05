$(document).ready(function () {
    // 綁定表單提交事件
    $('#loginForm').on('submit', function (e) {
        e.preventDefault(); // 防止表單默認提交行為

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
            url: '/api/login', // 後端 API 路徑
            method: 'POST',
            contentType: 'application/json',
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({ username, password }), // 將帳號和密碼轉為 JSON 格式
            credentials: 'include', // 確保攜帶 Cookie
            success: function (response) {
                console.log('後端回應:', response); // 調試用
                if (response.message === '登入成功') {
                    window.location.href = '/admin.html';
                }            },
            error: function (xhr, status, error) {
                console.error('請求失敗:', error); // 調試用
                alert('請求失敗，請稍後再試');
            }
        });
    });
});