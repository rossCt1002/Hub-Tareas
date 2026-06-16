// 📦 1. Importamos las librerías oficiales de Google Firebase desde internet
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 🔑 2. CONFIGURACIÓN DE TU PROYECTO (Pega aquí TUS claves de la pantalla negra)
const firebaseConfig = {
    apiKey: "AIzaSyAIB0q-CPjsz_DiwqNiT9KM-kRLOe6BEi8",
    authDomain: "hub-comunitario-de-tareas.firebaseapp.com",
    projectId: "hub-comunitario-de-tareas",
    storageBucket: "hub-comunitario-de-tareas.firebasestorage.app",
    messagingSenderId: "95771533288",
    appId: "1:95771533288:web:7459f1d405115253e38e5d"
};

// Inicializamos la conexión con Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencia a la colección "tareas" en la base de datos de la nube
const tareasRef = collection(db, "tareas");

// 📥 3. ESCUCHAR LA NUBE EN TIEMPO REAL (Trae los datos y pinta el tablón automáticamente)
const q = query(tareasRef, orderBy("fecha", "desc")); // Ordena para que la más nueva salga arriba

onSnapshot(q, (snapshot) => {
    const tablon = document.getElementById('tablon');
    tablon.innerHTML = ''; // Limpiamos el tablón viejo

    if (snapshot.empty) {
        tablon.innerHTML = '<p style="color: #64748b;">No hay tareas publicadas aún. ¡Sé el primero!</p>';
        return;
    }

    snapshot.forEach((docSnapshot) => {
        const tarea = docSnapshot.data();
        const idTarea = docSnapshot.id; // Agarramos el ID único que Google le asigna en la nube
        const esHecha = tarea.estado === 'hecha';

        const card = document.createElement('div');
        card.className = `card-tarea ${esHecha ? 'hecha' : ''}`;
        
        // Renderizar la imagen Base64 y el enlace si existen en la nube
        let imgHtml = tarea.imagen ? `<img src="${tarea.imagen}" class="img-preview" onclick="window.open('${tarea.imagen}')" title="Clic para ampliar">` : '';
        let linkHtml = tarea.enlace ? `<a href="${tarea.enlace}" target="_blank" class="link-tarea">🔗 Ver Enlace</a>` : '';

        card.innerHTML = `
            <!-- Le pasamos el ID real de Firebase a la función de borrar -->
            <button class="borrar-btn" onclick="window.borrarTarea('${idTarea}')">❌</button>
            <div class="materia">${tarea.materia}</div>
            <h3>${tarea.descripcion}</h3>
            <div class="status">${esHecha ? '✅ Resuelta y compartida' : '⏳ Pendiente de entregar'}</div>
            ${imgHtml}
            <div class="links-container">
                ${linkHtml}
            </div>
        `;
        tablon.appendChild(card);
    });
});

// 📤 4. PROCESAR Y AGREGAR LA TAREA A LA NUBE
const formulario = document.getElementById('formulario-tarea');

formulario.addEventListener('submit', (e) => {
    e.preventDefault(); // Evitamos que la página se recargue e interrumpa la subida

    const materia = document.getElementById('materia').value;
    const descripcion = document.getElementById('descripcion').value;
    const estado = document.getElementById('estado').value;
    const enlace = document.getElementById('enlace').value;
    const imagenInput = document.getElementById('imagenInput');

    // Si el usuario subió una imagen, la convertimos a texto Base64 antes de mandarla a la nube
    if (imagenInput.files && imagenInput.files[0]) {
        const reader = new FileReader();
        reader.onload = async function(event) {
            const base64Image = event.target.result;
            await subirAFirebase(materia, descripcion, estado, enlace, base64Image);
        };
        reader.readAsDataURL(imagenInput.files[0]);
    } else {
        // Si no hay imagen, se va en null
        subirAFirebase(materia, descripcion, estado, enlace, null);
    }
});

// Función interna para meter los campos ordenados a Cloud Firestore
async function subirAFirebase(materia, descripcion, estado, enlace, imagenData) {
    try {
        await addDoc(tareasRef, {
            materia: materia,
            descripcion: descripcion,
            estado: estado,
            enlace: enlace || null,
            imagen: imagenData,
            fecha: Date.now() // Guardamos la hora exacta de subida
        });

        // Limpiamos los campos del formulario tras el éxito
        formulario.reset();
        alert("¡Publicado en la nube del C.A.D. con éxito! 🚀");
    } catch (error) {
        console.error("Error al subir a Firebase: ", error);
        alert("⚠️ Hubo un fallo al subir la tarea. Revisa el tamaño de la imagen o tu conexión.");
    }
}

// 🗑️ 5. BORRAR TAREA DIRECTAMENTE DESDE LA NUBE
// La exponemos a "window" para que el botón del HTML con onclick pueda activarla sin broncas
window.borrarTarea = async function(id) {
    const confirmar = confirm("¿De verdad quieres borrar esta aportación del tablón común?");
    if (confirmar) {
        try {
            // Busca el documento por su ID en la nube y lo elimina
            await deleteDoc(doc(db, "tareas", id));
            alert("Aportación eliminada de la nube.");
        } catch (error) {
            console.error("Error al borrar: ", error);
        }
    }
};