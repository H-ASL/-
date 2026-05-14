/* ================== DOM 元素 ================== */
const buttons = document.querySelectorAll(".filter-bar button");
const lightbox = document.getElementById("lightbox");
const lbImg = lightbox.querySelector("img");
const lbTitle = document.getElementById("lightbox-title");

const uploadInput = document.getElementById("uploadInput");
const uploadBtn = document.getElementById("uploadBtn");
const gallery = document.getElementById("gallery");
const dropZone = document.getElementById("dropZone"); // 拖拽区
const progressContainer = document.getElementById("progressContainer"); // 进度条容器
const progressBar = document.getElementById("progressBar"); // 进度条

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

            // 删除按钮
            item.querySelector(".delete-btn").addEventListener("click", e => {
                e.stopPropagation();
                if (confirm("确定要删除这张作品吗？")) {
                    deletePhoto(i);
                    renderGallery(filter);
                }
            });

            // 灯箱预览
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

/* ================== 核心：处理文件（供选择和拖拽共用） ================== */
function handleFiles(files) {
    const photos = getPhotos();
    const fileArray = Array.from(files);
    if (!fileArray.length) return;

    // 显示进度条
    progressContainer.style.display = "block";
    progressBar.style.width = "0%";

    const readers = fileArray.map((file, index) => {
        return new Promise(resolve => {
            const reader = new FileReader();
            
            // ✅ 监听读取进度
            reader.onprogress = (e) => {
                if (e.lengthComputable) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    const totalPercent = ((index + percent / 100) / fileArray.length) * 100;
                    progressBar.style.width = `${totalPercent}%`;
                }
            };

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
        uploadInput.value = ""; // 清空 input

        // 完成后隐藏进度条
        setTimeout(() => {
            progressContainer.style.display = "none";
            progressBar.style.width = "0%";
        }, 500);
    });
}

/* ================== 上传逻辑（点击 + 拖拽） ================== */
uploadBtn.addEventListener("click", () => uploadInput.click());

// 点击选择
uploadInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
});

// 拖拽逻辑
dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    handleFiles(e.dataTransfer.files);
});

/* ================== 初始化 ================== */
renderGallery("all");