import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const CafeGranoPOS_muv12ucj__CG_HistorialVentas = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const [ventas, setVentas] = useState([]);
  const [items, setItems] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  const [detalleVenta, setDetalleVenta] = useState(null);
  const [verAnular, setVerAnular] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    const [resVentas, resItems, resProd] = await Promise.all([
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_ventas')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_venta_items')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_productos')}?ecosistema=${eco}`)
    ]);

    if (resVentas.ok) setVentas([...resVentas.registros].sort((a, b) => new Date(b.fecha_registro) - new Date(a.fecha_registro)));
    if (resItems.ok) setItems(resItems.registros);
    if (resProd.ok) setProductos(resProd.registros);
    setCargando(false);
  };

  useEffect(() => { cargarDatos(); }, []);

  const anularVenta = async () => {
    if (!motivoAnulacion.trim()) return setError(MEITI.t('err_void_reason', null, 'Debes ingresar un motivo para la anulación.'));
    setError(null);

    const payload = {
      ...detalleVenta,
      estado: 'anulada',
      motivo_anulacion: motivoAnulacion.trim()
    };

    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('cg_ventas')}?ecosistema=${eco}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setVerAnular(false);
        setDetalleVenta(null);
        setMotivoAnulacion('');
        cargarDatos();
      },
      alFallar: setError
    });
  };

  const columnas = [
    { clave: 'id', etiqueta: MEITI.t('ticket_id', null, 'Ticket'), render: f => <span className="font-mono font-bold">#{f.id.slice(-6)}</span> },
    { clave: 'fecha_registro', etiqueta: MEITI.t('time', null, 'Hora'), render: f => new Date(f.fecha_registro).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) },
    { clave: 'total', etiqueta: MEITI.t('total', null, 'Total'), tipo: 'moneda' },
    { clave: 'medio_pago', etiqueta: MEITI.t('payment', null, 'Pago') },
    { clave: 'estado', etiqueta: MEITI.t('status', null, 'Estado'), render: f => <UI.Chip tono={f.estado === 'completada' ? 'exito' : 'peligro'}>{f.estado.toUpperCase()}</UI.Chip> }
  ];

  const accionesExtra = [
    {
      etiqueta: MEITI.t('view_details', null, 'Ver Detalle'),
      icono: 'fa-eye',
      tono: 'neutro',
      onClick: (f) => setDetalleVenta(f)
    }
  ];

  if (cargando) return <div className="p-8 text-center"><Iconos.LoaderCircle size={32} className="animate-spin mx-auto" color={tema.colorPrimario} /></div>;

  return (
    <div className="flex flex-col gap-6 pb-28">
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      
      <UI.Tarjeta>
        <div className="flex items-center gap-3 mb-4">
          <Iconos.ReceiptText size={24} color={tema.colorPrimario} />
          <UI.Etiqueta>{MEITI.t('sales_history', null, 'Historial de Tickets')}</UI.Etiqueta>
        </div>
        {ventas.length === 0 ? (
          <UI.EstadoVacio icono="fa-receipt" mensaje={MEITI.t('no_sales', null, 'No hay ventas registradas aún.')} />
        ) : (
          <UI.TablaDatos columnas={columnas} datos={ventas} claveId="id" accionesExtra={accionesExtra} advertirAccionIncompleta={false} />
        )}
      </UI.Tarjeta>

      <Animacion.AnimatePresence>
        {detalleVenta && (
          <>
            <Animacion.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40" onClick={() => { setDetalleVenta(null); setVerAnular(false); }} />
            <Animacion.motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl p-6 flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-y-auto" style={{ background: tema.fondo }}>
              <div className="w-12 h-1.5 rounded-full mx-auto opacity-20 mb-2 shrink-0" style={{ background: tema.texto }} />
              
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-black" style={{color: tema.texto}}>{MEITI.t('ticket_details', null, 'Detalle del Ticket')}</h3>
                  <p className="font-mono opacity-70" style={{color: tema.texto}}>#{detalleVenta.id}</p>
                </div>
                <UI.Chip tono={detalleVenta.estado === 'completada' ? 'exito' : 'peligro'}>{detalleVenta.estado.toUpperCase()}</UI.Chip>
              </div>

              <div className="p-4 rounded-xl flex flex-col gap-3 my-2" style={{ background: tema.superficie }}>
                {items.filter(i => i.venta_id === detalleVenta.id).map(item => {
                  const prod = productos.find(p => p.id === item.producto_id);
                  return (
                    <div key={item.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0" style={{ borderColor: tema.texto + '11' }}>
                      <div className="flex items-center gap-3">
                        <span className="font-black" style={{color: tema.colorPrimario}}>{item.cantidad}x</span>
                        <span style={{color: tema.texto}}>{prod ? prod.nombre : 'Producto Eliminado'}</span>
                      </div>
                      <span className="font-bold" style={{color: tema.texto}}>${item.subtotal.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center p-4 rounded-xl" style={{ background: tema.colorPrimario, color: '#fff' }}>
                <span className="text-lg font-bold">{MEITI.t('total', null, 'Total')}</span>
                <span className="text-3xl font-black">${detalleVenta.total.toFixed(2)}</span>
              </div>

              <div className="text-sm opacity-70 text-center" style={{color: tema.texto}}>
                {MEITI.t('paid_with', null, 'Pagado con')}: <strong>{detalleVenta.medio_pago}</strong><br/>
                {new Date(detalleVenta.fecha_registro).toLocaleString()}
              </div>

              {detalleVenta.estado === 'anulada' && (
                <div className="p-4 rounded-xl mt-2" style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef4444' }}>
                  <strong>{MEITI.t('void_reason', null, 'Motivo de anulación')}:</strong> {detalleVenta.motivo_anulacion}
                </div>
              )}

              {detalleVenta.estado === 'completada' && !verAnular && (
                <UI.Boton onClick={() => setVerAnular(true)} variante="peligro" className="mt-4 py-3">{MEITI.t('btn_void_ticket', null, 'Anular Ticket')}</UI.Boton>
              )}

              {verAnular && (
                <div className="p-4 rounded-xl mt-4 flex flex-col gap-3 border-2" style={{ borderColor: '#ef4444', background: tema.superficie }}>
                  <UI.Etiqueta>{MEITI.t('confirm_void', null, 'Confirmar Anulación')}</UI.Etiqueta>
                  <UI.Campo etiqueta={MEITI.t('reason', null, 'Motivo')} tipo="text" valor={motivoAnulacion} onChange={e => setMotivoAnulacion(e.target.value)} placeholder={MEITI.t('ph_reason', null, 'Ej: Error de carga, cliente canceló')} />
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1"><UI.Boton onClick={anularVenta} variante="peligro" className="w-full">{MEITI.t('confirm', null, 'Confirmar')}</UI.Boton></div>
                    <div className="flex-1"><UI.Boton onClick={() => setVerAnular(false)} variante="secundario" className="w-full">{MEITI.t('cancel', null, 'Cancelar')}</UI.Boton></div>
                  </div>
                </div>
              )}
            </Animacion.motion.div>
          </>
        )}
      </Animacion.AnimatePresence>
    </div>
  );
};

export default CafeGranoPOS_muv12ucj__CG_HistorialVentas;
