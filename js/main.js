// ================== DOM 元素 ==================
const gallery = document.getElementById('gallery');
const filterBar = document.querySelector('.filter-bar');
const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox.querySelector('img');
const lightboxTitle = document.getElementById('lightbox-title');
const uploadInput = document.getElementById('uploadInput');
const uploadBtn = document.getElementById('uploadBtn');
const categorySelect = document.getElementById('categorySelect');

// ================== 数据层 (模拟后端) ==================
// 使用 localStorage 持久化数据
const STORAGE_KEY = 'photo_community_data';

function getPhotos() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function savePhotos(photos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
}

// ================== 渲染逻辑 ==================
function renderGallery(filter = 'all') {
    gallery.innerHTML = ''; // 清空画布
    const photos = getPhotos();

    photos
        .filter(p => filter === 'all' || p.category === filter)
        .forEach(photo => {
            const item = document.createElement('figure');
            item.className = 'item';
            item.dataset.category = photo.category;
            
            item.innerHTML = `
                <img src="${photo.src}" alt="${photo.title}">
                <div class="overlay">
                    <h3>${photo.title}</h3>
                </div>
            `;
            
            // 点击图片打开灯箱
            item.addEventListener('click', () => {
                lightboxImg.src = photo.src;
                lightboxTitle.textContent = photo.title;
                lightbox.style.display = 'flex';
            });

            gallery.appendChild(item);
        });
}

// ================== 事件绑定 ==================
// 1. 分类筛选
filterBar.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') return;
    
    filterBar.querySelector('.active').classList.remove('active');
    e.target.classList.add('active');
    
    const filter = e.target.dataset.filter;
    renderGallery(filter);
});

// 2. 上传功能
uploadBtn.addEventListener('click', () => uploadInput.click());

uploadInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const photos = getPhotos();
    const category = categorySelect.value;

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            photos.unshift({
                src: event.target.result,
                title: file.name.split('.')[0], // 使用文件名作为标题
                category: category
            });
        };
        reader.readAsDataURL(file);
    });
    
    // 等待所有文件读取完毕再保存和渲染
    setTimeout(() => {
        savePhotos(photos);
        renderGallery(document.querySelector('.filter-bar .active').dataset.filter);
    }, 100);
});

// 3. 灯箱关闭
lightbox.querySelector('.close').addEventListener('click', () => {
    lightbox.style.display = 'none';
});
lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
        lightbox.style.display = 'none';
    }
});

// ================== 初始化 ==================
renderGallery();