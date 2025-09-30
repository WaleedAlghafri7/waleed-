document.addEventListener('DOMContentLoaded', () => {
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
    const genderEl = document.getElementById('gender');
    const birthdateEl = document.getElementById('birthdate');
    const bioEl = document.getElementById('bio');

    if (fullnameEl) fullnameEl.value = user.fullName || '';
    if (emailEl) emailEl.value = user.email || '';
    if (phoneEl) phoneEl.value = user.phone || '';
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
                gender: genderEl ? genderEl.value.trim() : undefined,
                birthdate: birthdateEl ? birthdateEl.value : undefined,
                bio: bioEl ? bioEl.value.trim() : undefined,
            };
            try {
                const res = await fetch('/api/profile/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data && data.error ? data.error : 'Failed to update profile');
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
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email, password: currentPassword })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data && data.error ? data.error : 'Current password incorrect');
                const res2 = await fetch('/api/profile/update', {
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
                const res = await fetch('/api/profile/avatar', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data && data.error ? data.error : 'Upload failed');
                localStorage.setItem('auth_user', JSON.stringify(data.user));
                alert('Avatar updated successfully');
            } catch (err) {
                alert(err.message);
            }
        });
    }
});


