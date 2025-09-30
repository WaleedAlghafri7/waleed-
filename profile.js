document.addEventListener('DOMContentLoaded', () => {
    function getApiBase() {
        try {
            return window.location.origin && window.location.origin.startsWith('http')
                ? ''
                : 'http://localhost:3000';
        } catch (_) { return 'http://localhost:3000'; }
    }

    async function requestJSON(url, options = {}) {
        const res = await fetch(url, options);
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const data = await res.json();
            if (!res.ok) throw new Error(data && data.error ? data.error : 'Request failed');
            return data;
        } else {
            const text = await res.text();
            if (!res.ok) throw new Error(text || 'Request failed');
            throw new Error('Unexpected response');
        }
    }
    function isAuthenticated() {
        return Boolean(localStorage.getItem('auth_token') && localStorage.getItem('auth_user'));
    }

    function getCurrentUser() {
        try {
            const user = localStorage.getItem('auth_user');
            return user ? JSON.parse(user) : null;
        } catch (_) { return null; }
    }

    const user = getCurrentUser();
    if (!isAuthenticated() || !user) {
        window.location.href = 'login.html';
        return;
    }

    // Prefill fields
    const fullnameEl = document.getElementById('fullname');
    const emailEl = document.getElementById('email');
    const phoneEl = document.getElementById('phone');
    const usernameEl = document.getElementById('username');
    const locationEl = document.getElementById('location');
    const occupationEl = document.getElementById('occupation');
    const languageEl = document.getElementById('language');
    const websiteEl = document.getElementById('website');
    const genderEl = document.getElementById('gender');
    const birthdateEl = document.getElementById('birthdate');
    const bioEl = document.getElementById('bio');

    if (fullnameEl) fullnameEl.value = user.fullName || '';
    if (emailEl) emailEl.value = user.email || '';
    if (phoneEl) phoneEl.value = user.phone || '';
    if (usernameEl) usernameEl.value = user.username || '';
    if (locationEl) locationEl.value = user.location || '';
    if (occupationEl) occupationEl.value = user.occupation || '';
    if (languageEl) languageEl.value = user.language || '';
    if (websiteEl) websiteEl.value = user.website || '';
    if (genderEl) genderEl.value = user.gender || '';
    if (birthdateEl) birthdateEl.value = user.birthdate || '';
    if (bioEl) bioEl.value = user.bio || '';

    // Handle profile save
    const profileForm = document.querySelector('.profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                id: user.id,
                fullName: fullnameEl ? fullnameEl.value.trim() : undefined,
                email: emailEl ? emailEl.value.trim() : undefined,
                phone: phoneEl ? phoneEl.value.trim() : undefined,
                username: usernameEl ? usernameEl.value.trim() : undefined,
                location: locationEl ? locationEl.value.trim() : undefined,
                occupation: occupationEl ? occupationEl.value.trim() : undefined,
                language: languageEl ? languageEl.value.trim() : undefined,
                website: websiteEl ? websiteEl.value.trim() : undefined,
                gender: genderEl ? genderEl.value.trim() : undefined,
                birthdate: birthdateEl ? birthdateEl.value : undefined,
                bio: bioEl ? bioEl.value.trim() : undefined,
            };
            try {
                const apiBase = getApiBase();
                const data = await requestJSON(`${apiBase}/api/profile/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                localStorage.setItem('auth_user', JSON.stringify(data.user));
                alert('Profile updated successfully');
                location.reload();
            } catch (err) {
                alert(err.message);
            }
        });
    }

    // Handle password change (client-side validation + server call placeholder)
    const passwordForm = document.querySelector('.password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            if (!newPassword || newPassword !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            try {
                const apiBase = getApiBase();
                const res = await fetch(`${apiBase}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email, password: currentPassword })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data && data.error ? data.error : 'Current password incorrect');
                const res2 = await fetch(`${apiBase}/api/profile/update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: user.id, newPassword })
                });
                const data2 = await res2.json();
                if (!res2.ok) throw new Error(data2 && data2.error ? data2.error : 'Failed to change password');
                alert('Password changed successfully');
            } catch (err) {
                alert(err.message);
            }
        });
    }

    // Handle avatar upload
    const uploadBtn = document.getElementById('uploadAvatarBtn');
    const avatarInput = document.getElementById('avatar');
    if (uploadBtn && avatarInput) {
        uploadBtn.addEventListener('click', async () => {
            if (!avatarInput.files || avatarInput.files.length === 0) {
                alert('Please select an image first');
                return;
            }
            const file = avatarInput.files[0];
            const formData = new FormData();
            formData.append('avatar', file);
            formData.append('id', user.id);
            try {
                const apiBase = getApiBase();
                const res = await fetch(`${apiBase}/api/profile/avatar`, {
                    method: 'POST',
                    body: formData
                });
                const contentType = res.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    const text = await res.text();
                    throw new Error(text || 'Upload failed');
                }
                const data = await res.json();
                if (!res.ok) throw new Error(data && data.error ? data.error : 'Upload failed');
                localStorage.setItem('auth_user', JSON.stringify(data.user));
                alert('Avatar updated successfully');
            } catch (err) {
                alert(err.message);
            }
        });
    }

    // Handle delete account
    const deleteBtn = document.getElementById('deleteAccountBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            const confirmed = confirm('Are you sure you want to delete your account? This action cannot be undone.');
            if (!confirmed) return;
            try {
                const apiBase = getApiBase();
                const res = await fetch(`${apiBase}/api/profile/delete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: user.id })
                });
                const contentType = res.headers.get('content-type') || '';
                if (!contentType.includes('application/json')) {
                    const text = await res.text();
                    throw new Error(text || 'Failed to delete account');
                }
                const data = await res.json();
                if (!res.ok) throw new Error(data && data.error ? data.error : 'Failed to delete account');
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                alert('Account deleted successfully');
                window.location.href = 'index.html';
            } catch (err) {
                alert(err.message);
            }
        });
    }
});


