document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const redirectIfLoggedIn = () => {
        const hasToken = localStorage.getItem('auth_token');
        const hasUser = localStorage.getItem('auth_user');
        if (hasToken && hasUser && window.location.pathname.endsWith('login.html')) {
            window.location.href = 'index.html';
        }
    };

    async function postJSON(url, data) {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            const msg = json && json.error ? json.error : 'Request failed';
            throw new Error(msg);
        }
        return json;
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            if (password !== confirmPassword) {
                return;
            }
            try {
                const data = await postJSON('/api/register', { fullName, email, password });
                window.location.href = 'login.html';
            } catch (err) {
                alert(err.message);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            try {
                const data = await postJSON('/api/login', { email, password });
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('auth_user', JSON.stringify(data.user));
                try {
                    const headerAvatar = document.getElementById('user-avatar-img');
                    if (headerAvatar && data.user && data.user.avatarUrl) {
                        headerAvatar.src = data.user.avatarUrl;
                        headerAvatar.style.display = 'block';
                    }
                } catch (_) {}
                window.location.href = 'index.html';
            } catch (err) {
                alert(err.message);
            }
        });
    }

    redirectIfLoggedIn();
});

