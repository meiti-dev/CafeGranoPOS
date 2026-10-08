import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const CafeGranoPOS_muv12ucj__CG_GestorProductos = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();
  
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  
  const vacio = { id: '', nombre: '', categoria_id: '', precio: '', imagen_url: '', disponible: '1' };
  const [form, setForm] = useState(vacio);
  const [verForm, setVerForm] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    setCargando(true);
    const [resProd, resCat] = await Promise.all([
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_productos')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_categorias')}?ecosistema=${eco}`)
    ]);
    if (resProd.ok) setProductos(resProd.registros.sort((a,b) => (a.orden||0)-(b.orden||0)));
    if (resCat.ok) setCategorias(resCat.registros);
    setCargando(false);
  };

  useEffect(() => { cargarDatos(); }, []);

  const subirFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const r = await MEITI.subirArchivo(file);
    if (r.ok) setForm({ ...form, imagen_url: r.url });
    else setError(r.motivo || MEITI.t('err_upload', null, 'Error al subir imagen.'));
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.categoria_id || !form.precio) return setError(MEITI.t('err_req_fields', null, 'Nombre, categoría y precio son obligatorios.'));
    setError(null); setExito(null); setGuardando(true);

    const payload = {
      id: form.id || 'prod_' + Date.now(),
      autor_id: miId,
      nombre: form.nombre.trim(),
      categoria_id: form.categoria_id,
      precio: parseFloat(form.precio),
      imagen_url: form.imagen_url,
      disponible: parseInt(form.disponible),
      orden: form.id ? form.orden : productos.length
    };

    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('cg_productos')}?ecosistema=${eco}`, {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('saved_success', null, 'Producto guardado.'));
        setForm(vacio);
        setVerForm(false);
        cargarDatos();
        setGuardando(false);
      },
      alFallar: (err) => { setError(err); setGuardando(false); }
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('confirm_delete_prod', null, '¿Borrar este producto del catálogo?'))) return;
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('cg_productos')}?ecosistema=${eco}&id=${id}`, { method: 'DELETE' }, {
      alLograr: cargarDatos,
      alFallar: setError
    });
  };

  const editar = (fila) => {
    setForm({ id: fila.id, nombre: fila.nombre, categoria_id: fila.categoria_id, precio: String(fila.precio), imagen_url: fila.imagen_url || '', disponible: String(fila.disponible), orden: fila.orden });
    setVerForm(true);
  };

  const columnas = [
    { clave: 'imagen_url', etiqueta: 'Img', render: f => f.imagen_url ? <img src={f.imagen_url} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-black/10 flex items-center justify-center"><i className="fa-solid fa-mug-hot" style={{ fontSize: '16px', opacity: 0.5 }}></i></div> },
    { clave: 'nombre', etiqueta: MEITI.t('name', null, 'Nombre'), render: f => <span className="font-bold">{f.nombre}</span> },
    { clave: 'precio', etiqueta: MEITI.t('price', null, 'Precio'), tipo: 'moneda' },
    { clave: 'disponible', etiqueta: MEITI.t('status', null, 'Estado'), render: f => <UI.Chip tono={String(f.disponible)==='1' ? 'exito' : 'neutro'}>{String(f.disponible)==='1' ? 'Activo' : 'Pausado'}</UI.Chip> }
  ];

  if (cargando) return <div className="p-8 text-center"><i className="fa-solid fa-spinner fa-spin mx-auto" style={{ fontSize: '32px', color: tema.colorPrimario }}></i></div>;

  return (
    <div className="flex flex-col gap-6 pb-28">
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

      <UI.Tarjeta>
        <div className="flex justify-between items-center mb-4">
          <UI.Etiqueta>{MEITI.t('catalog', null, 'Catálogo de Productos')}</UI.Etiqueta>
          <UI.Boton onClick={() => { setForm(vacio); setVerForm(true); }} variante="primario">+ {MEITI.t('new', null, 'Nuevo')}</UI.Boton>
        </div>
        {productos.length === 0 ? (
          <UI.EstadoVacio icono="fa-box-open" mensaje={MEITI.t('no_products_yet', null, 'No hay productos cargados.')} />
        ) : (
          <UI.TablaDatos columnas={columnas} datos={productos} claveId="id" onEditar={editar} onBorrar={(f) => borrar(f.id)} />
        )}
      </UI.Tarjeta>

      <Animacion.AnimatePresence>
        {verForm && (
          <>
            <Animacion.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40" onClick={() => setVerForm(false)} />
            <Animacion.motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl p-6 flex flex-col gap-4 shadow-2xl max-h-[90vh] overflow-y-auto" style={{ background: tema.fondo }}>
              <div className="w-12 h-1.5 rounded-full mx-auto opacity-20 mb-2 shrink-0" style={{ background: tema.texto }} />
              <h3 className="text-2xl font-black" style={{color: tema.texto}}>{form.id ? MEITI.t('edit_product', null, 'Editar Producto') : MEITI.t('new_product', null, 'Nuevo Producto')}</h3>
              
              <form onSubmit={guardar} className="flex flex-col gap-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: tema.superficie }}>
                  <div className="w-20 h-20 rounded-xl bg-black/5 overflow-hidden flex items-center justify-center shrink-0">
                    {form.imagen_url ? <img src={form.imagen_url} className="w-full h-full object-cover" /> : <i className="fa-solid fa-image" style={{ fontSize: '24px', opacity: 0.5 }}></i>}
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold mb-2" style={{color: tema.texto}}>{MEITI.t('photo', null, 'Foto del producto')}</label>
                    <input type="file" accept="image/*" onChange={subirFoto} className="text-sm w-full" />
                  </div>
                </div>

                <UI.Campo etiqueta={MEITI.t('name', null, 'Nombre')} tipo="text" valor={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-4">
                  <UI.Campo etiqueta={MEITI.t('price', null, 'Precio ($)')} tipo="number" valor={form.precio} onChange={e => setForm({...form, precio: e.target.value})} />
                  <UI.Campo etiqueta={MEITI.t('category', null, 'Categoría')} tipo="select" valor={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value})} opciones={[{value:'', label: MEITI.t('select', null, 'Seleccionar...')}, ...categorias.map(c => ({value: c.id, label: c.nombre}))]} />
                </div>

                <UI.Campo etiqueta={MEITI.t('status', null, 'Disponibilidad')} tipo="select" valor={form.disponible} onChange={e => setForm({...form, disponible: e.target.value})} opciones={[{value:'1', label: MEITI.t('available', null, 'Disponible')}, {value:'0', label: MEITI.t('unavailable', null, 'Agotado / Oculto')}]} />

                <UI.Boton tipo="submit" variante="primario" className="py-4 mt-2" disabled={guardando}>{guardando ? MEITI.t('saving', null, 'Guardando...') : MEITI.t('save', null, 'Guardar Producto')}</UI.Boton>
              </form>
            </Animacion.motion.div>
          </>
        )}
      </Animacion.AnimatePresence>
    </div>
  );
};

export default CafeGranoPOS_muv12ucj__CG_GestorProductos;
