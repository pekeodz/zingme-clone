import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
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

// Kiểm tra đăng nhập và lấy tên để chào
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const docSnap = await getDoc(doc(db, "users", user.uid));
            if (docSnap.exists()) {
                const data = docSnap.data();
                document.getElementById('welcome-name').innerText = data.displayName || data.fullname || "bạn";
                if(data.avatarUrl) {
                    document.getElementById('nav-avatar').innerHTML = `<img src="${data.avatarUrl}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
                }
            }
        } catch (e) { console.error(e); }
    } else {
        // Nếu chưa đăng nhập thì đẩy về trang index
        window.location.href = "index.html";
    }
});