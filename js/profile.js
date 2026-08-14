const daySelect = document.getElementById('input-dob-day');
        const monthSelect = document.getElementById('input-dob-month');
        const yearSelect = document.getElementById('input-dob-year');
        for (let i = 1; i <= 31; i++) { daySelect.innerHTML += `<option value="${i}">${i}</option>`; }
        for (let i = 1; i <= 12; i++) { monthSelect.innerHTML += `<option value="${i}">Tháng ${i}</option>`; }
        for (let i = new Date().getFullYear(); i >= 1950; i--) { yearSelect.innerHTML += `<option value="${i}">${i}</option>`; }

        // IMPORT CÁC HÀM CỦA FIREBASE
        import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
        import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
        // Bổ sung thêm collection, addDoc, getDocs, query, orderBy để xử lý đăng bài
        import { getFirestore, doc, getDoc, updateDoc, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

        // --- XỬ LÝ CHUYỂN TAB CHÍNH (TƯỜNG NHÀ <-> THÔNG TIN) ---
        const mainTabTuongNha = document.getElementById('main-tab-tuongnha');
        const mainTabThongTin = document.getElementById('main-tab-thongtin');
        const mainContentTuongNha = document.getElementById('main-content-tuongnha');
        const mainContentThongTin = document.getElementById('main-content-thongtin');

        // Khi bấm vào Tường nhà
        mainTabTuongNha.addEventListener('click', (e) => {
            e.preventDefault();
            mainTabTuongNha.classList.add('active'); 
            mainTabThongTin.classList.remove('active');
            
            // HIỆN Tường nhà, ẨN Thông tin
            mainContentTuongNha.style.display = 'flex'; 
            mainContentThongTin.style.display = 'none';
        });

        // Khi bấm vào Thông tin
        mainTabThongTin.addEventListener('click', (e) => {
            e.preventDefault();
            mainTabThongTin.classList.add('active'); 
            mainTabTuongNha.classList.remove('active');
            
            // ẨN Tường nhà, HIỆN Thông tin
            mainContentThongTin.style.display = 'flex'; 
            mainContentTuongNha.style.display = 'none';
        });

        // Khi bấm vào Thông tin
        mainTabThongTin.addEventListener('click', (e) => {
            e.preventDefault();
            mainTabThongTin.classList.add('active'); 
            mainTabTuongNha.classList.remove('active');
            
            // ẨN Tường nhà, HIỆN Thông tin
            mainContentThongTin.style.display = 'flex'; 
            mainContentTuongNha.style.display = 'none';
            
            // Mở đáy Header ra để dính liền thành 1 khối với Form Thông tin bên dưới
            headerWrap.classList.add('no-gap'); 
        });

        // --- LOAD DỮ LIỆU TÀI KHOẢN ---
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                currentUser = user;
                try {
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        const dispName = data.displayName || data.username;
                        
                        document.getElementById('display-fullname').innerText = dispName;
                        document.getElementById('sidebar-name').innerText = dispName.toUpperCase(); // Cho Sidebar
                        
                        document.getElementById('display-level').innerText = "LEVEL " + (data.level || 1);
                        
                        const zm = data.zm_coin || 0;
                        document.getElementById('display-zm').innerText = zm;
                        document.getElementById('sidebar-zm-coin').innerText = zm; // Cho Sidebar
                        
                        if (data.avatarUrl) {
                            document.getElementById('avatar-box').innerHTML = `<img src="${data.avatarUrl}">`;
                            document.getElementById('sidebar-avatar').innerHTML = `<img src="${data.avatarUrl}">`;
                        }
                        
                        // Load Giao diện
                        if (data.coverUrl) { originalCoverUrl = data.coverUrl; document.getElementById('main-cover-photo').style.backgroundImage = `url(${data.coverUrl})`; }
                        if (data.bgUrl) { originalBgUrl = data.bgUrl; document.body.style.backgroundImage = `url(${data.bgUrl})`; document.body.style.backgroundAttachment = "fixed"; document.body.style.backgroundSize = "cover"; }
                        if (data.bgColor) { originalBgColor = data.bgColor; document.body.style.backgroundColor = data.bgColor; document.getElementById('input-bg-color').value = data.bgColor; }
                        
                        // Load Form
                        document.getElementById('input-fullname').value = data.displayName || data.fullname || "";
                        document.getElementById('input-gender').value = data.gender || "Nam";
                        if(data.dob) {
                            const p = data.dob.split('/');
                            document.getElementById('input-dob-day').value = p[0]; document.getElementById('input-dob-month').value = p[1]; document.getElementById('input-dob-year').value = p[2];
                        }
                        document.getElementById('input-phone').value = data.phone || ""; document.getElementById('input-cmnd').value = data.cmnd || "";
                        document.getElementById('input-address').value = data.address || ""; document.getElementById('input-email').value = data.email || "";
                        document.getElementById('input-bio').value = data.bio || "";
                        
                        // Gọi hàm Load Bài viết
                        loadPosts();

                        document.getElementById('loading-screen').style.display = 'none';
                    }
                } catch (e) { console.error(e); }
            } else { window.location.href = "index.html"; }
        });

        // --- XỬ LÝ ĐĂNG BÀI (POST STATUS) ---
        const btnSharePost = document.getElementById('btn-share-post');
        const inputPostContent = document.getElementById('input-post-content');
        const feedStream = document.getElementById('feed-stream');

        // MỚI: Các biến xử lý tải ảnh lên bài viết
        const btnUploadPostImage = document.getElementById('btn-upload-post-image');
        const postImageFile = document.getElementById('post-image-file');
        const postImagePreview = document.getElementById('post-image-preview');
        let pendingPostImageBase64 = ''; // Lưu trữ ảnh tạm thời trước khi ấn Chia sẻ

        // Khi bấm vào icon 🖼️
        if(btnUploadPostImage) {
            btnUploadPostImage.addEventListener('click', () => { postImageFile.click(); });
        }

        // Đọc ảnh và hiển thị xem trước
        if(postImageFile) {
            postImageFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    pendingPostImageBase64 = reader.result;
                    postImagePreview.src = pendingPostImageBase64;
                    postImagePreview.style.display = 'block';
                };
            });
        }

        // Cập nhật hàm render giao diện bài viết (Có Thích, Bình luận, Ảnh)
        function renderPostHTML(content, authorName, timeString, avatarUrl, postImageUrl = '') {
            const defaultAvatar = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; 
            
            // Xử lý hiển thị ảnh đính kèm (nếu có)
            const imageHtml = postImageUrl ? `<img src="${postImageUrl}" class="post-attached-image" alt="Ảnh bài viết">` : '';

            const html = `
                <div class="post-item" style="flex-direction: column;">
                    <div style="display: flex; gap: 15px;">
                        <img src="${avatarUrl || defaultAvatar}" class="post-avatar" alt="Avatar">
                        <div class="post-content">
                            <div class="post-header">
                                <a href="#" class="post-author">${authorName}</a>
                                <span class="post-time">${timeString}</span>
                            </div>
                            <div class="post-text">${content}</div>
                            ${imageHtml}
                        </div>
                    </div>
                    
                    <!-- Nút hành động: Thích / Bình luận -->
                    <div class="post-actions-bar">
                        <div class="post-action-btn">👍 Thích</div>
                        <div class="post-action-btn">💬 Bình luận</div>
                        <div class="post-action-btn">↪️ Chia sẻ</div>
                    </div>

                    <!-- Khu vực Bình luận -->
                    <div class="post-comments-area">
                        <div class="comment-stats">👍 1 người thích điều này</div>
                        
                        <div class="comment-item">
                            <img src="https://i.imgur.com/K5tGk8x.jpg" class="comment-avatar">
                            <div class="comment-content-box">
                                <div class="comment-text-box">
                                    <span class="comment-author">Thánh Soi</span>
                                    <span>Đỉnh quá bạn ơi! 😍</span>
                                </div>
                                <div class="comment-actions">Thích · Trả lời · Vừa xong</div>
                            </div>
                        </div>

                        <!-- Khung nhập bình luận -->
                        <div class="comment-input-box">
                            <img src="${document.getElementById('avatar-box').querySelector('img')?.src || defaultAvatar}" class="comment-avatar">
                            <input type="text" placeholder="Viết bình luận...">
                        </div>
                    </div>
                </div>
            `;
            feedStream.insertAdjacentHTML('afterbegin', html);
        }

        // Tải các bài viết từ Firebase
        async function loadPosts() {
            try {
                const q = query(collection(db, "posts"), orderBy("timestamp", "asc"));
                const querySnapshot = await getDocs(q);
                feedStream.innerHTML = ''; 
                querySnapshot.forEach((doc) => {
                    const p = doc.data();
                    const timeStr = new Date(p.timestamp).toLocaleString('vi-VN');
                    // Render kèm link ảnh
                    renderPostHTML(p.content, p.authorName, timeStr, p.avatarUrl, p.postImageUrl);
                });
            } catch (e) { console.error("Lỗi load bài viết:", e); }
        }

        // Khi bấm nút Chia sẻ
        btnSharePost.addEventListener('click', async () => {
            const content = inputPostContent.value.trim();
            
            // Nếu không có chữ VÀ không có ảnh thì không cho đăng
            if(!content && !pendingPostImageBase64) return;
            if(!currentUser) return;
            
            btnSharePost.innerText = "...";
            btnSharePost.disabled = true;

            const authorName = document.getElementById('display-fullname').innerText;
            const avatarUrl = document.getElementById('avatar-box').querySelector('img')?.src || '';
            const now = new Date().getTime();

            try {
                // Đăng lên Firebase (kèm ảnh Base64)
                await addDoc(collection(db, "posts"), {
                    uid: currentUser.uid,
                    content: content,
                    authorName: authorName,
                    avatarUrl: avatarUrl,
                    postImageUrl: pendingPostImageBase64, // Lưu ảnh
                    timestamp: now
                });

                // Hiển thị ngay lên màn hình
                renderPostHTML(content, authorName, "Vừa xong", avatarUrl, pendingPostImageBase64);
                
                // Dọn dẹp ô nhập sau khi đăng xong
                inputPostContent.value = '';
                pendingPostImageBase64 = '';
                if(postImagePreview) {
                    postImagePreview.src = '';
                    postImagePreview.style.display = 'none';
                }

            } catch(e) { 
                console.error("Lỗi đăng bài:", e); 
                alert("Không thể đăng bài viết lúc này.");
            } finally {
                btnSharePost.innerText = "Chia sẻ";
                btnSharePost.disabled = false;
            }
        });


        // --- CÁC LOGIC CŨ (ĐỔI GIAO DIỆN, CẮT AVATAR, LƯU FORM) ---
        // 1. Panel Tùy chỉnh Giao diện
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

        btnOpenEditor.addEventListener('click', () => { coverEditorPanel.style.display = 'block'; });
        btnCloseEditor.addEventListener('click', () => { coverEditorPanel.style.display = 'none'; pendingCoverBase64 = null; pendingBgBase64 = null; pendingBgColor = null; mainCoverPhoto.style.backgroundImage = originalCoverUrl ? `url(${originalCoverUrl})` : ''; document.body.style.backgroundImage = originalBgUrl ? `url(${originalBgUrl})` : ''; document.body.style.backgroundColor = originalBgColor; inputBgColor.value = originalBgColor; });
        
        btnUploadCover.addEventListener('click', () => { coverFileInput.click(); });
        coverFileInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => { pendingCoverBase64 = reader.result; mainCoverPhoto.style.backgroundImage = `url(${pendingCoverBase64})`; }; });

        btnUploadBg.addEventListener('click', () => { bgFileInput.click(); });
        bgFileInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => { pendingBgBase64 = reader.result; document.body.style.backgroundImage = `url(${pendingBgBase64})`; document.body.style.backgroundAttachment = "fixed"; document.body.style.backgroundSize = "cover"; }; });

        colorItems.forEach(item => { item.addEventListener('click', () => { const color = item.getAttribute('data-color'); pendingBgColor = color; document.body.style.backgroundColor = color; inputBgColor.value = color; }); });
        inputBgColor.addEventListener('input', (e) => { const color = e.target.value; pendingBgColor = color; document.body.style.backgroundColor = color; });

        btnSaveCover.addEventListener('click', async () => { if (!currentUser) return; let updateData = {}; if (pendingCoverBase64 !== null) updateData.coverUrl = pendingCoverBase64; if (pendingBgBase64 !== null) updateData.bgUrl = pendingBgBase64; if (pendingBgColor !== null) updateData.bgColor = pendingBgColor; if (Object.keys(updateData).length === 0) { coverEditorPanel.style.display = 'none'; return; } btnSaveCover.innerText = "Đang lưu..."; try { await updateDoc(doc(db, "users", currentUser.uid), updateData); if (updateData.coverUrl) originalCoverUrl = updateData.coverUrl; if (updateData.bgUrl) originalBgUrl = updateData.bgUrl; if (updateData.bgColor) originalBgColor = updateData.bgColor; pendingCoverBase64 = null; pendingBgBase64 = null; pendingBgColor = null; coverEditorPanel.style.display = 'none'; } catch (error) { alert("Không thể lưu giao diện."); } finally { btnSaveCover.innerText = "Cập nhật giao diện"; } });

        btnDeleteTheme.addEventListener('click', async () => { if (!currentUser || !confirm("Xóa toàn bộ giao diện?")) return; btnDeleteTheme.innerText = "Đang xóa..."; try { await updateDoc(doc(db, "users", currentUser.uid), { coverUrl: "", bgUrl: "", bgColor: "#e9eaed" }); originalCoverUrl = ""; originalBgUrl = ""; originalBgColor = "#e9eaed"; pendingCoverBase64 = null; pendingBgBase64 = null; pendingBgColor = null; mainCoverPhoto.style.backgroundImage = ''; document.body.style.backgroundImage = ''; document.body.style.backgroundColor = '#e9eaed'; inputBgColor.value = '#e9eaed'; coverEditorPanel.style.display = 'none'; alert("Đã khôi phục mặc định!"); } catch (error) { alert("Không thể xóa."); } finally { btnDeleteTheme.innerText = "🗑 Xóa giao diện này"; } });

        // 2. Avatar
        const avatarFileInput = document.getElementById('avatar-file-input'); const cropModal = document.getElementById('crop-modal'); const cropImage = document.getElementById('crop-image'); const cropArea = document.getElementById('crop-area'); const zoomSlider = document.getElementById('zoom-slider'); let currentImgObj = new Image(), scale = 1, translateX = 0, translateY = 0, isDragging = false, startX, startY;
        document.getElementById('avatar-container').addEventListener('click', () => avatarFileInput.click()); document.getElementById('btn-reselect').addEventListener('click', () => avatarFileInput.click()); document.getElementById('close-modal-btn').addEventListener('click', () => cropModal.style.display = 'none');
        avatarFileInput.addEventListener('change', (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => { cropImage.src = reader.result; currentImgObj.src = reader.result; currentImgObj.onload = () => { scale = 1; translateX = 0; translateY = 0; zoomSlider.value = 1; autoSize(); cropModal.style.display = 'flex'; }; }; });
        function updateImageTransform() { cropImage.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`; } cropArea.addEventListener('mousedown', (e) => { isDragging = true; startX = e.clientX - translateX; startY = e.clientY - translateY; }); window.addEventListener('mousemove', (e) => { if (!isDragging) return; translateX = e.clientX - startX; translateY = e.clientY - startY; updateImageTransform(); }); window.addEventListener('mouseup', () => { isDragging = false; }); zoomSlider.addEventListener('input', (e) => { scale = e.target.value; updateImageTransform(); });
        function autoSize() { scale = Math.max(200 / currentImgObj.width, 200 / currentImgObj.height); translateX = 0; translateY = 0; cropImage.style.width = currentImgObj.width + 'px'; cropImage.style.height = currentImgObj.height + 'px'; cropImage.style.left = (200 - currentImgObj.width) / 2 + 'px'; cropImage.style.top = (200 - currentImgObj.height) / 2 + 'px'; zoomSlider.value = scale; updateImageTransform(); } document.getElementById('btn-auto-size').addEventListener('click', autoSize);
        document.getElementById('btn-confirm-crop').addEventListener('click', async () => { const canvas = document.createElement('canvas'); canvas.width = 200; canvas.height = 200; const ctx = canvas.getContext('2d'); ctx.drawImage(currentImgObj, (200 - currentImgObj.width * scale) / 2 + translateX, (200 - currentImgObj.height * scale) / 2 + translateY, currentImgObj.width * scale, currentImgObj.height * scale); const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9); document.getElementById('avatar-box').innerHTML = `<img src="${croppedBase64}">`; document.getElementById('sidebar-avatar').innerHTML = `<img src="${croppedBase64}">`; cropModal.style.display = 'none'; if (currentUser) await updateDoc(doc(db, "users", currentUser.uid), { avatarUrl: croppedBase64 }); });

        // 3. Form Info
        document.getElementById('save-btn').addEventListener('click', async () => { const btn = document.getElementById('save-btn'); if (!currentUser) return; btn.innerText = "Đang lưu..."; btn.disabled = true; const name = document.getElementById('input-fullname').value.trim(); try { await updateDoc(doc(db, "users", currentUser.uid), { displayName: name, gender: document.getElementById('input-gender').value, dob: `${document.getElementById('input-dob-day').value}/${document.getElementById('input-dob-month').value}/${document.getElementById('input-dob-year').value}`, phone: document.getElementById('input-phone').value.trim(), cmnd: document.getElementById('input-cmnd').value.trim(), address: document.getElementById('input-address').value.trim(), email: document.getElementById('input-email').value.trim(), bio: document.getElementById('input-bio').value.trim() }); document.getElementById('display-fullname').innerText = name; document.getElementById('sidebar-name').innerText = name.toUpperCase(); alert("Cập nhật thông tin thành công!"); } catch (e) { alert("Lỗi khi lưu!"); } finally { btn.innerText = "Lưu lại"; btn.disabled = false; } });
        document.getElementById('logout-btn').addEventListener('click', () => { signOut(auth).then(() => { window.location.href = "index.html"; }); });
