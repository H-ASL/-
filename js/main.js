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
function autoDetectCategory(fileName) {
    const name = fileName.toLowerCase();
    if (name.includes("mountain") || name.includes("shan")) return "mountain";
    if (name.includes("ocean") || name.includes("sea") || name.includes("hai")) return "ocean";
    if (name.includes("forest") || name.includes("tree") || name.includes("lin")) return "forest";
    if (name.includes("animal") || name.includes("dog") || name.includes("cat")) return "animal";
    return "other";
}

/* ================== 从 Supabase 获取图片数据 ================== */
async function fetchPhotos() {
    const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('获取图片失败：', error);
        return [];
    }
    return data || [];
}

/* ================== 渲染瀑布流 ================== */
async function renderGallery(filter = "all") {
    if (!gallery) return;

    gallery.innerHTML = "";
    const photos = await fetchPhotos();

    photos
        .filter(p => filter === "all" || p.category === filter)
        .forEach(p => {
            const item = document.createElement("figure");
            item.className = "item";
            item.dataset.category = p.category;

            item.innerHTML = `
                <button class="delete-btn">&times;</button>
                <img src="${p.src}" alt="${p.title}" />
                <div class="overlay"><h3>${p.title}</h3></div>
            `;

            // 点击图片打开灯箱
            item.querySelector("img")?.addEventListener("click", () => {
                lbImg.src = p.src;
                lbTitle.innerText = p.title;
                lightbox.style.display = "flex";
            });

            // 删除按钮
            item.querySelector(".delete-btn")?.addEventListener("click", async (e) => {
                e.stopPropagation();
                if (confirm("确定要删除这张作品吗？")) {
                    await deletePhoto(p.id);
                    renderGallery(filter);
                }
            });

            gallery.appendChild(item);
        });
}

/* ================== 删除图片（从 Supabase 删除） ================== */
async function deletePhoto(id) {
    const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id);

    if (error) {
        alert('删除失败：' + error.message);
    }
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

/* ================== 上传到 Supabase ================== */
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

    const { error: dbError } = await supabase
        .from('photos')
        .insert([
            {
                src: urlData.publicUrl,
                title: file.name.split('.')[0],
                category
            }
        ]);

    if (dbError) {
        alert('保存到数据库失败：' + dbError.message);
    }
}

/* ================== 处理文件上传 ================== */
async function handleFiles(files) {
    if (!files || !files.length) return;

    const fileArray = Array.from(files);

    if (progressContainer) progressContainer.style.display = "block";
    if (progressBar) progressBar.style.width = "0%";

    for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        await uploadToSupabase(file, autoDetectCategory(file.name));
        // 更新进度条
        if (progressBar) {
            progressBar.style.width = `${((i + 1) / fileArray.length) * 100}%`;
        }
    }

    if (uploadInput) uploadInput.value = "";
    if (progressContainer) progressContainer.style.display = "none";
    if (progressBar) progressBar.style.width = "0%";

    renderGallery('all'); // 重新渲染
}

/* ================== 上传逻辑 ================== */
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