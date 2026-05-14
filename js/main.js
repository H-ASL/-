// ================== Supabase 初始化 ==================
const SUPABASE_URL = "https://photo-portfolio.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZ21rb2t6dWRwdmxkYWNlbm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MzQxNzMsImV4cCI6MjA5NDMxMDE3M30.Tjy65W0JlP0rrFvHlnqaE57G7tb0RDz_HnKvtXdOvzU";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// ================== DOM 元素 ==================
const $ = (selector) => document.querySelector(selector);

const buttons = document.querySelectorAll(".filter-bar button");
const gallery = $("#gallery");
const lightbox = $("#lightbox");
const lbImg = $("#lightbox-img");
const lbTitle = $("#lightbox-title");

const uploadBtn = $("#uploadBtn");
const uploadInput = $("#uploadInput");
const dropZone = $("#dropZone");
const progressContainer = $("#progressContainer");
const progressBar = $("#progressBar");

// ================== 数据层 ==================
const STORAGE_KEY = "photos";

function getPhotos() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function savePhotos(photos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
}

// ================== 自动分类 ==================
function autoDetectCategory(file) {
    const name = file.name.toLowerCase();
    if (name.includes("mountain") || name.includes("shan")) return "mountain";
    if (name.includes("ocean") || name.includes("sea") || name.includes("hai")) return "ocean";
    if (name.includes("forest") || name.includes("tree") || name.includes("lin")) return "forest";
    if (name.includes("animal") || name.includes("dog") || name.includes("cat")) return "animal";
    return "other";
}

// ================== 渲染画廊 ==================
function renderGallery(filter = "all") {
    if (!gallery) return;

    gallery.innerHTML = "";
    getPhotos()
        .filter(p => filter === "all" || p.category === filter)
        .forEach((p, i) => {
            const item = document.createElement("figure");
            item.className = "item";
            item.dataset.category = p.category;

            item.innerHTML = `
                <button class="delete-btn">&times;</button>
                <img src="${p.src}" />
                <div class="overlay"><h3>${p.title}</h3></div>
            `;

            item.querySelector(".delete-btn")?.addEventListener("click", e => {
                e.stopPropagation();
                if (confirm("确定要删除这张作品吗？")) {
                    deletePhoto(i, filter);
                }
            });

            item.querySelector("img")?.addEventListener("click", () => {
                if (lbImg) lbImg.src = p.src;
                if (lbTitle) lbTitle.innerText = p.title;
                if (lightbox) lightbox.style.display = "flex";
            });

            gallery.appendChild(item);
        });
}

// ================== 删除 ==================
function deletePhoto(index, currentFilter) {
    const photos = getPhotos();
    photos.splice(index, 1);
    savePhotos(photos);
    renderGallery(currentFilter);
}

// ================== 分类筛选 ==================
buttons?.forEach(btn => {
    btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderGallery(btn.dataset.filter);
    });
});

// ================== 灯箱关闭 ==================
lightbox?.querySelector(".close")?.addEventListener("click", () => {
    lightbox.style.display = "none";
});
lightbox?.addEventListener("click", e => {
    if (e.target === lightbox) lightbox.style.display = "none";
});

// ================== 核心：上传到 Supabase ==================
async function uploadToSupabase(file, category) {
    const fileName = `${Date.now()}_${file.name}`;

    const { data, error } = await supabase
        .storage
        .from('photos')
        .upload(fileName, file);

    if (error) {
        alert('上传失败：' + error.message);
        return;
    }

    const { data: urlData } = supabase
        .storage
        .from('photos')
        .getPublicUrl(data.path);

    const photos = getPhotos();
    photos.unshift({
        src: urlData.publicUrl, // ✅ 只存 URL
        title: file.name.split('.')[0],
        category
    });

    savePhotos(photos);
    renderGallery('all');
}

// ================== 处理文件（✅ 只绑定一次） ==================
function handleFiles(files) {
    if (!files || !files.length) return;

    const fileArray = Array.from(files);

    if (progressContainer) progressContainer.style.display = "block";
    if (progressBar) progressBar.style.width = "0%";

    // ✅ 逐个上传到 Supabase
    fileArray.forEach(async (file) => {
        await uploadToSupabase(file, autoDetectCategory(file));
    });

    if (uploadInput) uploadInput.value = "";
    if (progressContainer) progressContainer.style.display = "none";
    if (progressBar) progressBar.style.width = "0%";
}

// ================== 上传逻辑 ==================
if (uploadBtn) uploadBtn.addEventListener("click", () => uploadInput?.click());
if (uploadInput) uploadInput.addEventListener("change", (e) => handleFiles(e.target.files));

if (dropZone) {
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
    });
    dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        handleFiles(e.dataTransfer.files);
    });
}

// ================== 初始化 ==================
renderGallery("all");