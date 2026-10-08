// 🔗 FUENTE ÚNICA DE LA URL DEL BACKEND: reemplaza los ~50 "http://localhost:3001" que
// estaban repetidos y sueltos por todo el frontend.
// 🩹 BUG REAL CONFIRMADO (2026-08-01): esto antes leía VITE_API_URL (una IP de LAN para
// probar desde el celular) — una variable de build tiene prioridad incluso sobre un build
// de producción en Vite, así que esa IP privada terminó publicada en meiti.dev. Relativo
// ('') funciona siempre, sin variable de entorno: en dev, vite.config.ts hace de proxy de
// '/api' hacia el backend local; en producción, nginx hace exactamente lo mismo.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';

// 🔗 [EXPORT, 2026-10-08] En una app exportada los moldes traen escrita la URL del backend local
// ("http://localhost:4001", ver reescribirUrlBackend en server.js). Sirve en la PC y en el
// instalador de escritorio, pero subida a la web (Vercel, Netlify) apuntaba a la PC de quien abre
// la página: VITE_API_URL existía y los moldes no la leían. Se cambia acá, en un solo lugar, antes
// de compilar cada molde. En MEITI API_BASE_URL es '' y esto no cambia nada.
const URL_BACKEND_LOCAL_EXPORT = 'http://localhost:4001';
export const adaptarUrlBackendDelMolde = (codigo) =>
  (API_BASE_URL && API_BASE_URL !== URL_BACKEND_LOCAL_EXPORT && typeof codigo === 'string')
    ? codigo.split(URL_BACKEND_LOCAL_EXPORT).join(API_BASE_URL.replace(/\/$/, ''))
    : codigo;
