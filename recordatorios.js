const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "tareas-2do-bachillerato.firebaseapp.com",
  projectId: "tareas-2do-bachillerato",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT  = process.env.TG_CHAT;

const MATERIAS = {
  tutoria:"Tutoría", adbdd:"Análisis y Diseño de Base de Datos",
  edufisica:"Educación Física", lenglit:"Lengua y Literatura",
  mate:"Matemática", bio:"Biología", quimica:"Química",
  disweb:"Diseño Web", fisica:"Física", ingles:"Inglés",
  empgest:"Emprendimiento y Gestión", poo:"Programación Orientada a Objetos",
  historia:"Historia", filosofia:"Filosofía", educiud:"Educación a la Ciudadanía",
  educultart:"Educación Cultural y Artística", edurelig:"Educación Religiosa Escolar",
  aes:"AES (PPE)"
};

function fechaLegible(iso) {
  const [y,m,d] = iso.split("-");
  const meses = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  return `${parseInt(d)} de ${meses[parseInt(m)-1]} de ${y}`;
}

async function enviarTelegram(texto) {
  const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TG_CHAT, text: texto, parse_mode: "HTML" })
  });
  const data = await res.json();
  console.log("Telegram:", data.ok ? "enviado" : data.description);
}

async function main() {
  const hoy = new Date();
  hoy.setHours(0,0,0,0);

  const snap = await getDocs(collection(db, "tareas"));
  const tareas = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  let enviados = 0;
  for (const t of tareas) {
    if (!t.fecha) continue;
    const entrega = new Date(t.fecha + "T00:00:00");
    const diffDias = Math.round((entrega - hoy) / (1000 * 60 * 60 * 24));
    const materia = MATERIAS[t.materia] || t.materia;

    if (diffDias === 3) {
      await enviarTelegram(`⏰ <b>Recordatorio — 3 días para la entrega</b>\n\n📖 <b>Materia:</b> ${materia}\n📝 <b>Tarea:</b> ${t.titulo}\n📅 <b>Entrega:</b> ${fechaLegible(t.fecha)}\n\n¡Organiza tu tiempo! 💪`);
      enviados++;
    } else if (diffDias === 1) {
      await enviarTelegram(`🚨 <b>¡Entrega mañana!</b>\n\n📖 <b>Materia:</b> ${materia}\n📝 <b>Tarea:</b> ${t.titulo}\n📅 <b>Entrega:</b> ${fechaLegible(t.fecha)}\n\n¡Último día, no olvides entregar! 🏃`);
      enviados++;
    }
  }
  console.log(`Revisión completada. ${enviados} recordatorio(s) enviado(s).`);
}

main().catch(console.error);
