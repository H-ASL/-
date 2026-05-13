import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

const supabase = createClient(
  "https://你的项目.supabase.co",
  "你的anon_key"
);

const gallery = document.getElementById("gallery");

/* ===== 登录 ===== */
document.getElementById("loginBtn").onclick = async () => {
    await supabase.auth.signInWithOAuth({ provider: "github" });
};

/* ===== 监听登录状态 ===== */
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        document.getElementById("userInfo").innerText =
            "欢迎，" + session.user.email;
        loadPhotos();
    }
});

/* ===== 上传 ===== */
document.getElementById("uploadBtn").onclick = () =>
    document.getElementById("uploadInput").click();

document.getElementById("uploadInput").onchange = async e => {
    const user = (await supabase.auth.getUser()).data.user;
    const category = document.getElementById("categorySelect").value;

    for (let file of e.target.files) {
        const path = `photos/${user.id}/${Date.now()}_${file.name}`;

        const { data } = await supabase.storage
            .from("photos")
            .upload(path, file);

        const url = supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;

        await supabase.from("photos").insert({
            user_id: user.id,
            url,
            title: file.name,
            category
        });

        addPhotoCard(url, file.name, category);
    }
};

/* ===== 加载照片 ===== */
async function loadPhotos(filter = "all") {
    gallery.innerHTML = "";
    let query = supabase.from("photos").select("*").order("created_at", { ascending: false });

    if (filter !== "all") query = query.eq("category", filter);

    const { data } = await query;
    data.forEach(p => addPhotoCard(p.url, p.title, p.category));
}

/* ===== 卡片 ===== */
function addPhotoCard(url, title, category) {
    const item = document.createElement("figure");
    item.className = "item";
    item.dataset.category = category;
    item.innerHTML = `
        <img src="${url}">
        <div class="overlay"><h3>${title}</h3></div>
    `;
    gallery.appendChild(item);
}

/* ===== 分类 ===== */
document.querySelectorAll(".filter-bar button").forEach(btn => {
    btn.onclick = () => loadPhotos(btn.dataset.filter);
});

loadPhotos();
const supabase = window.supabase.createClient(
  "https://你的项目.supabase.co",
  "你的anon_key"
);
const uploadBtn = document.getElementById("uploadBtn");
const input = document.getElementById("uploadInput");

uploadBtn.onclick = () => input.click();

input.onchange = async (e) => {
    const user = (await supabase.auth.getUser()).data.user;
    const file = e.target.files[0];

    const path = `${user.id}/${Date.now()}.jpg`;

    await supabase.storage
        .from("photos")
        .upload(path, file);

    const url = supabase.storage
        .from("photos")
        .getPublicUrl(path).data.publicUrl;

    await supabase.from("photos").insert({
        user_id: user.id,
        url,
        title: file.name,
        category: "mountain"
    });

    location.reload();
};
async function loadPhotos() {
    const { data } = await supabase
        .from("photos")
        .select("*")
        .order("created_at", { ascending: false });

    data.forEach(p => {
        const img = document.createElement("img");
        img.src = p.url;
        document.getElementById("gallery").appendChild(img);
    });
}

loadPhotos();