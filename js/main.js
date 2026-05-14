/* ================== 安全获取 DOM（✅ 防 null） ================== */
const $ = (selector) => document.querySelector(selector);

const buttons = $$(".filter-bar button");
const gallery = $("#gallery");
const lightbox = $("#lightbox");
const lbImg = $("#lightbox-img");
const lbTitle = $("#lightbox-title");

const uploadBtn = $("#uploadBtn");
const uploadInput = $("#uploadInput");
const dropZone = $("#dropZone");
const progressContainer = $("#progressContainer");
const progressBar = $("#progressBar");

/* ================== 数据层 ================== */
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

/* ================== 自动分类 ================== */
function autoDetectCategory(file) {
    const name = file.name.toLowerCase();
    if (name.includes("mountain") || name.includes("shan")) return "mountain";
    if (name.includes("ocean") || name.includes("sea") || name.includes("hai")) return "ocean";
    if (name.includes("forest") || name.includes("tree") || name.includes("lin")) return "forest";
    if (name.includes("animal") || name.includes("dog") || name.includes("cat")) return "animal";
    return "other";
}

/* ================== 渲染画廊 ================== */
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
                    deletePhoto(i);
                    renderGallery(filter);
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

/* ================== 删除 ================== */
function deletePhoto(index) {
    const photos = getPhotos();
    photos.splice(index, 1);
    savePhotos(photos);
}

/* ================== 分类筛选 ================== */
buttons?.forEach(btn => {
    btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderGallery(btn.dataset.filter);
    });
});

/* ================== 灯箱关闭 ================== */
lightbox?.querySelector(".close")?.addEventListener("click", () => {
    lightbox.style.display = "none";
});
lightbox?.addEventListener("click", e => {
    if (e.target === lightbox) lightbox.style.display = "none";
});

/* ================== 核心：处理文件（✅ 防 null） ================== */
function handleFiles(files) {
    if (!files || !files.length) return;

    const photos = getPhotos();
    const fileArray = Array.from(files);

    if (progressContainer) progressContainer.style.display = "block";
    if (progressBar) progressBar.style.width = "0%";

    const readers = fileArray.map((file, index) => {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onprogress = (e) => {
                if (e.lengthComputable && progressBar) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    const totalPercent = ((index + percent / 100) / fileArray.length) * 100;
                    progressBar.style.width = `${totalPercent}%`;
                }
            };
            reader.onload = () => resolve({
                src: reader.result,
                title: file.name.split(".")[0],
                category: autoDetectCategory(file)
            });
            reader.readAsDataURL(file);
        });
    });

    Promise.all(readers).then(results => {
        photos.unshift(...results);
        savePhotos(photos);
        renderGallery("all");

        // ✅ 彻底修复 null
        if (uploadInput) uploadInput.value = "";
        if (progressContainer) progressContainer.style.display = "none";
        if (progressBar) progressBar.style.width = "0%";
    });
}

/* ================== 上传逻辑（✅ 只绑定一次） ================== */
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

/* ================== 初始化 ================== */
renderGallery("all");