/********************************************************************
 *            تهيئة المتغيرات العامة والإعدادات الأساسية               *
 *      (المتغيرات العامة + الإعدادات الخاصة بعدد ومحتوى الأقسام)    *
 ********************************************************************/

let currentSlide = 0;                    // رقم السلايد الحالي في السلايدر
let slideInterval;                       // سيتم استعماله للتحكم في التايمر التلقائي للسلايدر
const slideDuration = 5000;              // مدة إظهار كل سلايد بالمللي ثانية
const transitionDuration = 500;          // مدة الحركة الانتقالية بين السلايدات
let slideStartTime = 0;                  // بداية زمن السلايد الحالي
let remainingTime = slideDuration;       // الوقت المتبقي في السلايد الحالي

// إعدادات عدد العناصر في كل قسم بالسلايدر أو الشبكات
const config = {
    featured: { count: 10 },                             // عدد العناصر المميزة في السلايدر
    movies:   { count: 16, sortBy: 'year' },             // عدد الأفلام المعروضة مع الترتيب
    series:   { count: 16, sortBy: 'year' }              // عدد المسلسلات المعروضة مع الترتيب
};

/********************************************************************
 *                     تحميل الهيدر والفوتر                          *
 *   (في كل صفحة HTML: إدراج ملفات الهيدر والفوتر إن وُجدت الحاويات)  *
 ********************************************************************/
function loadHeaderFooter() {
    const headerContainer = document.getElementById('header-container');
    if (headerContainer) {
        fetch('header.html')
            .then(res => res.text())
            .then(data => { headerContainer.innerHTML = data; });
    }
    const footerContainer = document.getElementById('footer-container');
    if (footerContainer) {
        fetch('footer.html')
            .then(res => res.text())
            .then(data => { footerContainer.innerHTML = data; });
    }
}

/********************************************************************
 *                     البحث والتحكم في حقل البحث                    *
 *   (يظهر حقل البحث/إخفاؤه وينقل المستخدم لصفحة نتائج البحث)         *
 ********************************************************************/
let searchDebounceTimer = null;
let allContentData = null;

function initializeSearch() {
    const searchIcon      = document.querySelector('.search-icon');
    const searchInput     = document.querySelector('.search input');
    const searchContainer = document.querySelector('.search-input-container');
    const resultsDropdown = document.querySelector('.search-results-dropdown');
    if (!searchIcon || !searchInput || !searchContainer) return;

    // عرض أو إخفاء حقل البحث
    searchIcon.addEventListener('click', () => {
        searchIcon.classList.toggle('active');
        searchInput.classList.toggle('active');
        if (searchInput.classList.contains('active')) {
            searchInput.focus();
        } else {
            hideSearchResults();
        }
    });

    // البحث عند الكتابة (Live Search)
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(searchDebounceTimer);
        
        if (query.length < 2) {
            hideSearchResults();
            return;
        }

        // بحث بتأخير 300ms لتقليل الاستعلامات
        searchDebounceTimer = setTimeout(() => {
            performQuickSearch(query);
        }, 300);
    });

    // البحث عند الضغط على Enter في الإدخال
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchQuery = searchInput.value.trim();
            if (searchQuery) {
                hideSearchResults();
                window.location.href = `search.html?q=${encodeURIComponent(searchQuery)}`;
            }
        }
    });

    // غلق الحقل إذا ضغطنا خارج البحث
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target) && !searchIcon.contains(e.target)) {
            searchIcon.classList.remove('active');
            searchInput.classList.remove('active');
            hideSearchResults();
        }
    });
}

// إظهار نتائج البحث
function showSearchResults(results) {
    const resultsDropdown = document.querySelector('.search-results-dropdown');
    if (!resultsDropdown) return;

    if (results.length === 0) {
        resultsDropdown.innerHTML = '<div class="search-result-item-no-results">No results found</div>';
    } else {
        resultsDropdown.innerHTML = results.map(item => {
            const type = item.seasons ? 'series' : 'movie';
            const typeLabel = type === 'series' ? 'Series' : 'Movie';
            // الأزرق للمسلسل، الأحمر للفيلم
            const typeColor = type === 'series' ? '#2980f3' : '#c0392b';
            return `
                <div class="search-result-item" onclick="window.location.href='content.html?id=${item.id}&type=${type}'">
                    <img src="${item.image}" alt="${item.title}" class="search-result-item-image" onerror="this.onerror=null; this.src='https://cdn-icons-png.freepik.com/512/13434/13434998.png';">
                    <div class="search-result-item-content">
                        <div class="search-result-item-title">${item.title}</div>
                        <div class="search-result-item-meta">
                            <span class="search-result-item-type" style="color: ${typeColor}; font-weight: bold;">
                                ${typeLabel}
                            </span>
                            <span class="search-result-item-rating">
                                <i class="fas fa-star"></i> ${item.rating || 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    resultsDropdown.classList.add('show');
}

// إخفاء نتائج البحث
function hideSearchResults() {
    const resultsDropdown = document.querySelector('.search-results-dropdown');
    if (resultsDropdown) {
        resultsDropdown.classList.remove('show');
    }
}

// البحث السريع في البيانات
async function performQuickSearch(query) {
    try {
        // إذا لم نكن قد حمّلنا البيانات بعد، قم بتحميلها
        if (!allContentData) {
            const response = await fetch('data.json');
            allContentData = await response.json();
        }

        const searchTerm = query.toLowerCase();
        const allItems = [...allContentData.movies, ...allContentData.series];
        
        // البحث فقط عن العناوين التي تبدأ بـ searchTerm وترتيب النتائج حسب الترتيب الأبجدي للاسم
        let results = allItems
            .filter(item => item.title && item.title.toLowerCase().startsWith(searchTerm))
            .map(item => ({
                ...item,
                type: item.seasons ? 'series' : 'movie'
            }));

        // ثم أضف بقية النتائج التي تحتوي على searchTerm ولكن لا تبدأ به، مع نفس نوع الترتيب
        let containsResults = allItems
            .filter(item => item.title && !item.title.toLowerCase().startsWith(searchTerm) && item.title.toLowerCase().includes(searchTerm))
            .map(item => ({
                ...item,
                type: item.seasons ? 'series' : 'movie'
            }));

        // جمع النتائج الكلية
        results = results.concat(containsResults);

        // ترتيب جميع النتائج أبجدياً حسب الاسم
        results = results.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

        showSearchResults(results);
    } catch (error) {
        console.error('Error performing quick search:', error);
    }
}

/********************************************************************
 *               قائمة المستخدم (قائمة الهويات/التسجيل)              *
 ********************************************************************/
function initializeUserMenu() {
    const userIcon   = document.querySelector('.user-icon');
    const userDropdown = document.querySelector('.user-dropdown');
    const menuButton   = document.querySelector('.list-siting-button');
    const menuItems    = document.querySelector('.list-siting-item');
    if (!userIcon || !userDropdown || !menuButton || !menuItems) return;

    // عرض أو إخفاء قائمة المستخدم
    userIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
        menuItems.classList.remove('active');
        menuButton.classList.remove('active');
    });

    // عرض أو إخفاء قائمة الإعدادات الجانبية
    menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        menuItems.classList.toggle('active');
        menuButton.classList.toggle('active');
        userDropdown.classList.remove('active');
    });

    userDropdown.addEventListener('click',      (e) => { e.stopPropagation(); });
    menuItems.addEventListener('click',         (e) => { e.stopPropagation(); });

    // غلق جميع القوائم عند الضغط خارجها
    document.addEventListener('click', () => {
        userDropdown.classList.remove('active');
        menuItems.classList.remove('active');
        menuButton.classList.remove('active');
    });

    // غلق القوائم عند الضغط على Esc
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            userDropdown.classList.remove('active');
            menuItems.classList.remove('active');
            menuButton.classList.remove('active');
        }
    });
}

/*********************************************************************
 * تحميل وعرض البيانات من ملف البيانات وتهيئة الأقسام (أفلام/مسلسلات)  *
 *   (يستدعي تحميل السلايدر وشبكات الأفلام والمسلسلات)                *
 *********************************************************************/
async function loadData() {
    try {
        const response = await fetch('data.json');
        const data     = await response.json();

        // ترتيب كل قسم حسب ID تنازلياً
        const sortedData = {
            featured: Array.isArray(data.featured) ? [...data.featured].sort((a, b) => b.id - a.id) : [],
            movies:   Array.isArray(data.movies)   ? [...data.movies].sort((a, b) => b.id - a.id) : [],
            series:   Array.isArray(data.series)   ? [...data.series].sort((a, b) => b.id - a.id) : []
        };

        // تحميل العناصر المميزة للسلايدر
        if (document.querySelector('.slider'))
            loadFeaturedItems(sortedData.featured.slice(0, config.featured.count));

        // تحميل قائمة آخر الأفلام
        if (document.querySelector('.movies-grid'))
            loadLatestMovies(sortedData.movies);

        // تحميل قائمة آخر المسلسلات
        if (document.querySelector('.series-grid'))
            loadLatestSeries(sortedData.series);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

/********************************************************************
 *            قسم تحميل السلايدر الرئيسي (العناصر المميزة)            *
 *  (ينشئ عناصر السلايدر ويعدل العنوان حسب وجود صورة أم نص العنوان)    *
 ********************************************************************/
function loadFeaturedItems(featured) {
    const slider = document.querySelector('.slider');
    if (!slider) return;
    slider.innerHTML = '';

    featured.forEach(item => {
        // تفضيل صورة العنوان إذا وُجدت، وإلا اظهر نص العنوان
        let titleContent;
        if (item['imgname'] && String(item['imgname']).trim() !== '') {
            titleContent = `
                <img 
                    src="${item['imgname']}" 
                    alt="${item.title}" 
                    class="slide-title-img" 
                    style="
                        width: 150px; 
                        max-width: 200px; 
                        margin-bottom: 10px;
                    " 
                    onload="
                        if(window.innerWidth > 767) 
                            this.style.width='250px';
                        else 
                            this.style.width='150px';
                    "
                >
            `;
        } else {
            titleContent = `<h2>${item.title}</h2>`;
        }

        // type label (Movie or Series)
        let typeLabel = item.seasons ? 'Series' : 'Movie';
        let ratingValue = item.rating !== undefined ? item.rating : '--';
        let durationValue = item.duration ? item.duration : '--';

        const slide = document.createElement('div');
        slide.className = 'slide';
        slide.innerHTML = `
            <img src="${item.backdrop}" alt="${item.title}" loading="lazy">
            <div class="slide-content">
                ${titleContent}
                <p class="description" style="
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    font-size:1.45rem;
                    font-family:'Lamahki', 'Tajawal', Arial, sans-serif;
                    font-weight:bold;
                    letter-spacing:0.03em;
                    max-height:3.1em;
                    line-height:1.55;
                ">${item.description}</p>
                <div class="slide-meta" style="
                    display: flex;
                    gap: 8px;
                    margin-bottom: 12px;
                    align-items: center;
                    justify-content: flex-start;
                    flex-wrap: wrap;
                ">
                    <span class="type-label" style="
                        font-weight: bold;
                        color: #${item.seasons ? '00aeff' : 'ff0000'};
                        background: rgba(255,255,255,0.12);
                        padding: 6px 10px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.12);
                        font-size: 0.93rem;
                        min-width: 78px;
                        max-width: 120px;
                        height: 30px;
                        text-align: center;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        backdrop-filter: blur(6px);
                        -webkit-backdrop-filter: blur(6px);
                    ">${typeLabel}</span>
                    <span class="rating0" style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(255,255,255,0.12);
                        padding: 6px 10px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.12);
                        font-size: 0.93rem;
                        min-width: 78px;
                        max-width: 120px;
                        height: 30px;
                        text-align: center;
                        backdrop-filter: blur(6px);
                        -webkit-backdrop-filter: blur(6px);
                    ">
                        <i class="fas fa-star" style="color: gold; margin-inline-end:4px; font-size:16px;"></i> ${ratingValue}
                    </span>
                    <span class="duration" style="
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(255,255,255,0.12);
                        padding: 6px 10px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.12);
                        font-size: 0.93rem;
                        min-width: 78px;
                        max-width: 120px;
                        height: 30px;
                        text-align: center;
                        backdrop-filter: blur(6px);
                        -webkit-backdrop-filter: blur(6px);
                    ">
                        <i class="fas fa-clock" style="margin-inline-end:4px; font-size:15px;"></i> ${durationValue}
                    </span>
                </div>
                <div class="buttonslid">
                    ${item.seasons ? '' : `
                    <button class="watch-btn" aria-label="Watch ${item.title}" onclick="event.stopPropagation();">
                        <i class="fas fa-play"></i>
                        Watch Now
                    </button>
                    `}
                    <button class="more-info-btn" aria-label="More info about ${item.title}" onclick="event.stopPropagation(); window.location.href='content.html?id=${item.id}&type=${item.seasons ? 'series' : 'movie'}#more-info'">
                        <i class="fas fa-info-circle"></i>
                        More Info
                    </button>
                </div>
            </div>
        `;
        slider.appendChild(slide);
    });

    updateSlider();
    createDots(featured.length);
    startAutoSlide();
}

/********************************************************************
 *                إنشاء نقاط تنقل السلايدر (الدوتس)                  *
 *  (لكل عنصر سلايدر نقطة يمكن النقر عليها والتنقل، مع شريط تقدم)     *
 ********************************************************************/
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
    startDotProgress(); // بدء شريط التقدم لأول نقطة
}


/********************************************************************
 *             دوال التحكم/التنقل في السلايدر (أسهم - دوتس)           *
 ********************************************************************/
function updateSlider() {
    const slider = document.querySelector('.slider');
    const slides = document.querySelectorAll('.slide');
    if (!slider || slides.length === 0) return;

    slider.style.transition = `transform ${transitionDuration}ms ease-in-out`;
    slider.style.transform = `translateX(-${currentSlide * 100}%)`;

    slides.forEach((slide, index) => {
        slide.style.transition = `opacity ${transitionDuration}ms ease-in-out`;
        slide.style.opacity = (index === currentSlide ? '1' : '0.5');
    });

    updateDots();
}

// تحديث حالة النقاط الدلالية
function updateDots() {
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
    startDotProgress();
}

// الانتقال لسلايد محدد
function goToSlide(n) {
    currentSlide = n;
    updateSlider();
}

// السلايد التالي
function nextSlide() {
    const slides = document.querySelectorAll('.slide');
    if (!slides.length) return;
    currentSlide = (currentSlide + 1) % slides.length;
    updateSlider();
}

// السلايد السابق
function prevSlide() {
    const slides = document.querySelectorAll('.slide');
    if (!slides.length) return;
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateSlider();
}

/********************************************************************
 *                إدارة التقدم التلقائي للسلايدر                      *
 ********************************************************************/
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

/********************************************************************
 *    أحداث تحميل الصفحة وتهيئة السلايدر وعناصر التحكم والبطاقات       *
 ********************************************************************/
document.addEventListener('DOMContentLoaded', () => {
    loadHeaderFooter();
    initializeSearch();
    initializeUserMenu();
    loadData();
    initializeGridNavigation();
    // تم حذف initializePricingToggle بناءً على التعليمات

    // ازرار "عرض الكل" في الأقسام
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

    // التحكم بالسلايدر بالأسهم
    const sliderContainer = document.querySelector('.slider-container');
    const nextBtn = document.querySelector('.next-btn');
    const prevBtn = document.querySelector('.prev-btn');

    if (nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => {
            stopAutoSlide();
            nextSlide();
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

    // إيقاف السلايدر عند المرور وإعادته عند الخروج أو السحب للموبايل
    if (sliderContainer) {
        // إيقاف تلقائي عند مرور الفأرة
        sliderContainer.addEventListener('mouseenter', stopAutoSlide);
        sliderContainer.addEventListener('mouseleave', () => {
            slideStartTime = Date.now();
            resumeDotProgress();
            slideInterval = setTimeout(() => {
                nextSlide();
                startAutoSlide();
            }, remainingTime);
        });

        // دعم السحب يمين/يسار لكل من الاجهزة المكتبية والموبايل - حركة واحدة = سلايد واحد
        let dragStartX = 0;
        let dragging = false;

        // لمس (موبايل)
        sliderContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                dragStartX = e.touches[0].clientX;
                dragging = true;
                stopAutoSlide();
            }
        });

        sliderContainer.addEventListener('touchmove', (e) => {
            if (!dragging) return;
            // ممكن استخدام لاحقا لعمل FX/جر للشرائح (حاليا غير مستخدم)
        });

        sliderContainer.addEventListener('touchend', (e) => {
            if (!dragging) return;
            let dragEndX = e.changedTouches[0].clientX;
            let diff = dragEndX - dragStartX;
            const threshold = 50;
            if (diff > threshold) {
                prevSlide();
            } else if (diff < -threshold) {
                nextSlide();
            }
            dragging = false;
            startAutoSlide();
        });

        sliderContainer.addEventListener('touchcancel', () => {
            dragging = false;
            startAutoSlide();
        });

        // سحب بالفأرة (دسكتوب)
        let mouseDown = false;
        let mouseStartX = 0;

        sliderContainer.addEventListener('mousedown', (e) => {
            mouseDown = true;
            mouseStartX = e.clientX;
            stopAutoSlide();
        });

        sliderContainer.addEventListener('mousemove', (e) => {
            // ممكن: عمل تأثيرجر خفيف (اختياري غير مطلوب حسب الطلب الحالي)
        });

        sliderContainer.addEventListener('mouseup', (e) => {
            if (!mouseDown) return;
            let mouseEndX = e.clientX;
            let diff = mouseEndX - mouseStartX;
            const threshold = 50;
            if (diff > threshold) {
                prevSlide();
            } else if (diff < -threshold) {
                nextSlide();
            }
            mouseDown = false;
            startAutoSlide();
        });

        sliderContainer.addEventListener('mouseleave', () => {
            mouseDown = false;
            // لا تبدأ أو توقف السلايد حتى الإفلات
        });

    }

    // فتح صفحة تفاصيل المحتوى عند الضغط على البطاقة ما عدا زر التشغيل
    document.querySelectorAll('.movie-card, .series-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.closest('.play-btn')) {
                const contentId = this.getAttribute('data-id');
                const contentType = this.getAttribute('data-type');
                window.location.href = `content.html?id=${contentId}&type=${contentType}`;
            }
        });
    });

    // المشغل (زر التشغيل الصغير)
    document.querySelectorAll('.play-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const contentId = this.getAttribute('data-id');
            const contentType = this.getAttribute('data-type');
            window.location.href = `content.html?id=${contentId}&type=${contentType}`;
        });
    });
});

/********************************************************************
 * إدارة تقدم شريط الدوت النشط - دوال بدء/توقيف/استئناف التحريك     *
 ********************************************************************/
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

    // يبدأ ممتلئ ثم يقل للـ 0% حسب الوقت المتبقي
    bar.style.transition = 'none';
    bar.style.width = '100%';
    void bar.offsetWidth;
    const durationMs = Math.max(0, remainingTime || slideDuration);
    bar.style.transition = `width ${durationMs}ms linear`;
    bar.style.width = '0%';
}

function pauseDotProgress() {
    const activeDot = document.querySelector('.dot.active');
    if (!activeDot) return;
    const bar = activeDot.querySelector('.progress');
    if (!bar) return;
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
    void bar.offsetWidth;
    const durationMs = Math.max(0, remainingTime || slideDuration);
    bar.style.transition = `width ${durationMs}ms linear`;
    bar.style.width = '0%';
}

/********************************************************************
 *        تحميل كافة الأفلام لجميع صفحات الأفلام (عرض الكل)           *
 ********************************************************************/
function loadAllMovies(movies) {
    const moviesGrid = document.querySelector('.movies-grid');
    if (!moviesGrid) return;
    moviesGrid.innerHTML = '';

    // ترتيب الأفلام حسب ID تنازلي
    const sortedMovies = [...movies].sort((a, b) => b.id - a.id);

    sortedMovies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.setAttribute('data-id', movie.id);
        card.setAttribute('data-type', 'movie');
        card.innerHTML = `
            <div class="type-indicator movie">فيلم</div>
            <img src="${movie.image}" alt="${movie.title}">
            <h3 class="movie-name">movie</h3>
            <div class="movie-info">
                <h3>${movie.title}</h3>
                <div class="movie-details">
                    <div class="rating">
                        <i class="fas fa-star"></i>
                        <span>${movie.rating}</span>
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

/********************************************************************
 *     تحميل كافة المسلسلات لجميع صفحات المسلسلات (عرض الكل)          *
 ********************************************************************/
function loadAllSeries(series) {
    const seriesGrid = document.querySelector('.series-grid');
    if (!seriesGrid) return;
    seriesGrid.innerHTML = '';

    // ترتيب المسلسلات حسب ID تنازلي
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
            <h3 class="series-name">Series</h3>
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

/********************************************************************
 *                تهيئة أزرار التنقل للشبكات                        *
 ********************************************************************/
function initializeGridNavigation() {
    // إضافة مستمعي الأحداث لأزرار التنقل
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetSelector = this.getAttribute('data-target');
            const grid = document.querySelector(targetSelector);
            if (!grid) return;

            const isNext = this.classList.contains('next-btn-grid');
            const scrollAmount = 1000; // مقدار التمرير بالبكسل (تمت زيادته)
            
            // إضافة تأثير بصري عند النقر
            this.style.transform = 'translateY(-50%) scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'translateY(-50%) scale(1)';
            }, 150);
            
            if (isNext) {
                grid.scrollBy({
                    left: scrollAmount,
                    behavior: 'smooth'
                });
            } else {
                grid.scrollBy({
                    left: -scrollAmount,
                    behavior: 'smooth'
                });
            }
        });
    });

    // إظهار/إخفاء أزرار التنقل حسب موضع التمرير
    document.querySelectorAll('.best-rated-grid, .movies-grid, .popular-movies-grid, .series-grid, .popular-series-grid, .latest-episodes-grid, .similar-grid').forEach(grid => {
        // بداية: جعل زر السابق غير نشط عند بدء التشغيل فقط
        const container = grid.closest('.grid-container');
        if (container) {
            const prevBtn = container.querySelector('.prev-btn-grid');
            if (prevBtn) {
                prevBtn.style.opacity = '0.5';
                prevBtn.style.pointerEvents = 'none';
            }
        }
        // نهاية: زر السابق فقط

        grid.addEventListener('scroll', function() {
            const container = this.closest('.grid-container');
            if (!container) return;
            
            const prevBtn = container.querySelector('.prev-btn-grid');
            const nextBtn = container.querySelector('.next-btn-grid');
            
            if (prevBtn && nextBtn) {
                // إظهار/إخفاء زر السابق
                if (this.scrollLeft <= 10) {
                    prevBtn.style.opacity = '0.5';
                    prevBtn.style.pointerEvents = 'none';
                } else {
                    prevBtn.style.opacity = '1';
                    prevBtn.style.pointerEvents = 'auto';
                }
                
                // إظهار/إخفاء زر التالي
                if (this.scrollLeft >= this.scrollWidth - this.clientWidth - 10) {
                    nextBtn.style.opacity = '0.5';
                    nextBtn.style.pointerEvents = 'none';
                } else {
                    nextBtn.style.opacity = '1';
                    nextBtn.style.pointerEvents = 'auto';
                }
            }
        });
    });
}
