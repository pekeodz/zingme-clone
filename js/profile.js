const daySelect = document.getElementById('input-dob-day');
const monthSelect = document.getElementById('input-dob-month');
const yearSelect = document.getElementById('input-dob-year');
for (let i = 1; i <= 31; i++) { daySelect.innerHTML += `<option value="${i}">${i}</option>`; }
for (let i = 1; i <= 12; i++) { monthSelect.innerHTML += `<option value="${i}">Tháng ${i}</option>`; }
for (let i = new Date().getFullYear(); i >= 1950; i--) { yearSelect.innerHTML += `<option value="${i}">${i}</option>`; }

// IMPORT: Thêm arrayUnion và arrayRemove để xử lý Like/Cmt
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDeVcweMEYOi9t8_NyIXg6XRZ6I4LIgNBU",
    authDomain: "zingme-clone.firebaseapp.com",
    databaseURL: "https://zingme-clone-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "zingme-clone",
    storageBucket: "zingme-clone.firebasestorage.app",
    messagingSenderId: "121550062824",
    appId: "1:121550062824:web:35257485755932ef91755d",
    measurementId: "G-LXNNVVEKKQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let originalCoverUrl = ""; let originalBgUrl = ""; let originalBgColor = "#e9eaed";
let myName = ""; let myAvatar = "";

// Lấy ID người dùng từ trên thanh URL (Nếu đang xem trang người khác)
const urlParams = new URLSearchParams(window.location.search);
const viewUid = urlParams.get('id'); 
let targetUid = null; 
let isMyProfile = true;

// --- XỬ LÝ CHUYỂN TAB ---
const mainTabTuongNha = document.getElementById('main-tab-tuongnha');
const mainTabThongTin = document.getElementById('main-tab-thongtin');
const mainContentTuongNha = document.getElementById('main-content-tuongnha');
const mainContentThongTin = document.getElementById('main-content-thongtin');

mainTabTuongNha.addEventListener('click', (e) => { e.preventDefault(); mainTabTuongNha.classList.add('active'); mainTabThongTin.classList.remove('active'); mainContentTuongNha.style.display = 'flex'; mainContentThongTin.style.display = 'none'; });
mainTabThongTin.addEventListener('click', (e) => { e.preventDefault(); mainTabThongTin.classList.add('active'); mainTabTuongNha.classList.remove('active'); mainContentThongTin.style.display = 'flex'; mainContentTuongNha.style.display = 'none'; });


// --- LOAD DỮ LIỆU TÀI KHOẢN ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        
        // Xác định xem đang xem trang của mình hay trang của ai đó
        targetUid = viewUid ? viewUid : currentUser.uid;
        
        if (targetUid !== currentUser.uid) {
            isMyProfile = false;
            // Ẩn các nút chỉnh sửa vì đây không phải trang của mình
            if(document.getElementById('btn-open-editor')) document.getElementById('btn-open-editor').style.display = 'none';
            if(document.querySelector('.edit-avatar-btn')) document.querySelector('.edit-avatar-btn').style.display = 'none';
            if(document.querySelector('.post-box')) document.querySelector('.post-box').style.display = 'none'; 
            if(document.getElementById('main-tab-thongtin')) document.getElementById('main-tab-thongtin').style.display = 'none'; 
        }

        try {  
            const myDocSnap = await getDoc(doc(db, "users", currentUser.uid));
            if (myDocSnap.exists()) {
                myName = myDocSnap.data().displayName || myDocSnap.data().fullname || "Khách";
                myAvatar = myDocSnap.data().avatarUrl || '';
            }

            // ==========================================
            // Load dữ liệu của CHỦ TƯỜNG NHÀ (để hiển thị lên màn hình)
            // ==========================================
            const docRef = doc(db, "users", targetUid); 
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const dispName = data.displayName || data.username;
                
                document.getElementById('display-fullname').innerText = dispName;
                document.getElementById('sidebar-name').innerText = dispName.toUpperCase(); 
                document.getElementById('display-level').innerText = "LEVEL " + (data.level || 1);
                
                const zm = data.zm_coin || 0;
                document.getElementById('display-zm').innerText = zm;
                document.getElementById('sidebar-zm-coin').innerText = zm; 
                
                if (data.avatarUrl) {
                    document.getElementById('avatar-box').innerHTML = `<img src="${data.avatarUrl}">`;
                    document.getElementById('sidebar-avatar').innerHTML = `<img src="${data.avatarUrl}">`;
                }
                
                if (data.coverUrl) { originalCoverUrl = data.coverUrl; document.getElementById('main-cover-photo').style.backgroundImage = `url(${data.coverUrl})`; }
                if (data.bgUrl) { originalBgUrl = data.bgUrl; document.body.style.backgroundImage = `url(${data.bgUrl})`; document.body.style.backgroundAttachment = "fixed"; document.body.style.backgroundSize = "cover"; }
                if (data.bgColor) { originalBgColor = data.bgColor; document.body.style.backgroundColor = data.bgColor; document.getElementById('input-bg-color').value = data.bgColor; }
                
                if(isMyProfile) {
                    document.getElementById('input-fullname').value = data.displayName || data.fullname || "";
                    document.getElementById('input-gender').value = data.gender || "Nam";
                    if(data.dob) { const p = data.dob.split('/'); document.getElementById('input-dob-day').value = p[0]; document.getElementById('input-dob-month').value = p[1]; document.getElementById('input-dob-year').value = p[2]; }
                    document.getElementById('input-phone').value = data.phone || ""; document.getElementById('input-cmnd').value = data.cmnd || "";
                    document.getElementById('input-address').value = data.address || ""; document.getElementById('input-email').value = data.email || "";
                    document.getElementById('input-bio').value = data.bio || "";
                }
                
                loadPosts(); // Tải bài viết
                document.getElementById('loading-screen').style.display = 'none';
            }
        } catch (e) { console.error(e); }
    } else { window.location.href = "index.html"; }
});

// --- XỬ LÝ TÌM KIẾM BẠN BÈ ---
const inputSearch = document.getElementById('input-search');
const searchResults = document.getElementById('search-results');

inputSearch.addEventListener('input', async (e) => {
    const val = e.target.value.trim().toLowerCase();
    if(!val) { searchResults.style.display = 'none'; return; }
    
    try {
        const q = query(collection(db, "users"));
        const snap = await getDocs(q);
        searchResults.innerHTML = '';
        let found = false;
        
        snap.forEach(docSnap => {
            const u = docSnap.data();
            const name = (u.displayName || u.fullname || '').toLowerCase();
            if(name.includes(val)) {
                found = true;
                const defaultAva = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
                searchResults.insertAdjacentHTML('beforeend', `
                    <div class="search-result-item" onclick="window.location.href='profile.html?id=${docSnap.id}'">
                        <img src="${u.avatarUrl || defaultAva}" class="search-result-avatar">
                        <div class="search-result-name">${u.displayName || u.fullname}</div>
                    </div>
                `);
            }
        });
        searchResults.style.display = found ? 'flex' : 'none';
    } catch(err) { console.error(err); }
});

// Ẩn kết quả tìm kiếm khi bấm ra ngoài
document.addEventListener('click', (e) => {
    if(!e.target.closest('.search-box')) searchResults.style.display = 'none';
});

// --- RENDER BÀI VIẾT (LIKE & COMMENT) ---
const feedStream = document.getElementById('feed-stream');

function renderPostHTML(postId, post) {
    const defaultAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; 
    const likes = post.likes || [];
    const comments = post.comments || [];
    const isLiked = currentUser && likes.includes(currentUser.uid);
    const imageHtml = post.postImageUrl ? `<img src="${post.postImageUrl}" class="post-attached-image" alt="Ảnh bài viết">` : '';

    let commentsHtml = '';
    comments.forEach(c => {
        commentsHtml += `
            <div class="comment-item">
                <img src="${c.avatarUrl || defaultAvatar}" class="comment-avatar">
                <div class="comment-content-box">
                    <div class="comment-text-box">
                        <a href="profile.html?id=${c.uid}" class="comment-author">${c.authorName}</a>
                        <span>${c.content}</span>
                    </div>
                </div>
            </div>
        `;
    });

    const html = `
        <div class="post-item" style="flex-direction: column;">
            <div style="display: flex; gap: 15px;">
                <img src="${post.avatarUrl || defaultAvatar}" class="post-avatar" alt="Avatar">
                <div class="post-content">
                    <div class="post-header">
                        <a href="profile.html?id=${post.uid}" class="post-author">${post.authorName}</a>
                        <span class="post-time">${new Date(post.timestamp).toLocaleString('vi-VN')}</span>
                    </div>
                    <div class="post-text">${post.content}</div>
                    ${imageHtml}
                </div>
            </div>
            
            <div class="post-actions-bar">
                <div class="post-action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${postId}">
                    👍 ${isLiked ? 'Đã thích' : 'Thích'} (${likes.length})
                </div>
                <div class="post-action-btn">💬 Bình luận (${comments.length})</div>
            </div>

            <div class="post-comments-area">
                ${likes.length > 0 ? `<div class="comment-stats">👍 ${likes.length} người thích điều này</div>` : ''}
                ${commentsHtml}
                
                <div class="comment-input-box">
                    <img src="${myAvatar || defaultAvatar}" class="comment-avatar">
                    <input type="text" class="comment-input" data-post-id="${postId}" placeholder="Viết bình luận và nhấn Enter...">
                </div>
            </div>
        </div>
    `;
    feedStream.insertAdjacentHTML('beforeend', html);
}

// Tải bài viết của targetUid
async function loadPosts() {
    try {
        const q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        feedStream.innerHTML = ''; 
        querySnapshot.forEach((doc) => {
            const p = doc.data();
            // Chỉ hiển thị bài viết của chủ tường nhà
            if (p.uid === targetUid) {
                renderPostHTML(doc.id, p);
            }
        });
    } catch (e) { console.error("Lỗi load bài viết:", e); }
}

// Lắng nghe sự kiện Like và Comment trên toàn bộ feed (Event Delegation)
feedStream.addEventListener('click', async (e) => {
    if (e.target.classList.contains('like-btn')) {
        if (!currentUser) return;
        const postId = e.target.getAttribute('data-post-id');
        const postRef = doc(db, "posts", postId);
        const postSnap = await getDoc(postRef);
        if(postSnap.exists()) {
            const postData = postSnap.data();
            const likes = postData.likes || [];
            if(likes.includes(currentUser.uid)) {
                await updateDoc(postRef, { likes: arrayRemove(currentUser.uid) });
            } else {
                await updateDoc(postRef, { likes: arrayUnion(currentUser.uid) });
            }
            loadPosts(); // Tải lại để cập nhật UI
        }
    }
});

feedStream.addEventListener('keypress', async (e) => {
    if (e.target.classList.contains('comment-input') && e.key === 'Enter') {
        if (!currentUser) return;
        const content = e.target.value.trim();
        if(!content) return;
        
        e.target.disabled = true;
        const postId = e.target.getAttribute('data-post-id');
        const postRef = doc(db, "posts", postId);
        
        const newComment = {
            uid: currentUser.uid,
            authorName: document.getElementById('display-fullname').innerText, // Tên mình
            avatarUrl: document.getElementById('avatar-box').querySelector('img')?.src || '', // Avatar của mình
            content: content,
            timestamp: new Date().getTime()
        };

        await updateDoc(postRef, { comments: arrayUnion(newComment) });
        loadPosts();
    }
});

// --- XỬ LÝ ĐĂNG BÀI MỚI ---
const btnSharePost = document.getElementById('btn-share-post');
const inputPostContent = document.getElementById('input-post-content');
const btnUploadPostImage = document.getElementById('btn-upload-post-image');
const postImageFile = document.getElementById('post-image-file');
const postImagePreview = document.getElementById('post-image-preview');
let pendingPostImageBase64 = '';

if(btnUploadPostImage) { btnUploadPostImage.addEventListener('click', () => { postImageFile.click(); }); }
if(postImageFile) {
    postImageFile.addEventListener('change', (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = () => { pendingPostImageBase64 = reader.result; postImagePreview.src = pendingPostImageBase64; postImagePreview.style.display = 'block'; };
    });
}

if(btnSharePost) {
    btnSharePost.addEventListener('click', async () => {
        const content = inputPostContent.value.trim();
        if(!content && !pendingPostImageBase64) return;
        if(!currentUser) return;
        
        btnSharePost.innerText = "..."; btnSharePost.disabled = true;
        const authorName = document.getElementById('display-fullname').innerText;
        const avatarUrl = document.getElementById('avatar-box').querySelector('img')?.src || '';

        try {
            await addDoc(collection(db, "posts"), {
                uid: currentUser.uid,
                content: content,
                authorName: authorName,
                avatarUrl: avatarUrl,
                postImageUrl: pendingPostImageBase64,
                likes: [],       // Mảng chứa UID người Like
                comments: [],    // Mảng chứa các object Bình luận
                timestamp: new Date().getTime()
            });

            inputPostContent.value = ''; pendingPostImageBase64 = '';
            if(postImagePreview) { postImagePreview.src = ''; postImagePreview.style.display = 'none'; }
            loadPosts();
        } catch(e) { alert("Không thể đăng bài viết lúc này."); } 
        finally { btnSharePost.innerText = "Chia sẻ"; btnSharePost.disabled = false; }
    });
}


// --- CÁC LOGIC CŨ (GIAO DIỆN, AVATAR, LƯU FORM) ---
const btnOpenEditor = document.getElementById('btn-open-editor');
const btnCloseEditor = document.getElementById('btn-close-editor');
const coverEditorPanel = document.getElementById('cover-editor-panel');
const btnUploadCover = document.getElementById('btn-upload-cover'); const coverFileInput = document.getElementById('cover-file-input');
const btnUploadBg = document.getElementById('btn-upload-bg'); const bgFileInput = document.getElementById('bg-file-input');
const colorItems = document.querySelectorAll('.color-item'); const inputBgColor = document.getElementById('input-bg-color');
const mainCoverPhoto = document.getElementById('main-cover-photo'); const btnSaveCover = document.getElementById('btn-save-cover'); const btnDeleteTheme = document.getElementById('btn-delete-theme');
let pendingCoverBase64 = null; let pendingBgBase64 = null; let pendingBgColor = null;

const tabBtnLibrary = document.getElementById('tab-btn-library'); const tabBtnCustom = document.getElementById('tab-btn-custom');
const tabContentLibrary = document.getElementById('tab-content-library'); const tabContentCustom = document.getElementById('tab-content-custom');
tabBtnLibrary.addEventListener('click', () => { tabBtnLibrary.classList.add('active'); tabBtnCustom.classList.remove('active'); tabContentLibrary.style.display = 'block'; tabContentCustom.style.display = 'none'; btnDeleteTheme.style.visibility = 'hidden'; });
tabBtnCustom.addEventListener('click', () => { tabBtnCustom.classList.add('active'); tabBtnLibrary.classList.remove('active'); tabContentCustom.style.display = 'flex'; tabContentLibrary.style.display = 'none'; btnDeleteTheme.style.visibility = 'visible'; });

const libraryLinks = document.querySelectorAll('#library-menu a'); const themeGrids = document.querySelectorAll('.theme-grid');
libraryLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); libraryLinks.forEach(l => l.classList.remove('active')); link.classList.add('active'); themeGrids.forEach(grid => grid.classList.remove('active-grid')); document.getElementById(link.getAttribute('data-target')).classList.add('active-grid'); }); });

document.querySelectorAll('.theme-thumbnail').forEach(thumb => { thumb.addEventListener('click', () => { pendingCoverBase64 = thumb.src; mainCoverPhoto.style.backgroundImage = `url(${pendingCoverBase64})`; }); });

if(btnOpenEditor) btnOpenEditor.addEventListener('click', () => { coverEditorPanel.style.display = 'block'; });
if(btnCloseEditor) btnCloseEditor.addEventListener('click', () => { coverEditorPanel.style.display = 'none'; pendingCoverBase64 = null; pendingBgBase64 = null; pendingBgColor = null; mainCoverPhoto.style.backgroundImage = originalCoverUrl ? `url(${originalCoverUrl})` : ''; document.body.style.backgroundImage = originalBgUrl ? `url(${originalBgUrl})` : ''; document.body.style.backgroundColor = originalBgColor; inputBgColor.value = originalBgColor; });

if(btnUploadCover) btnUploadCover.addEventListener('click', () => { coverFileInput.click(); });
if(coverFileInput) coverFileInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => { pendingCoverBase64 = reader.result; mainCoverPhoto.style.backgroundImage = `url(${pendingCoverBase64})`; }; });

if(btnUploadBg) btnUploadBg.addEventListener('click', () => { bgFileInput.click(); });
if(bgFileInput) bgFileInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => { pendingBgBase64 = reader.result; document.body.style.backgroundImage = `url(${pendingBgBase64})`; document.body.style.backgroundAttachment = "fixed"; document.body.style.backgroundSize = "cover"; }; });

colorItems.forEach(item => { item.addEventListener('click', () => { const color = item.getAttribute('data-color'); pendingBgColor = color; document.body.style.backgroundColor = color; inputBgColor.value = color; }); });
if(inputBgColor) inputBgColor.addEventListener('input', (e) => { const color = e.target.value; pendingBgColor = color; document.body.style.backgroundColor = color; });

if(btnSaveCover) btnSaveCover.addEventListener('click', async () => { if (!currentUser) return; let updateData = {}; if (pendingCoverBase64 !== null) updateData.coverUrl = pendingCoverBase64; if (pendingBgBase64 !== null) updateData.bgUrl = pendingBgBase64; if (pendingBgColor !== null) updateData.bgColor = pendingBgColor; if (Object.keys(updateData).length === 0) { coverEditorPanel.style.display = 'none'; return; } btnSaveCover.innerText = "Đang lưu..."; try { await updateDoc(doc(db, "users", currentUser.uid), updateData); if (updateData.coverUrl) originalCoverUrl = updateData.coverUrl; if (updateData.bgUrl) originalBgUrl = updateData.bgUrl; if (updateData.bgColor) originalBgColor = updateData.bgColor; pendingCoverBase64 = null; pendingBgBase64 = null; pendingBgColor = null; coverEditorPanel.style.display = 'none'; } catch (error) { alert("Không thể lưu giao diện."); } finally { btnSaveCover.innerText = "Cập nhật giao diện"; } });
if(btnDeleteTheme) btnDeleteTheme.addEventListener('click', async () => { if (!currentUser || !confirm("Xóa toàn bộ giao diện?")) return; btnDeleteTheme.innerText = "Đang xóa..."; try { await updateDoc(doc(db, "users", currentUser.uid), { coverUrl: "", bgUrl: "", bgColor: "#e9eaed" }); originalCoverUrl = ""; originalBgUrl = ""; originalBgColor = "#e9eaed"; pendingCoverBase64 = null; pendingBgBase64 = null; pendingBgColor = null; mainCoverPhoto.style.backgroundImage = ''; document.body.style.backgroundImage = ''; document.body.style.backgroundColor = '#e9eaed'; inputBgColor.value = '#e9eaed'; coverEditorPanel.style.display = 'none'; alert("Đã khôi phục mặc định!"); } catch (error) { alert("Không thể xóa."); } finally { btnDeleteTheme.innerText = "🗑 Xóa giao diện này"; } });

// 2. Avatar
const avatarFileInput = document.getElementById('avatar-file-input'); const cropModal = document.getElementById('crop-modal'); const cropImage = document.getElementById('crop-image'); const cropArea = document.getElementById('crop-area'); const zoomSlider = document.getElementById('zoom-slider'); let currentImgObj = new Image(), scale = 1, translateX = 0, translateY = 0, isDragging = false, startX, startY;
if(document.getElementById('avatar-container')) document.getElementById('avatar-container').addEventListener('click', () => avatarFileInput.click()); 
if(document.getElementById('btn-reselect')) document.getElementById('btn-reselect').addEventListener('click', () => avatarFileInput.click()); 
if(document.getElementById('close-modal-btn')) document.getElementById('close-modal-btn').addEventListener('click', () => cropModal.style.display = 'none');
if(avatarFileInput) avatarFileInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => { cropImage.src = reader.result; currentImgObj.src = reader.result; currentImgObj.onload = () => { scale = 1; translateX = 0; translateY = 0; zoomSlider.value = 1; autoSize(); cropModal.style.display = 'flex'; }; }; });
function updateImageTransform() { cropImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`; } 
if(cropArea) { cropArea.addEventListener('mousedown', (e) => { isDragging = true; startX = e.clientX - translateX; startY = e.clientY - translateY; }); window.addEventListener('mousemove', (e) => { if (!isDragging) return; translateX = e.clientX - startX; translateY = e.clientY - startY; updateImageTransform(); }); window.addEventListener('mouseup', () => { isDragging = false; }); }
if(zoomSlider) zoomSlider.addEventListener('input', (e) => { scale = e.target.value; updateImageTransform(); });
function autoSize() { scale = Math.max(200 / currentImgObj.width, 200 / currentImgObj.height); translateX = 0; translateY = 0; cropImage.style.width = currentImgObj.width + 'px'; cropImage.style.height = currentImgObj.height + 'px'; cropImage.style.left = (200 - currentImgObj.width) / 2 + 'px'; cropImage.style.top = (200 - currentImgObj.height) / 2 + 'px'; zoomSlider.value = scale; updateImageTransform(); } 
if(document.getElementById('btn-auto-size')) document.getElementById('btn-auto-size').addEventListener('click', autoSize);
if(document.getElementById('btn-confirm-crop')) document.getElementById('btn-confirm-crop').addEventListener('click', async () => { const canvas = document.createElement('canvas'); canvas.width = 200; canvas.height = 200; const ctx = canvas.getContext('2d'); ctx.drawImage(currentImgObj, (200 - currentImgObj.width * scale) / 2 + translateX, (200 - currentImgObj.height * scale) / 2 + translateY, currentImgObj.width * scale, currentImgObj.height * scale); const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9); document.getElementById('avatar-box').innerHTML = `<img src="${croppedBase64}">`; document.getElementById('sidebar-avatar').innerHTML = `<img src="${croppedBase64}">`; cropModal.style.display = 'none'; if (currentUser) await updateDoc(doc(db, "users", currentUser.uid), { avatarUrl: croppedBase64 }); });

// 3. Form Info
if(document.getElementById('save-btn')) document.getElementById('save-btn').addEventListener('click', async () => { const btn = document.getElementById('save-btn'); if (!currentUser) return; btn.innerText = "Đang lưu..."; btn.disabled = true; const name = document.getElementById('input-fullname').value.trim(); try { await updateDoc(doc(db, "users", currentUser.uid), { displayName: name, gender: document.getElementById('input-gender').value, dob: `${document.getElementById('input-dob-day').value}/${document.getElementById('input-dob-month').value}/${document.getElementById('input-dob-year').value}`, phone: document.getElementById('input-phone').value.trim(), cmnd: document.getElementById('input-cmnd').value.trim(), address: document.getElementById('input-address').value.trim(), email: document.getElementById('input-email').value.trim(), bio: document.getElementById('input-bio').value.trim() }); document.getElementById('display-fullname').innerText = name; document.getElementById('sidebar-name').innerText = name.toUpperCase(); alert("Cập nhật thông tin thành công!"); } catch (e) { alert("Lỗi khi lưu!"); } finally { btn.innerText = "Lưu lại"; btn.disabled = false; } });
if(document.getElementById('logout-btn')) document.getElementById('logout-btn').addEventListener('click', () => { signOut(auth).then(() => { window.location.href = "index.html"; }); });
