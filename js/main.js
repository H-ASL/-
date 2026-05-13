const gallery = document.getElementById("gallery");
const filterBar = document.querySelector(".filter-bar");
const lightbox = document.getElementById("lightbox");
const lightboxImg = lightbox.querySelector("img");
const lightboxTitle = document.getElementById("lightboxTitle");

const uploadInput = document.getElementById("uploadInput");
const uploadBtn = document.getElementById("uploadBtn");
const categorySelect = document.getElementById("categorySelect");

const STORAGE_KEY = "photo_portfolio";

// ========= 数据 =========
function getPhotos() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function savePhotos(photos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
}

// ========= 渲染 =========
function renderGallery(filter = "all") {
    gallery.innerHTML = "";
    const photos = getPhotos();

    photos
        .filter(p => filter === "all" || p.category === filter)
        .forEach(p => {
            const item = document.createElement("figure");
            item.className = "item";
            item.dataset.category = p.category;

            item.innerHTML = `
                <img src="${p.src}" />
                <div class="overlay">
                    <h3>${p.title}</h3>
                </div>
            `;

            item.addEventListener("click", () => {
                lightboxImg.src = p.src;
                lightboxTitle.textContent = p.title;
                lightbox.style.display = "flex";
            });

            gallery.appendChild(item);
        });
}

// ========= 分类筛选 =========
filterBar.addEventListener("click", e => {
    if (e.target.tagName !== "BUTTON") return;

    filterBar.querySelector(".active").classList.remove("active");
    e.target.classList.add("active");

    renderGallery(e.target.dataset.filter);
});

// ========= 上传 =========
uploadBtn.addEventListener("click", () => uploadInput.click());

uploadInput.addEventListener("change", e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const photos = getPhotos();
    const category = categorySelect.value;

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
            photos.unshift({
                src: reader.result,
                title: file.name.split(".")[0],
                category
            });
        };
        reader.readAsDataURL(file);
    });

    setTimeout(() => {
        savePhotos(photos);
        renderGallery(
            filterBar.querySelector(".active").dataset.filter
        );
    }, 100);
});

// ========= 灯箱关闭 =========
lightbox.querySelector(".close").addEventListener("click", () => {
    lightbox.style.display = "none";
});

lightbox.addEventListener("click", e => {
    if (e.target === lightbox) {
        lightbox.style.display = "none";
    }
});

// ========= 初始化 =========
renderGallery();