// كلاس السلايدر الرئيسي
// من وين يجيب معلومات السلايدات؟
// السلايدر لا يجلب البيانات بنفسه، بل يستقبلها من الخارج عبر دالة updateSlides(items)
// أي: أنت (المبرمج) تجيب بيانات السلايدات (مثلاً من API أو ثابت محلي) ثم تنادي updateSlides
// مثال استخدام:
// const slider = new Slider(containerElement, options);
// fetch('api/slides.json').then(res => res.json()).then(data => slider.updateSlides(data));

class Slider {
    constructor(container, options = {}) {
        this.container = container;
        this.slides = [];
        this.currentIndex = 0;
        this.isAnimating = false;
        this.autoplayInterval = null;
        this.touchStartX = 0;
        this.touchEndX = 0;

        this.options = {
            autoplay: true,
            autoplaySpeed: 5000,
            transitionSpeed: 800,
            showDots: true,
            showArrows: true,
            loop: true,
            pauseOnHover: true,
            swipeThreshold: 50,
            ...options
        };

        this.init();
    }

    init() {
        this.createSliderStructure();
        this.addEventListeners();
    }

    createSliderStructure() {
        this.slider = document.createElement('div');
        this.slider.className = 'slider';
        this.container.appendChild(this.slider);

        if (this.options.showArrows) {
            this.createNavigationButtons();
        }

        if (this.options.showDots) {
            this.createDots();
        }
    }

    createNavigationButtons() {
        this.prevBtn = document.createElement('button');
        this.prevBtn.className = 'slider-nav prev-btn';
        this.prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        this.prevBtn.setAttribute('aria-label', 'السلايد السابق');
        this.container.appendChild(this.prevBtn);

        this.nextBtn = document.createElement('button');
        this.nextBtn.className = 'slider-nav next-btn';
        this.nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        this.nextBtn.setAttribute('aria-label', 'السلايد التالي');
        this.container.appendChild(this.nextBtn);
    }

    createDots() {
        this.dotsContainer = document.createElement('div');
        this.dotsContainer.className = 'slider-dots';
        this.dotsContainer.setAttribute('role', 'tablist');
        this.container.appendChild(this.dotsContainer);
    }

    addEventListeners() {
        if (this.options.showArrows) {
            this.prevBtn.addEventListener('click', () => this.prev());
            this.nextBtn.addEventListener('click', () => this.next());
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.prev();
            if (e.key === 'ArrowRight') this.next();
        });

        this.container.addEventListener('touchstart', (e) => {
            this.touchStartX = e.changedTouches[0].screenX;
        });

        this.container.addEventListener('touchend', (e) => {
            this.touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });

        if (this.options.pauseOnHover) {
            this.container.addEventListener('mouseenter', () => this.stopAutoplay());
            this.container.addEventListener('mouseleave', () => {
                if (this.options.autoplay) this.startAutoplay();
            });
        }
    }

    // هنا يتم تزويد السلايدر بالبيانات من الخارج
    updateSlides(items) {
        this.slides = items;
        this.slider.innerHTML = '';
        if (this.options.showDots) {
            this.dotsContainer.innerHTML = '';
        }

        this.slides.forEach((item, index) => {
            const slide = this.createSlide(item, index);
            this.slider.appendChild(slide);
        });

        if (this.options.showDots) {
            this.createDots();
        }

        if (this.options.autoplay) {
            this.startAutoplay();
        }
    }

    createSlide(item, index) {
        const slide = document.createElement('div');
        slide.className = `slide ${index === 0 ? 'active' : ''}`;
        slide.setAttribute('role', 'tabpanel');
        slide.setAttribute('aria-hidden', index !== 0);

        const stars = this.createStars(item.popularity || 0);

        slide.innerHTML = `
            <div class="slide-inner">
                <img src="${item.image}" alt="${item.title}" loading="${index === 0 ? 'eager' : 'lazy'}">
                <div class="slide-content">
                    <h2>${item.title}</h2>
                    <div class="genre">${item.genre}</div>
                    <div class="popularity">
                        <span class="popularity-label">الشهرة:</span>
                        <div class="stars">${stars}</div>
                        <span class="popularity-value">${item.popularity || 0}%</span>
                    </div>
                    <p class="description">${item.description || ''}</p>

                </div>
            </div>
        `;

        slide.addEventListener('click', () => {
            if (this.options.onSlideClick) {
                this.options.onSlideClick(item);
            }
        });

        return slide;
    }

    createStars(popularity) {
        const fullStars = Math.floor(popularity / 20);
        const halfStar = popularity % 20 >= 10;
        let stars = '';

        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (halfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        return stars;
    }

    createDots() {
        this.slides.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = `dot ${index === 0 ? 'active' : ''}`;
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-selected', index === 0);
            dot.setAttribute('aria-label', `انتقل إلى السلايد ${index + 1}`);

            dot.addEventListener('click', () => {
                this.stopAutoplay();
                this.goTo(index);
                if (this.options.autoplay) {
                    this.startAutoplay();
                }
            });

            this.dotsContainer.appendChild(dot);
        });
    }

    prev() {
        if (!this.isAnimating) {
            this.goTo(this.currentIndex - 1, 'prev');
        }
    }

    next() {
        if (!this.isAnimating) {
            this.goTo(this.currentIndex + 1, 'next');
        }
    }

    goTo(index, direction = 'next') {
        if (this.isAnimating) return;
        this.isAnimating = true;

        if (index < 0) {
            index = this.slides.length - 1;
            direction = 'prev';
        } else if (index >= this.slides.length) {
            index = 0;
            direction = 'next';
        }

        const slides = this.slider.querySelectorAll('.slide');
        const currentSlide = slides[this.currentIndex];
        const nextSlide = slides[index];

        this.applyTransition(currentSlide, nextSlide, direction);
        this.updateDots(index);
        this.currentIndex = index;

        if (this.options.autoplay) {
            this.restartAutoplay();
        }

        setTimeout(() => {
            this.isAnimating = false;
            this.resetTransition(currentSlide, nextSlide);
        }, this.options.transitionSpeed);
    }

    applyTransition(currentSlide, nextSlide, direction) {
        const transition = `transform ${this.options.transitionSpeed}ms ease-in-out, opacity ${this.options.transitionSpeed}ms ease-in-out`;

        currentSlide.style.transition = transition;
        nextSlide.style.transition = transition;

        if (direction === 'next') {
            currentSlide.style.transform = 'translateX(-100%)';
            currentSlide.style.opacity = '0';
            nextSlide.style.transform = 'translateX(0)';
            nextSlide.style.opacity = '1';
        } else {
            currentSlide.style.transform = 'translateX(100%)';
            currentSlide.style.opacity = '0';
            nextSlide.style.transform = 'translateX(0)';
            nextSlide.style.opacity = '1';
        }

        currentSlide.setAttribute('aria-hidden', 'true');
        nextSlide.setAttribute('aria-hidden', 'false');
    }

    resetTransition(currentSlide, nextSlide) {
        currentSlide.style.transition = '';
        nextSlide.style.transition = '';
    }

    updateDots(index) {
        if (this.options.showDots) {
            const dots = this.dotsContainer.querySelectorAll('.dot');
            dots[this.currentIndex].classList.remove('active');
            dots[this.currentIndex].setAttribute('aria-selected', 'false');
            dots[index].classList.add('active');
            dots[index].setAttribute('aria-selected', 'true');
        }
    }

    startAutoplay() {
        if (this.autoplayInterval) clearInterval(this.autoplayInterval);
        this.autoplayInterval = setInterval(() => {
            if (this.currentIndex === this.slides.length - 1) {
                this.goTo(0, 'next');
            } else {
                this.next();
            }
        }, this.options.autoplaySpeed);
    }

    restartAutoplay() {
        if (this.autoplayInterval) clearInterval(this.autoplayInterval);
        this.startAutoplay();
    }

    stopAutoplay() {
        if (this.autoplayInterval) clearInterval(this.autoplayInterval);
    }

    handleSwipe() {
        const diff = this.touchStartX - this.touchEndX;
        if (Math.abs(diff) > this.options.swipeThreshold) {
            if (diff > 0) {
                this.next();
            } else {
                this.prev();
            }
        }
    }
}

export default Slider;