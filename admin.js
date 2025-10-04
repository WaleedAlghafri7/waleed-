(() => {
    const API_BASE = 'http://127.0.0.1:5000';
    const SAVE_URL = API_BASE + '/save_data';
    let data = { movies: [], series: [], featured: [] };

    function showNotification(message, success = true) {
        const el = document.getElementById('saveNotification');
        el.textContent = message || (success ? 'Saved' : 'Failed');
        el.style.background = success ? '#27ae60' : '#e74c3c';
        el.style.display = 'block';
        setTimeout(() => el.style.opacity = '1', 10);
        setTimeout(() => {
            el.style.opacity = '0';
            setTimeout(() => el.style.display = 'none', 300);
        }, 2200);
    }

    function getYear(v) {
        if (v == null) return '';
        const s = String(v);
        return s.slice(0, 4);
    }

    async function fetchData() {
        let apiErr = null;
        try {
            const res = await fetch(API_BASE + '/data?t=' + Date.now());
            if (!res.ok) {
                let body = '';
                try { body = await res.text(); } catch (e) { body = String(e); }
                throw new Error(`API failed: ${res.status} ${res.statusText} ${body}`);
            }
            data = await res.json();
        } catch (err1) {
            apiErr = err1;
            try {
                const res2 = await fetch('data.json?t=' + Date.now());
                if (!res2.ok) {
                    let body2 = '';
                    try { body2 = await res2.text(); } catch (e) { body2 = String(e); }
                    throw new Error(`file failed: ${res2.status} ${res2.statusText} ${body2}`);
                }
                data = await res2.json();
            } catch (err2) {
                alert('فشل تحميل البيانات!\n\n' + [
                    `API=${API_BASE}/data`,
                    `apiErr=${apiErr && apiErr.message ? apiErr.message : apiErr}`,
                    `fileErr=${err2 && err2.message ? err2.message : err2}`
                ].join('\n'));
                throw err2;
            }
        }

        data.movies = data.movies || [];
        data.series = data.series || [];
        data.featured = data.featured || [];
        renderAll();
    }

    function renderAll() {
        renderMovies();
        renderSeries();
        renderSlidesAll();
        renderSlidesCurrent();
        updateSlidesCounter();
    }

    function toEpoch(it) {
        try {
            if (typeof it?.id === 'number' && it.id > 1e11) return it.id;
            if (it?.releaseDate) {
                const t = Date.parse(String(it.releaseDate));
                if (!isNaN(t)) return t;
            }
            if (it?.year) {
                const y = String(it.year).slice(0, 4);
                if (/^\d{4}$/.test(y)) return Date.parse(y + '-01-01');
            }
        } catch (e) {}
        return 0;
    }
    const sortNewest = (a, b) => toEpoch(b) - toEpoch(a);

    function renderMovies() {
        const tbody = document.querySelector('#moviesTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        [...(data.movies || [])].sort(sortNewest).forEach(m => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="img-cell"><img src="${m.image || '13434998.png'}" onerror="this.onerror=null;this.src='13434998.png';"></td>
                <td>${m.title || ''}</td>
                <td>${m.genre || ''}</td>
                <td>${getYear(m.year)}</td>
                <td>${m.rating || ''}</td>
                <td>${m.duration || ''}</td>
                <td>
                    <button class="action-btn" onclick="openModal('movie', ${m.id})">Edit</button>
                    <button class="action-btn delete" onclick="deleteItem('movie', ${m.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderSeries() {
        const tbody = document.querySelector('#seriesTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        [...(data.series || [])].sort(sortNewest).forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="img-cell"><img src="${s.image || '13434998.png'}" onerror="this.onerror=null;this.src='13434998.png';"></td>
                <td>${s.title || ''}</td>
                <td>${s.genre || ''}</td>
                <td>${getYear(s.year)}</td>
                <td>${s.status || ''}</td>
                <td>${s.rating || ''}</td>
                <td>${s.duration || ''}</td>
                <td>
                    <button class="action-btn" onclick="openModal('series', ${s.id})">Edit</button>
                    <button class="action-btn delete" onclick="deleteItem('series', ${s.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderSlidesAll() {
        const tbody = document.querySelector('#slidesAllTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        const all = [
            ...(data.movies || []).map(x => ({ ...x, _type: 'movie' })),
            ...(data.series || []).map(x => ({ ...x, _type: 'series' }))
        ].sort(sortNewest);
        const featuredKey = new Set((data.featured || []).map(f => `${f.type}:${f.id}`));
        all.forEach(item => {
            const tr = document.createElement('tr');
            const isChecked = featuredKey.has(`${item._type}:${item.id}`);
            tr.innerHTML = `
                <td class="img-cell"><img src="${item.image || '13434998.png'}" onerror="this.onerror=null;this.src='13434998.png';"></td>
                <td>${item.title || ''}</td>
                <td>${item._type}</td>
                <td>${getYear(item.year)}</td>
                <td>${item.rating || ''}</td>
                <td><input type="checkbox" class="slide-checkbox" data-type="${item._type}" data-id="${item.id}" ${isChecked ? 'checked' : ''}></td>
            `;
            tbody.appendChild(tr);
        });
        tbody.querySelectorAll('.slide-checkbox').forEach(cb => cb.addEventListener('change', updateSlidesCounter));
    }

    function renderSlidesCurrent() {
        const tbody = document.querySelector('#slidesCurrentTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        [...(data.featured || [])].sort(sortNewest).forEach(f => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="img-cell"><img src="${f.image || '13434998.png'}" onerror="this.onerror=null;this.src='13434998.png';"></td>
                <td>${f.title || ''}</td>
                <td>${f.type || ''}</td>
                <td style="max-width:420px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${f.backdrop || ''}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function updateSlidesCounter() {
        const cbs = Array.from(document.querySelectorAll('.slide-checkbox'));
        const count = cbs.filter(cb => cb.checked).length;
        const el = document.getElementById('slidesCounter');
        if (el) el.textContent = `(${count} selected)`;
    }

    async function saveSlides() {
        // Build featured list with required fields only
        const cbs = Array.from(document.querySelectorAll('.slide-checkbox'));
        // sort selected by newest before building result
        const selected = cbs
            .filter(cb => cb.checked)
            .map(cb => ({ id: Number(cb.dataset.id), type: cb.dataset.type }))
            .map(sel => ({
                sel,
                src: (sel.type === 'movie' ? data.movies : data.series).find(i => String(i.id) === String(sel.id))
            }))
            .filter(x => !!x.src)
            .sort((a,b) => sortNewest(a.src, b.src))
            .map(x => x.sel);

        const result = [];
        for (const sel of selected) {
            const src = (sel.type === 'movie' ? data.movies : data.series).find(i => String(i.id) === String(sel.id));
            if (!src) continue;
            if (sel.type === 'movie') {
                result.push({
                    type: 'movie',
                    id: src.id,
                    title: src.title,
                    backdrop: src.backdrop,
                    description: src.description,
                    image: src.image
                });
            } else {
                const seasons = Array.isArray(src.seasons) ? src.seasons.map((s, idx) => {
                    const n = (s && (s.seasonNumber || s.number || s.season || s.index)) ?? (idx + 1);
                    const parsed = Number(n);
                    return Number.isFinite(parsed) ? parsed : (idx + 1);
                }) : [];
                result.push({
                    type: 'series',
                    seasons,
                    id: src.id,
                    title: src.title,
                    backdrop: src.backdrop,
                    description: src.description,
                    image: src.image
                });
            }
        }
        try {
            const res = await fetch(SAVE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'featured', action: 'featured_update', item: result })
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
            }
            await fetchData();
            showNotification('Slides saved');
        } catch (err) {
            console.error(err);
            showNotification('Failed to save slides: ' + (err && err.message ? err.message : err), false);
        }
    }

    // Wire Save button
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'slidesSaveBtn') {
            saveSlides();
        }
        if (e.target && e.target.id === 'slidesClearBtn') {
            const cbs = Array.from(document.querySelectorAll('.slide-checkbox'));
            if (cbs.length) {
                cbs.forEach(cb => cb.checked = false);
                updateSlidesCounter();
                return;
            }
            // grid card mode fallback
            const cards = Array.from(document.querySelectorAll('.slide-card'));
            cards.forEach(card => card.classList.remove('selected'));
            updateSlidesCounter();
        }
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
            if (btn.dataset.tab === 'slides') {
                renderSlidesAll();
                renderSlidesCurrent();
                updateSlidesCounter();
            }
        });
    });

    // Expose minimal global handlers used in HTML (stubs for future)
    window.openModal = function(type, id) { alert('Stub: open ' + type + ' id=' + id); };
    window.deleteItem = async function(type, id) {
        try {
            const res = await fetch(SAVE_URL, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, action: 'delete', item: Number(id) })
            });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            await fetchData();
            showNotification('Deleted');
        } catch (e) {
            showNotification('Delete failed: ' + (e && e.message ? e.message : e), false);
        }
    };

    // Kick off
    fetchData();
})();


