import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
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

// 4. Xử lý Đổi mật khẩu
document.getElementById('btn-confirm-change').addEventListener('click', async () => {
    const newPass = document.getElementById('input-new-pass').value;
    if (newPass.length < 6) {
        alert("Mật khẩu phải từ 6 ký tự trở lên!"); return;
    }
    
    try {
        await updatePassword(currentUser, newPass);
        alert("Đổi mật khẩu thành công! Lần sau hãy đăng nhập bằng mật khẩu mới nhé.");
        passBox.style.display = 'none';
        document.getElementById('input-new-pass').value = '';
    } catch (error) {
        if (error.code === 'auth/requires-recent-login') {
            alert("Bảo mật Zing ID: Tài khoản đã đăng nhập quá lâu. Vui lòng Thoát ra và đăng nhập lại để đổi mật khẩu!");
        } else {
            alert("Lỗi: " + error.message);
        }
    }
});