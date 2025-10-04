// تهيئة المتغيرات العامة
let currentSlide = 0;
let slideInterval; // سيُستخدم كـ setTimeout للتحكم في الوقت المتبقي
const slideDuration = 5000; // مدة كل سلايد بالمللي ثانية
const transitionDuration = 500; // مدة الانتقال بين السلايدات
let slideStartTime = 0;
let remainingTime = slideDuration;

// عدد العناصر لكل قسم
const config = {
    featured: {
        count: 6 // عدد العناصر المميزة في السلايدر
    },
    movies: {
        count: 16, // عدد الأفلام المعروضة
        sortBy: 'year' // ترتيب حسب السنة
    },
    series: {
        count: 16, // عدد المسلسلات المعروضة
        sortBy: 'year' // ترتيب حسب السنة
    }
};

// جلب الهيدر والفوتر في أي صفحة HTML إذا وُجدت الحاويات
function loadHeaderFooter() {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        fetch('header.html')
            .then(res => res.text())
            .then(data => {
                headerContainer.innerHTML = data;
            });
    }
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        fetch('footer.html')
            .then(res => res.text())
            .then(data => {
                footerContainer.innerHTML = data;
            });
    }
}

// تهيئة البحث إذا وُجدت عناصر البحث
function initializeSearch() {
    const searchIcon = document.querySelector('.search-icon');
    const searchInput = document.querySelector('.search input');
    const searchContainer = document.querySelector('.search-input-container');
    if (!searchIcon || !searchInput || !searchContainer) return;

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
}

// تهيئة قائمة المستخدم إذا وُجدت عناصر القائمة
function initializeUserMenu() {
    const userIcon = document.querySelector('.user-icon');
    const userDropdown = document.querySelector('.user-dropdown');
    const menuButton = document.querySelector('.list-siting-button');
    const menuItems = document.querySelector('.list-siting-item');
    if (!userIcon || !userDropdown || !menuButton || !menuItems) return;

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

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            userDropdown.classList.remove('active');
            menuItems.classList.remove('active');
            menuButton.classList.remove('active');
        }
    });
}

// تحميل وعرض البيانات إذا وُجدت الحاويات المناسبة
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data = await response.json();

        // ترتيب البيانات حسب الـ id تنازلياً
        const sortedData = {
            featured: Array.isArray(data.featured) ? [...data.featured].sort((a, b) => b.id - a.id) : [],
            movies: Array.isArray(data.movies) ? [...data.movies].sort((a, b) => b.id - a.id) : [],
            series: Array.isArray(data.series) ? [...data.series].sort((a, b) => b.id - a.id) : []
        };

        // تحميل العناصر المميزة إذا وُجد السلايدر
        if (document.querySelector('.slider')) {
            loadFeaturedItems(sortedData.featured.slice(0, config.featured.count));
        }

        // تحميل أحدث الأفلام إذا وُجدت شبكة الأفلام
        if (document.querySelector('.movies-grid')) {
            loadLatestMovies(sortedData.movies);
        }

        // تحميل أحدث المسلسلات إذا وُجدت شبكة المسلسلات
        if (document.querySelector('.series-grid')) {
            loadLatestSeries(sortedData.series);
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// تحميل وعرض العناصر المميزة
function loadFeaturedItems(featured) {
    const slider = document.querySelector('.slider');
    if (!slider) return;
    slider.innerHTML = '';

    featured.forEach(item => {
        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.innerHTML = `
            <img src="${item.backdrop}" alt="${item.title}" loading="lazy">
            <div class="slide-content">
                <h2>${item.title}</h2>
                <p class="description">${item.description}</p>
                <button class="watch-btn" aria-label="شاهد ${item.title}" onclick="event.stopPropagation(); window.location.href='content.html?id=${item.id}&type=${item.seasons ? 'series' : 'movie'}'">
                    <i class="fas fa-play"></i>
                    Watch Now
                </button>
            </div>
        `;
        slider.appendChild(slide);
    });

    updateSlider();
    createDots(featured.length);
    startAutoSlide();
}

// إنشاء نقاط التنقل إذا وُجدت الحاوية
function createDots(count) {
    const dotsContainer = document.querySelector('.slider-dots');
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const dot = document.createElement('div');
        dot.className = `dot ${i === 0 ? 'active' : ''}`;
        const progress = document.createElement('div');
        progress.className = 'progress';
        dot.appendChild(progress);
        dot.addEventListener('click', () => {
            stopAutoSlide();
            goToSlide(i);
            startAutoSlide();
        });
        dotsContainer.appendChild(dot);
    }
    // بدء شريط التقدم لأول نقطة
    startDotProgress();
}

function loadLatestMovies(movies) {
    const moviesGrid = document.querySelector('.movies-grid');
    if (!moviesGrid) return;

    moviesGrid.innerHTML = '';

    // ترتيب الأفلام حسب السنة (الأحدث أولاً) وأخذ العدد المحدد
    const latestMovies = [...movies]
        .sort((a, b) => {
            const getYear = (y) => {
                if (y === undefined || y === null) return NaN;
                const s = String(y);
                const yy = parseInt(s.slice(0, 4), 10);
                return isNaN(yy) ? NaN : yy;
            };
            return getYear(b.year) - getYear(a.year);
        })
        .slice(0, config.movies.count);

    latestMovies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.setAttribute('data-id', movie.id);
        card.setAttribute('data-type', 'movie');
        card.innerHTML = `
            <img src="${movie.image}" alt="${movie.title}">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p class="genre">${movie.genre}</p>
                <div class="movie-details">
                    <div class="rating">
                        <i class="fas fa-star"></i>
                        <span>${movie.rating}</span>
                    </div>
                    <div class="duration">
                        <i class="fas fa-clock"></i>
                        <span>${movie.duration}</span>
                    </div>
                </div>
            </div>
            <button class="play-btn" data-id="${movie.id}" data-type="movie">
                <i class="fas fa-play"></i>
            </button>
        `;
        moviesGrid.appendChild(card);
    });
}

function loadLatestSeries(series) {
    const seriesGrid = document.querySelector('.series-grid');
    if (!seriesGrid) return;

    seriesGrid.innerHTML = '';

    // ترتيب المسلسلات حسب السنة (الأحدث أولاً) وأخذ العدد المحدد
    const latestSeries = [...series]
        .sort((a, b) => {
            const getYear = (y) => {
                if (y === undefined || y === null) return NaN;
                const s = String(y);
                const yy = parseInt(s.slice(0, 4), 10);
                return isNaN(yy) ? NaN : yy;
            };
            return getYear(b.year) - getYear(a.year);
        })
        .slice(0, config.series.count);

    latestSeries.forEach(show => {
        const card = document.createElement('div');
        card.className = 'series-card';
        card.setAttribute('data-id', show.id);
        card.setAttribute('data-type', 'series');
        card.innerHTML = `
            <div class="status-indicator ${show.status}">
                <i class="fas ${show.status === 'ongoing' ? 'fa-play-circle' : 'fa-check-circle'}"></i>
            </div>
            <img src="${show.image}" alt="${show.title}">
            <div class="series-info">
                <h3>${show.title}</h3>
                <div class="genre">${show.genre}</div>
                <div class="movie-details">
                    <div class="rating">
                        <i class="fas fa-star"></i>
                        <span>${show.rating}</span>
                    </div>
                    <div class="duration">
                        <i class="fas fa-clock"></i>
                        <span>${show.duration}</span>
                    </div>
                </div>
                <div class="episodes">${show.seasons} Seasons | ${show.episodes} Episodes</div>
            </div>
            <button class="play-btn" data-id="${show.id}" data-type="series">
                <i class="fas fa-play"></i>
            </button>
        `;
        seriesGrid.appendChild(card);
    });
}

// دالة تحديث السلايدر
function updateSlider() {
    const slider = document.querySelector('.slider');
    const slides = document.querySelectorAll('.slide');
    if (!slider || slides.length === 0) return;

    slider.style.transition = `transform ${transitionDuration}ms ease-in-out`;
    slider.style.transform = `translateX(-${currentSlide * 100}%)`;

    slides.forEach((slide, index) => {
        slide.style.transition = `opacity ${transitionDuration}ms ease-in-out`;
        slide.style.opacity = index === currentSlide ? '1' : '0.5';
    });

    updateDots();
}

// دالة تحديث النقاط
function updateDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
    startDotProgress();
}

function goToSlide(n) {
    currentSlide = n;
    updateSlider();
}

function nextSlide() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlider();
}

function prevSlide() {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlider();
}

// بدء التحديث التلقائي
function startAutoSlide() {
    stopAutoSlide();
    remainingTime = slideDuration;
    slideStartTime = Date.now();
    startDotProgress();
    slideInterval = setTimeout(() => {
        nextSlide();
        startAutoSlide();
    }, remainingTime);
}

// إيقاف التحديث التلقائي
function stopAutoSlide() {
    if (slideInterval) {
        clearTimeout(slideInterval);
        slideInterval = null;
        if (slideStartTime) {
            const elapsed = Date.now() - slideStartTime;
            remainingTime = Math.max(0, remainingTime - elapsed);
        }
        pauseDotProgress();
    }
}

// تحديث تهيئة الصفحة في أي صفحة HTML
document.addEventListener('DOMContentLoaded', () => {
    loadHeaderFooter();
    initializeSearch();
    initializeUserMenu();
    loadData();

    // Add click handlers for "View All" buttons إذا وُجدت
    document.querySelectorAll('.view-all').forEach(button => {
        button.addEventListener('click', () => {
            const section = button.closest('.content-section');
            if (!section) return;
            const title = section.querySelector('h2') ? section.querySelector('h2').textContent : '';
            if (title.includes('Movies')) {
                window.location.href = 'movies.html';
            } else if (title.includes('Series')) {
                window.location.href = 'series.html';
            }
        });
    });

    // Add slider controls إذا وُجدت
    const sliderContainer = document.querySelector('.slider-container');
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => {
            stopAutoSlide();
            nextSlide();
            // إعادة الضبط للمدة الكاملة عند التنقل اليدوي
            remainingTime = slideDuration;
            startAutoSlide();
        });

        prevBtn.addEventListener('click', () => {
            stopAutoSlide();
            prevSlide();
            remainingTime = slideDuration;
            startAutoSlide();
        });
    }

    if (sliderContainer) {
        // إضافة مستمعي الأحداث للفأرة
        sliderContainer.addEventListener('mouseenter', stopAutoSlide);
        sliderContainer.addEventListener('mouseleave', () => {
            // استئناف مع الوقت المتبقي
            slideStartTime = Date.now();
            resumeDotProgress();
            slideInterval = setTimeout(() => {
                nextSlide();
                startAutoSlide();
            }, remainingTime);
        });

        // إضافة دعم السحب للموبايل
        let touchStartX = 0;
        let touchEndX = 0;

        sliderContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopAutoSlide();
        });

        sliderContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
            startAutoSlide();
        });

        function handleSwipe() {
            const swipeThreshold = 50;
            if (touchEndX < touchStartX - swipeThreshold) {
                nextSlide();
            } else if (touchEndX > touchStartX + swipeThreshold) {
                prevSlide();
            }
        }
    }

    // Add click event listeners to all content cards إذا وُجدت
    document.querySelectorAll('.movie-card, .series-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.play-btn')) {
                const contentId = this.getAttribute('data-id');
                const contentType = this.getAttribute('data-type');
                window.location.href = `content.html?id=${contentId}&type=${contentType}`;
            }
        });
    });

    // Add click event listeners to all play buttons إذا وُجدت
    document.querySelectorAll('.play-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const contentId = this.getAttribute('data-id');
            const contentType = this.getAttribute('data-type');
            window.location.href = `content.html?id=${contentId}&type=${contentType}`;
        });
    });
});

// إدارة شريط التقدم داخل النقاط
function startDotProgress() {
    const dots = document.querySelectorAll('.dot');
    if (!dots.length) return;
    dots.forEach(dot => {
        const bar = dot.querySelector('.progress');
        if (!bar) return;
        bar.style.transition = 'none';
        bar.style.width = '0%';
    });

    const activeDot = document.querySelector('.dot.active');
    if (!activeDot) return;
    const bar = activeDot.querySelector('.progress');
    if (!bar) return;

    // نبدأ ممتلئاً 100% ثم نقلل إلى 0% خلال الوقت المتبقي
    // إعادة الضبط أولاً
    bar.style.transition = 'none';
    bar.style.width = '100%';
    // إجبار إعادة التدفق لضمان تطبيق الانتقال
    void bar.offsetWidth; // eslint-disable-line no-unused-expressions
    const durationMs = Math.max(0, remainingTime || slideDuration);
    bar.style.transition = `width ${durationMs}ms linear`;
    bar.style.width = '0%';
}

function pauseDotProgress() {
    const activeDot = document.querySelector('.dot.active');
    if (!activeDot) return;
    const bar = activeDot.querySelector('.progress');
    if (!bar) return;
    // احسب العرض الحالي وتوقف
    const computed = getComputedStyle(bar);
    const currentWidth = computed.width;
    bar.style.transition = 'none';
    bar.style.width = currentWidth;
}

function resumeDotProgress() {
    const activeDot = document.querySelector('.dot.active');
    if (!activeDot) return;
    const bar = activeDot.querySelector('.progress');
    if (!bar) return;
    // استكمال الانكماش إلى 0% خلال الوقت المتبقي
    void bar.offsetWidth; // force reflow
    const durationMs = Math.max(0, remainingTime || slideDuration);
    bar.style.transition = `width ${durationMs}ms linear`;
    bar.style.width = '0%';
}

// تحميل جميع الأفلام إذا وُجدت شبكة الأفلام
function loadAllMovies(movies) {
    const moviesGrid = document.querySelector('.movies-grid');
    if (!moviesGrid) return;

    moviesGrid.innerHTML = '';

    // ترتيب الأفلام حسب الـ id تنازلياً
    const sortedMovies = [...movies].sort((a, b) => b.id - a.id);

    sortedMovies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.setAttribute('data-id', movie.id);
        card.setAttribute('data-type', 'movie');
        card.innerHTML = `
            <div class="type-indicator movie">فيلم</div>
            <img src="${movie.image}" alt="${movie.title}">
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <p class="genre">${movie.genre}</p>
                <div class="movie-details">
                    <div class="rating">
                        <i class="fas fa-star"></i>
                        <span>${movie.rating}</span>
                    </div>
                    <div class="duration">
                        <i class="fas fa-clock"></i>
                        <span>${movie.duration}</span>
                    </div>
                </div>
            </div>
            <button class="play-btn" data-id="${movie.id}" data-type="movie">
                <i class="fas fa-play"></i>
            </button>
        `;
        moviesGrid.appendChild(card);
    });
}

// تحميل جميع المسلسلات إذا وُجدت شبكة المسلسلات
function loadAllSeries(series) {
    const seriesGrid = document.querySelector('.series-grid');
    if (!seriesGrid) return;

    seriesGrid.innerHTML = '';

    // ترتيب المسلسلات حسب الـ id تنازلياً
    const sortedSeries = [...series].sort((a, b) => b.id - a.id);

    sortedSeries.forEach(show => {
        const card = document.createElement('div');
        card.className = 'series-card';
        card.setAttribute('data-id', show.id);
        card.setAttribute('data-type', 'series');
        card.innerHTML = `
            <div class="type-indicator series">مسلسل</div>
            <div class="status-indicator ${show.status}"></div>
            <img src="${show.image}" alt="${show.title}">
            <div class="series-info">
                <h3>${show.title}</h3>
                <p class="genre">${show.genre}</p>
                <div class="rating">
                    <i class="fas fa-star"></i>
                    <span>${show.rating}</span>
                </div>
                <p class="episodes">${show.seasons} Seasons • ${show.episodes} Episodes</p>
            </div>
            <button class="play-btn" data-id="${show.id}" data-type="series">
                <i class="fas fa-play"></i>
            </button>
        `;
        seriesGrid.appendChild(card);
    });
} 