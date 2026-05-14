/* ======================================================
   ✅ 告诉 VS Code：supabase 是全局变量（关键）
====================================================== */
/* global supabase */

/* ================== Supabase 初始化 ================== */
const SUPABASE_URL = "https://photo-portfolio.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZ21rb2t6dWRwdmxkYWNlbm90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MzQxNzMsImV4cCI6MjA5NDMxMDE3M30.Tjy65W0JlP0rrFvHlnqaE57G7tb0RDz_HnKvtXdOvzU";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

/* ================== DOM 元素 ================== */
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
async function renderGallery(filter = "all") {
    if (!gallery) return;
    gallery.innerHTML = "";

    let query = supabase.from("photos").select("*");
    if (filter !== "all") {
        query = query.eq("category", filter);
    }

    const { data: photos, error } = await query;
    if (error) {
        console.error("读取数据库失败：", error);
        return;
    }

    photos.forEach((p) => {
        const item = document.createElement("figure");
        item.className = "item";
        item.dataset.category = p.category;

        item.innerHTML = `
            <button class="delete-btn">&times;</button>
            <img src="${p.src}" />
            <div class="overlay"><h3>${p.title}</h3></div>
        `;

        item.querySelector(".delete-btn").addEventListener("click", async (e) => {
            e.stopPropagation();
            if (confirm("确定要删除这张作品吗？")) {
                await deletePhoto(p.id, p.src, filter);
            }
        });

        item.querySelector("img").addEventListener("click", () => {
            lbImg.src = p.src;
            lbTitle.innerText = p.title;
            lightbox.style.display = "flex";
        });

        gallery.appendChild(item);
    });
}

/* ================== 删除 ================== */
async function deletePhoto(id, imageUrl, currentFilter) {
    await supabase.from("photos").delete().eq("id", id);

    const filePath = imageUrl.split("/photos/")[1];
    if (filePath) {
        await supabase.storage.from("photos").remove([filePath]);
    }

    renderGallery(currentFilter);
}

/* ================== 分类筛选 ================== */
buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderGallery(btn.dataset.filter);
    });
});

/* ================== 灯箱 ================== */
lightbox?.querySelector(".close")?.addEventListener("click", () => {
    lightbox.style.display = "none";
});
lightbox?.addEventListener("click", e => {
    if (e.target === lightbox) lightbox.style.display = "none";
});

/* ================== 上传 ================== */
async function uploadToSupabase(file, category) {
    const fileName = `${Date.now()}_${file.name}`;

    const { error: storageError } =
        await supabase.storage.from("photos").upload(fileName, file);

    if (storageError) {
        alert("上传失败：" + storageError.message);
        return;
    }

    const { data: urlData } = supabase
        .storage
        .from("photos")
        .getPublicUrl(fileName);

    await supabase.from("photos").insert({
        src: urlData.publicUrl,
        title: file.name.split(".")[0],
        category
    });

    renderGallery("all");
}

function handleFiles(files) {
    if (!files?.length) return;

    Array.from(files).forEach(file => {
        uploadToSupabase(file, autoDetectCategory(file));
    });

    uploadInput.value = "";
}

uploadBtn?.addEventListener("click", () => uploadInput?.click());
uploadInput?.addEventListener("change", e => handleFiles(e.target.files));

dropZone?.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
});
dropZone?.addEventListener("dragleave", () =>
    dropZone.classList.remove("drag-over")
);
dropZone?.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    handleFiles(e.dataTransfer.files);
});

/* ================== 初始化 ================== */
renderGallery("all");