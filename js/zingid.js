import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

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

// 1. Tải thông tin hiển thị lên Zing ID
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        try {
            const docSnap = await getDoc(doc(db, "users", user.uid));
            if (docSnap.exists()) {
                const data = docSnap.data();
                const dispName = data.displayName || data.fullname || "Khách";
                
                // Hiển thị dữ liệu lên màn hình
                document.getElementById('header-username').innerText = dispName;
                document.getElementById('display-username').innerText = dispName;
                document.getElementById('sub-email').innerText = user.email || data.email || "(Chưa có)";
                document.getElementById('sub-uid').innerText = user.uid.substring(0, 10).toUpperCase(); // Rút gọn ID cho đẹp
                
                if (data.email) document.getElementById('display-email').innerText = data.email;
                if (data.phone) document.getElementById('display-phone').innerText = data.phone;
            }
        } catch (e) { console.error(e); }
    } else {
        window.location.href = "index.html";
    }
});

// 2. Nút Thoát
document.getElementById('btn-logout').addEventListener('click', (e) => {
    e.preventDefault();
    signOut(auth).then(() => { window.location.href = "index.html"; });
});

// 3. Hiệu ứng Mở bảng Đổi mật khẩu
const btnShowPass = document.getElementById('btn-show-change-pass');
const passBox = document.getElementById('change-pass-box');
const btnCancel = document.getElementById('btn-cancel-change');

btnShowPass.addEventListener('click', (e) => {
    e.preventDefault();
    passBox.style.display = 'block';
});
btnCancel.addEventListener('click', () => {
    passBox.style.display = 'none';
    document.getElementById('input-new-pass').value = '';
});

// 4. Xử lý Đổi mật khẩu (Chuẩn bảo mật Firebase)
document.getElementById('btn-confirm-change').addEventListener('click', async () => {
    // Lấy dữ liệu từ các ô nhập
    const oldPass = document.getElementById('input-old-pass').value;
    const newPass = document.getElementById('input-new-pass').value;
    const confirmPass = document.getElementById('input-confirm-pass').value;
    const captcha = document.getElementById('input-captcha').value;

    // A. KIỂM TRA ĐIỀU KIỆN (VALIDATION)
    if (!oldPass || !newPass || !confirmPass || !captcha) {
        alert("Vui lòng nhập đầy đủ thông tin!"); return;
    }
    if (newPass.length < 6) {
        alert("Mật khẩu mới phải từ 6 ký tự trở lên!"); return;
    }
    if (newPass !== confirmPass) {
        alert("Mật khẩu mới và Xác nhận mật khẩu không khớp nhau!"); return;
    }
    // Mã captcha giả lập dựa theo hình ảnh (XMEFH3)
    if (captcha.toUpperCase() !== "XMEFH3") {
        alert("Mã kiểm tra không chính xác!"); return;
    }

    // B. TIẾN HÀNH ĐỔI MẬT KHẨU TRÊN FIREBASE
    try {
        // Bước 1: Xác thực lại bằng mật khẩu cũ (Bắt buộc của Firebase)
        const credential = EmailAuthProvider.credential(currentUser.email, oldPass);
        await reauthenticateWithCredential(currentUser, credential);

        // Bước 2: Tiến hành cập nhật mật khẩu mới
        await updatePassword(currentUser, newPass);
        
        // Thành công!
        alert("Cập nhật thành công! Mật khẩu Zing ID của bạn đã được thay đổi.");
        
        // Đóng form và dọn dẹp các ô nhập liệu
        document.getElementById('change-pass-box').style.display = 'none';
        document.getElementById('input-old-pass').value = '';
        document.getElementById('input-new-pass').value = '';
        document.getElementById('input-confirm-pass').value = '';
        document.getElementById('input-captcha').value = '';

    } catch (error) {
        // Xử lý các lỗi trả về từ Firebase
        if (error.code === 'auth/invalid-credential') {
            alert("Mật khẩu hiện tại không đúng, vui lòng kiểm tra lại!");
        } else {
            alert("Đã xảy ra lỗi: " + error.message);
        }
    }
});

// Nút Bỏ qua (Xóa dữ liệu khi tắt)
document.getElementById('btn-cancel-change').addEventListener('click', () => {
    document.getElementById('change-pass-box').style.display = 'none';
    document.getElementById('input-old-pass').value = '';
    document.getElementById('input-new-pass').value = '';
    document.getElementById('input-confirm-pass').value = '';
    document.getElementById('input-captcha').value = '';
});
