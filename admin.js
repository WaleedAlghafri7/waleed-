// دالة إضافة فيلم جديد
async function addMovie(movieData) {
    try {
        // جلب البيانات الحالية
        const response = await fetch('data.json');
        const data = await response.json();
        
        // إيجاد أكبر id موجود
        const maxId = Math.max(...data.movies.map(movie => movie.id), 0);
        
        // إنشاء فيلم جديد مع id جديد
        const newMovie = {
            id: maxId + 1,
            ...movieData
        };
        
        // إضافة الفيلم للمصفوفة
        data.movies.push(newMovie);
        
        // حفظ البيانات
        await saveData(data);
        
        // تحديث العرض
        displayMovies(data.movies);
        
        return true;
    } catch (error) {
        console.error('Error adding movie:', error);
        return false;
    }
}

// دالة إضافة مسلسل جديد
async function addSeries(seriesData) {
    try {
        // جلب البيانات الحالية
        const response = await fetch('data.json');
        const data = await response.json();
        
        // إيجاد أكبر id موجود
        const maxId = Math.max(...data.series.map(series => series.id), 0);
        
        // إنشاء مسلسل جديد مع id جديد
        const newSeries = {
            id: maxId + 1,
            ...seriesData
        };
        
        // إضافة المسلسل للمصفوفة
        data.series.push(newSeries);
        
        // حفظ البيانات
        await saveData(data);
        
        // تحديث العرض
        displaySeries(data.series);
        
        return true;
    } catch (error) {
        console.error('Error adding series:', error);
        return false;
    }
} 