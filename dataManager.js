// إدارة البيانات والترتيب
export default class DataManager {
    constructor() {
        this.movies = [];
        this.series = [];
        this.loadData();
    }

    // تحميل البيانات
    async loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error('Failed to load data.json');
            }
            const data = await response.json();
            this.movies = data.movies || [];
            this.series = data.series || [];
            console.log('Data loaded successfully:', { movies: this.movies.length, series: this.series.length });
        } catch (error) {
            console.error('Error loading data:', error);
            // استخدام بيانات افتراضية في حالة فشل تحميل الملف
            this.movies = [];
            this.series = [];
        }
    }

    getMovieById(id) {
        return this.movies.find(movie => movie.id === id);
    }

    getSeriesById(id) {
        return this.series.find(series => series.id === id);
    }

    // ترتيب الأفلام
    sortMovies(movies, sortValue) {
        return [...movies].sort((a, b) => {
            switch (sortValue) {
                case 'id-desc':
                    return b.id - a.id;
                case 'id-asc':
                    return a.id - b.id;
                case 'rating-desc':
                    return (b.rating === '--' ? 0 : parseFloat(b.rating)) - (a.rating === '--' ? 0 : parseFloat(a.rating));
                case 'rating-asc':
                    return (a.rating === '--' ? 0 : parseFloat(a.rating)) - (b.rating === '--' ? 0 : parseFloat(b.rating));
                case 'year-desc':
                    return b.year - a.year;
                case 'year-asc':
                    return a.year - b.year;
                case 'title-asc':
                    return a.title.localeCompare(b.title);
                case 'title-desc':
                    return b.title.localeCompare(a.title);
                default:
                    return b.id - a.id; // الترتيب الافتراضي حسب ID تنازلياً
            }
        });
    }

    // ترتيب المسلسلات
    sortSeries(series, sortValue) {
        return [...series].sort((a, b) => {
            switch (sortValue) {
                case 'id-desc':
                    return b.id - a.id;
                case 'id-asc':
                    return a.id - b.id;
                case 'rating-desc':
                    return (b.rating === '--' ? 0 : parseFloat(b.rating)) - (a.rating === '--' ? 0 : parseFloat(a.rating));
                case 'rating-asc':
                    return (a.rating === '--' ? 0 : parseFloat(a.rating)) - (b.rating === '--' ? 0 : parseFloat(b.rating));
                case 'year-desc':
                    return b.year - a.year;
                case 'year-asc':
                    return a.year - b.year;
                case 'title-asc':
                    return a.title.localeCompare(b.title);
                case 'title-desc':
                    return b.title.localeCompare(a.title);
                case 'episodes-desc':
                    return b.episodes - a.episodes;
                case 'episodes-asc':
                    return a.episodes - b.episodes;
                default:
                    return b.id - a.id; // الترتيب الافتراضي حسب ID تنازلياً
            }
        });
    }

    // تصفية الأفلام حسب النوع
    filterMovies(movies, genre) {
        if (genre === 'all') return movies;
        return movies.filter(movie => 
            movie.genre.toLowerCase().includes(genre.toLowerCase())
        );
    }

    // تصفية المسلسلات حسب النوع والحالة
    filterSeries(series, genre, status) {
        let filtered = series;
        
        if (genre !== 'all') {
            filtered = filtered.filter(show => 
                show.genre.toLowerCase().includes(genre.toLowerCase())
            );
        }
        
        if (status !== 'all') {
            filtered = filtered.filter(show => show.status === status);
        }
        
        return filtered;
    }

    // البحث في الأفلام والمسلسلات
    searchContent(query) {
        query = query.toLowerCase();
        const movies = this.movies.filter(movie => 
            movie.title.toLowerCase().includes(query) ||
            movie.genre.toLowerCase().includes(query)
        );
        const series = this.series.filter(series => 
            series.title.toLowerCase().includes(query) ||
            series.genre.toLowerCase().includes(query)
        );
        return { movies, series };
    }

    // حفظ البيانات
    async saveData() {
        try {
            const data = {
                movies: this.movies,
                series: this.series
            };
            
            const response = await fetch('data.json', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('Failed to save data');
            }

            console.log('Data saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }
} 