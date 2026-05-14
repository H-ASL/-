const items = document.querySelectorAll(".item");
const buttons = document.querySelectorAll(".filter-bar button");
const lightbox = document.getElementById("lightbox");
const lbImg = lightbox.querySelector("img");
const lbTitle = document.getElementById("lightbox-title");

/* ===== 分类筛选 ===== */
buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const filter = btn.dataset.filter;

        items.forEach(item => {
            item.style.display =
                filter === "all" || item.dataset.category === filter
                ? "block"
                : "none";
        });
    });
});

/* ===== 灯箱 ===== */
items.forEach(item => {
    item.addEventListener("click", () => {
        const img = item.querySelector("img");
        const title = item.querySelector("h3").innerText;

        lbImg.src = img.src;
        lbTitle.innerText = title;
        lightbox.style.display = "flex";
    });
});

lightbox.querySelector(".close").addEventListener("click", () => {
    lightbox.style.display = "none";
});

lightbox.addEventListener("click", e => {
    if (e.target === lightbox) {
        lightbox.style.display = "none";
    }
});
const uploadInput = document.getElementById("uploadInput");
const uploadBtn = document.getElementById("uploadBtn");
const categorySelect = document.getElementById("categorySelect");
const gallery = document.getElementById("gallery");

/* ===== 点击按钮触发文件选择 ===== */
uploadBtn.addEventListener("click", () => uploadInput.click());

/* ===== 读取并渲染图片 ===== */
uploadInput.addEventListener("change", e => {
    Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();

        reader.onload = () => {
            const item = document.createElement("figure");
            item.className = "item";
            item.dataset.category = categorySelect.value;

            item.innerHTML = `
                <img src="${reader.result}" alt="上传图片">
                <div class="overlay">
                    <h3>新作品</h3>
                </div>
            `;

            gallery.prepend(item);

            // 绑定灯箱
            item.addEventListener("click", () => {
                lbImg.src = reader.result;
                lbTitle.innerText = "新作品";
                lightbox.style.display = "flex";
            });

            saveToLocal(reader.result, categorySelect.value);
        };

        reader.readAsDataURL(file);
    });
});

/* ===== 保存到 localStorage ===== */
function saveToLocal(img, category) {
    const data = JSON.parse(localStorage.getItem("photos") || "[]");
    data.unshift({ img, category });
    localStorage.setItem("photos", JSON.stringify(data));
}

/* ===== 页面加载时恢复 ===== */
function loadFromLocal() {
    const data = JSON.parse(localStorage.getItem("photos") || "[]");
    data.forEach(p => {
        const item = document.createElement("figure");
        item.className = "item";
        item.dataset.category = p.category;
        item.innerHTML = `
            <img src="${p.img}" alt="作品">
            <div class="overlay">
                <h3>作品</h3>
            </div>
        `;
        gallery.appendChild(item);

        item.addEventListener("click", () => {
            lbImg.src = p.img;
            lbTitle.innerText = "作品";
            lightbox.style.display = "flex";
        });
    });
}

loadFromLocal();
//修改点：增加删除功能
const STORAGE_KEY = "photos";

function getPhotos() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function savePhotos(photos) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
}

function deletePhoto(index) {
    const photos = getPhotos();
    photos.splice(index, 1);
    savePhotos(photos);
}

function renderGallery(filter = "all") {
    const gallery = document.getElementById("gallery");
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

            // 删除按钮事件
            item.querySelector(".delete-btn").addEventListener("click", e => {
                e.stopPropagation(); // 防止触发灯箱
                if (confirm("确定要删除这张作品吗？")) {
                    deletePhoto(i);
                    renderGallery(filter);
                }
            });

            // 点击图片打开灯箱
            item.querySelector("img").addEventListener("click", () => {
                document.getElementById("lightbox-img").src = p.src;
                document.getElementById("lightbox-title").innerText = p.title;
                document.getElementById("lightbox").style.display = "flex";
            });

            gallery.appendChild(item);
        });
}

renderGallery();

uploadInput.addEventListener("change", e => {
    const files = Array.from(e.target.files);
    const selectedCategory = categorySelect.value; 
    console.log("当前选中的分类是:", selectedCategory); // 打开浏览器控制台(F12)查看
    
    // ...后续保存逻辑
});