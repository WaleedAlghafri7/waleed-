// Function to load header
async function loadHeader() {
    try {
        const response = await fetch('header.html');
        const html = await response.text();
        document.getElementById('header-container').innerHTML = html;
        initializeHeaderComponents();
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

// Load components when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadHeader();
    loadFooter();
}); 