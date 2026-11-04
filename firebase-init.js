// Conexión única a Firebase para todo el sitio (menu, admin y membresia).
// Si algún día cambias de proyecto, solo se edita este archivo.
//
// Estos valores son públicos por diseño: lo que protege los datos son las
// reglas de firestore.rules y storage.rules.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyCVR9iwuyZFN0KcA2DbZCclPNx7VyLK4Qw",
    authDomain: "shells-menu.firebaseapp.com",
    projectId: "shells-menu",
    storageBucket: "shells-menu.firebasestorage.app",
    messagingSenderId: "110017418057",
    appId: "1:110017418057:web:a903c5cb43aa6945478098",
    measurementId: "G-1VYX6VG3MJ"
};

export const app = initializeApp(firebaseConfig);

// Crear una cuenta inicia sesión con ella. Se hace en una segunda instancia para
// que la dueña no pierda su sesión al dar de alta a un empleado.
export const secondaryApp = () => initializeApp(firebaseConfig, "alta-empleados");

// Analytics se carga aparte: si un bloqueador lo impide, el resto del sitio sigue funcionando.
import("https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js")
    .then(async ({ getAnalytics, isSupported }) => {
        if (await isSupported()) getAnalytics(app);
    })
    .catch(() => {});
