/* ================== DOM 元素 ================== */
const buttons = document.querySelectorAll(".filter-bar button");
const lightbox = document.getElementById("lightbox");
const lbImg = lightbox.querySelector("img");
const lbTitle = document.getElementById("lightbox-title");

const uploadInput = document.getElementById("uploadInput");
const uploadBtn = document.getElementById("uploadBtn");
const gallery = document.getElementById("gallery");

/* ================== 数据层 ================== */
const STORAGE_KEY = "photos";

function getPhotos() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
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
    gallery.innerHTML = "";
    const photos = getPhotos();

    photos
        .filter(p => filter === "all" || p.category === filter)
        .forEach((p, i) => {
            const item = document.createElement("figure");
            item.className = "item";
            item.dataset.category = p.category;

            item.innerHTML = `
                <button class="delete-btn">&times;</button>
                <img src="${p.src}" />
                <div class="overlay">
                    <h3>${p.title}</h3>
                </div>
            `;

            // 删除
            item.querySelector(".delete-btn").addEventListener("click", e => {
                e.stopPropagation();
                if (confirm("确定要删除这张作品吗？")) {
                    deletePhoto(i);
                    renderGallery(filter);
                }
            });

            // 灯箱
            item.querySelector("img").addEventListener("click", () => {
                lbImg.src = p.src;
                lbTitle.innerText = p.title;
                lightbox.style.display = "flex";
            });

            gallery.appendChild(item);
        });
}

/* ================== 删除逻辑 ================== */
function deletePhoto(index) {
    const photos = getPhotos();
    photos.splice(index, 1);
    savePhotos(photos);
}

/* ================== 分类筛选 ================== */
buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderGallery(btn.dataset.filter);
    });
});

/* ================== 灯箱关闭 ================== */
lightbox.querySelector(".close").addEventListener("click", () => {
    lightbox.style.display = "none";
});
lightbox.addEventListener("click", e => {
    if (e.target === lightbox) {
        lightbox.style.display = "none";
    }
});

/* ================== 上传逻辑（✅ 修复版） ================== */
uploadBtn.addEventListener("click", () => uploadInput.click());

uploadInput.addEventListener("change", e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const photos = getPhotos();

    const readers = files.map(file => {
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => {
                resolve({
                    src: reader.result,
                    title: file.name.split(".")[0],
                    category: autoDetectCategory(file)
                });
            };
            reader.readAsDataURL(file);
        });
    });

    Promise.all(readers).then(results => {
        photos.unshift(...results);
        savePhotos(photos);
        renderGallery("all");
        uploadInput.value = ""; // ✅ 关键：清空 input
    });
});

/* ================== 初始化 ================== */
renderGallery("all");