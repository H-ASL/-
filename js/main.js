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