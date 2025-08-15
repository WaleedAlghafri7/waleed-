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
        const getFullDate = (item) => {
            // أولوية للتاريخ الكامل (releaseDate)
            if (item.releaseDate) {
                const date = new Date(item.releaseDate);
                if (!isNaN(date.getTime())) return date;
            }
            
            // إذا لم يكن هناك تاريخ كامل، استخدم السنة
            if (item.year) {
                const year = typeof item.year === 'string' ? parseInt(item.year.slice(0, 4), 10) : item.year;
                if (!isNaN(year)) return new Date(year, 0, 1);
            }
            
            // إذا لم يكن هناك تاريخ، استخدم تاريخ الإضافة
            if (item.addedDate) {
                const date = new Date(item.addedDate);
                if (!isNaN(date.getTime())) return date;
            }
            
            // إذا لم يكن هناك أي تاريخ، استخدم تاريخ قديم جداً
            return new Date(0);
        };
        
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
                    return getFullDate(b) - getFullDate(a);
                case 'year-asc':
                    return getFullDate(a) - getFullDate(b);
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
        const getFullDate = (item) => {
            // أولوية للتاريخ الكامل (releaseDate)
            if (item.releaseDate) {
                const date = new Date(item.releaseDate);
                if (!isNaN(date.getTime())) return date;
            }
            
            // إذا لم يكن هناك تاريخ كامل، استخدم السنة
            if (item.year) {
                const year = typeof item.year === 'string' ? parseInt(item.year.slice(0, 4), 10) : item.year;
                if (!isNaN(year)) return new Date(year, 0, 1);
            }
            
            // إذا لم يكن هناك تاريخ، استخدم تاريخ الإضافة
            if (item.addedDate) {
                const date = new Date(item.addedDate);
                if (!isNaN(date.getTime())) return date;
            }
            
            // إذا لم يكن هناك أي تاريخ، استخدم تاريخ قديم جداً
            return new Date(0);
        };
        
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
                    return getFullDate(b) - getFullDate(a);
                case 'year-asc':
                    return getFullDate(a) - getFullDate(b);
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

    // أفضل 3 أفلام حسب التقييم
    getTopRatedMovies(count = 6) {
        return this.sortMovies(this.movies, 'rating-desc').slice(0, count);
    }

    // أفضل 3 مسلسلات حسب التقييم
    getTopRatedSeries(count = 6) {
        return this.sortSeries(this.series, 'rating-desc').slice(0, count);
    }

    // آخر الحلقات المضافة (من جميع المسلسلات)
    getLatestEpisodes(count = 6) {
        const episodes = [];
        const now = new Date();
        this.series.forEach(series => {
            if (series.seasons && Array.isArray(series.seasons)) {
                series.seasons.forEach(season => {
                    // دعم بنية الحلقات مباشرة أو داخل أجزاء
                    if (season.episodes && Array.isArray(season.episodes)) {
                        season.episodes.forEach(ep => {
                            if (ep.addedDate && new Date(ep.addedDate) <= now) {
                                episodes.push({
                                    ...ep,
                                    seriesId: series.id,
                                    seriesTitle: series.title,
                                    seasonNumber: season.season_number
                                });
                            }
                        });
                    }
                    if (season.parts && Array.isArray(season.parts)) {
                        season.parts.forEach(part => {
                            if (part.episodes && Array.isArray(part.episodes)) {
                                part.episodes.forEach(ep => {
                                    if (ep.addedDate && new Date(ep.addedDate) <= now) {
                                        episodes.push({
                                            ...ep,
                                            seriesId: series.id,
                                            seriesTitle: series.title,
                                            seasonNumber: season.season_number,
                                            partNumber: part.part_number
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
        // ترتيب حسب تاريخ الإضافة (addedDate) تنازلياً
        episodes.sort((a, b) => {
            if (!a.addedDate) return 1;
            if (!b.addedDate) return -1;
            return new Date(b.addedDate) - new Date(a.addedDate);
        });
        return episodes.slice(0, count);
    }
} 