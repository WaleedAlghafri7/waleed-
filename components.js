// Function to load header
async function loadHeader() {
    try {
        const response = await fetch('header.html');
        const html = await response.text();
        document.getElementById('header-container').innerHTML = html;
        initializeHeaderComponents();
        initializeAuthUI();
    } catch (error) {
        console.error('Error loading header:', error);
    }
}

// Function to load footer
async function loadFooter() {
    try {
        const response = await fetch('footer.html');
        const html = await response.text();
        document.getElementById('footer-container').innerHTML = html;
    } catch (error) {
        console.error('Error loading footer:', error);
    }
}

// Initialize header components
function initializeHeaderComponents() {
    // تهيئة البحث
    const searchIcon = document.querySelector('.search-icon');
    const searchInput = document.querySelector('.search input');
    const searchContainer = document.querySelector('.search-input-container');

    // Toggle search input
    searchIcon.addEventListener('click', () => {
        searchIcon.classList.toggle('active');
        searchInput.classList.toggle('active');
        if (searchInput.classList.contains('active')) {
            searchInput.focus();
        }
    });

    // Handle search
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchQuery = searchInput.value.trim();
            if (searchQuery) {
                window.location.href = `search.html?q=${encodeURIComponent(searchQuery)}`;
            }
        }
    });

    // Close search when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target) && !searchIcon.contains(e.target)) {
            searchIcon.classList.remove('active');
            searchInput.classList.remove('active');
        }
    });

    // تهيئة قائمة المستخدم
    const userIcon = document.querySelector('.user-icon');
    const userDropdown = document.querySelector('.user-dropdown');
    const menuButton = document.querySelector('.list-siting-button');
    const menuItems = document.querySelector('.list-siting-item');

    userIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
        menuItems.classList.remove('active');
        menuButton.classList.remove('active');
    });

    menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        menuItems.classList.toggle('active');
        menuButton.classList.toggle('active');
        userDropdown.classList.remove('active');
    });

    userDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    menuItems.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    document.addEventListener('click', () => {
        userDropdown.classList.remove('active');
        menuItems.classList.remove('active');
        menuButton.classList.remove('active');
    });

    // إغلاق القوائم عند الضغط على ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            userDropdown.classList.remove('active');
            menuItems.classList.remove('active');
            menuButton.classList.remove('active');
        }
    });
}

// === Global Auth UI Handling ===
function isAuthenticated() {
    try {
        const token = localStorage.getItem('auth_token');
        const user = localStorage.getItem('auth_user');
        return Boolean(token && user);
    } catch (_) {
        return false;
    }
}

function getCurrentUser() {
    try {
        const userData = localStorage.getItem('auth_user');
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        return null;
    }
}

function initializeAuthUI() {
    const isLoggedIn = isAuthenticated();
    const user = getCurrentUser();

    const userNameEl = document.getElementById('user-name');
    const userEmailEl = document.getElementById('user-email');
    const userAvatarImg = document.getElementById('user-avatar-img');
    const userAvatarIcon = document.querySelector('.user-avatar i');
    const userTopIcon = document.querySelector('.user-icon i');
    const authButtons = document.querySelector('.auth-buttons');
    const logoutBtn = document.querySelector('.logout-btn');
    const userMenu = document.querySelector('.user-menu');

    if (isLoggedIn && user) {
        if (userNameEl) userNameEl.textContent = user.fullName || 'User';
        if (userEmailEl) userEmailEl.textContent = user.email || '';
        if (userAvatarImg) {
            if (user.avatarUrl) {
                userAvatarImg.src = user.avatarUrl;
                userAvatarImg.style.display = 'block';
                if (userAvatarIcon) userAvatarIcon.style.display = 'none';
                if (userTopIcon) userTopIcon.style.display = 'none';
            } else {
                userAvatarImg.style.display = 'none';
                if (userAvatarIcon) userAvatarIcon.style.display = 'inline-block';
                if (userTopIcon) userTopIcon.style.display = 'inline-block';
            }
        }
        if (authButtons) authButtons.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (userMenu) {
            const menuButtons = userMenu.querySelectorAll('button');
            menuButtons.forEach((btn) => { btn.style.display = 'block'; });
        }
    } else {
        if (userNameEl) userNameEl.textContent = 'User Name';
        if (userEmailEl) userEmailEl.textContent = 'user@email.com';
        if (userAvatarImg) userAvatarImg.style.display = 'none';
        if (userAvatarIcon) userAvatarIcon.style.display = 'inline-block';
        if (userTopIcon) userTopIcon.style.display = 'inline-block';
        if (authButtons) {
            const loginBtn = authButtons.querySelector('.btn-login');
            const registerBtn = authButtons.querySelector('.btn-register');
            if (loginBtn) loginBtn.style.display = 'block';
            if (registerBtn) registerBtn.style.display = 'flex';
            authButtons.style.display = 'flex';
        }
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userMenu) {
            const menuButtons = userMenu.querySelectorAll('button');
            menuButtons.forEach((btn) => { btn.style.display = 'none'; });
        }
    }

    if (logoutBtn) {
        logoutBtn.onclick = function() {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            initializeAuthUI();
            window.location.href = 'index.html';
        };
    }
}

// Load components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadFooter();
}); 

// === Global Toast Notifications (top-right) ===
;(function(){
    if (window.showToast) return;
    window.showToast = function(message, type) {
        try {
            const kind = (type || 'info').toLowerCase();
            let container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                container.style.cssText = [
                    'position:fixed',
                    'top:16px',
                    'right:16px',
                    'z-index:10000',
                    'display:flex',
                    'flex-direction:column',
                    'gap:10px',
                    'pointer-events:none'
                ].join(';');
                document.body.appendChild(container);
            }
            const colors = {
                info: { bg: '#2d7ff9', fg: '#fff', icon: 'ℹ️' },
                success: { bg: '#27ae60', fg: '#fff', icon: '✔️' },
                error: { bg: '#e74c3c', fg: '#fff', icon: '⚠️' },
                warning: { bg: '#f39c12', fg: '#1b1b1b', icon: '⚠️' }
            };
            const theme = colors[kind] || colors.info;
            const toast = document.createElement('div');
            toast.style.cssText = [
                `background:${theme.bg}`,
                `color:${theme.fg}`,
                'padding:12px 14px',
                'border-radius:10px',
                'box-shadow:0 6px 18px rgba(0,0,0,0.25)',
                'display:flex',
                'align-items:center',
                'gap:10px',
                'min-width:260px',
                'max-width:360px',
                'font-weight:600',
                'pointer-events:auto',
                'opacity:0',
                'transform:translateY(-8px)',
                'transition:opacity .2s ease, transform .2s ease'
            ].join(';');
            toast.innerHTML = `<span style="font-size:16px;line-height:1">${theme.icon}</span><span style="line-height:1.2">${message}</span>`;
            container.appendChild(toast);
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            });
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateY(-8px)';
                setTimeout(() => { toast.remove(); }, 220);
            }, 2800);
        } catch (_) {
            // fallback
            try { alert(message); } catch(_) {}
        }
    }
})();