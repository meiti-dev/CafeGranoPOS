import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const CafeGranoPOS_muv12ucj__CG_HistorialTurnos = ({ datos, tema, UI, MEITI }) => {
  const [turnos, setTurnos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ id: '', monto_cierre_real: '', estado: '' });

  const esAdmin = MEITI.miRolEnLaApp() === 'admin' || MEITI.soyDuenoDeLaApp();
  const eco = MEITI.obtenerEcosistemaActual();
  const urlTurnos = `/api/boveda/${MEITI.obtenerTabla('cg_caja_turnos')}?ecosistema=${eco}`;

  const cargarDatos = async () => {
    if (!esAdmin) return;
    setCargando(true);
    const [resTurnos, resVentas] = await Promise.all([
      MEITI.fetchDatos(urlTurnos),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_ventas')}?ecosistema=${eco}`)
    ]);

    if (!resTurnos.ok || !resVentas.ok) {
      setError(resTurnos.error || resVentas.error || MEITI.t('err_load_shifts', null, 'Error al cargar el historial.'));
    } else {
      setTurnos(resTurnos.registros || []);
      setVentas(resVentas.registros || []);
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (!esAdmin) return <UI.Aviso tono="alerta" mensaje={MEITI.t('admin_only', null, 'Esta sección es solo para administradores.')} />;

  const guardarEdicion = async (e) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    const turnoOriginal = turnos.find(t => t.id === form.id);
    if (!turnoOriginal) return;

    const payload = {
      ...turnoOriginal,
      monto_cierre_real: Number(form.monto_cierre_real),
      estado: form.estado
    };

    await MEITI.mutar(urlTurnos, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('shift_updated', null, 'Turno actualizado correctamente.'));
        setEditando(null);
        cargarDatos();
      },
      alFallar: (err) => setError(err || MEITI.t('err_update_shift', null, 'No se pudo actualizar el turno.'))
    });
  };

  const borrarTurno = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('confirm_delete_shift', null, '¿Borrar este registro de turno? Las ventas asociadas no se borrarán, pero perderán su referencia de caja.'), { titulo: MEITI.t('delete', null, 'Borrar'), confirmar: MEITI.t('yes_delete', null, 'Sí, borrar'), tono: 'peligro' })) return;
    
    setError(null);
    setExito(null);
    
    await MEITI.mutar(`${urlTurnos}&id=${id}`, {
      method: 'DELETE'
    }, {
      alLograr: () => {
        setExito(MEITI.t('shift_deleted', null, 'Turno eliminado.'));
        if (editando === id) setEditando(null);
        cargarDatos();
      },
      alFallar: (err) => setError(err || MEITI.t('err_delete_shift', null, 'No se pudo eliminar el turno.'))
    });
  };

  const abrirEdicion = (fila) => {
    setEditando(fila.id);
    setForm({
      id: fila.id,
      monto_cierre_real: fila.monto_cierre_real !== null ? String(fila.monto_cierre_real) : '',
      estado: fila.estado || 'abierto'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const turnosEnriquecidos = turnos.map(t => {
    const ventasDelTurno = ventas.filter(v => v.turno_id === t.id && v.estado !== 'anulada');
    const totalVendido = ventasDelTurno.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    const esperado = (Number(t.monto_apertura) || 0) + totalVendido;
    const diferencia = t.estado === 'cerrado' ? (Number(t.monto_cierre_real) || 0) - esperado : 0;
    
    return {
      ...t,
      total_vendido: totalVendido,
      diferencia: diferencia
    };
  }).sort((a, b) => new Date(b.fecha_apertura || 0) - new Date(a.fecha_apertura || 0));

  const columnas = [
    { clave: 'fecha_apertura', etiqueta: MEITI.t('col_open_date', null, 'Apertura'), tipo: 'fecha' },
    { clave: 'autor_id', etiqueta: MEITI.t('col_cashier', null, 'Cajero'), render: (f) => <span className="opacity-80">{f.autor_id?.split('@')[0] || '---'}</span> },
    { clave: 'monto_apertura', etiqueta: MEITI.t('col_base', null, 'Base'), tipo: 'moneda' },
    { clave: 'total_vendido', etiqueta: MEITI.t('col_sales', null, 'Ventas'), tipo: 'moneda' },
    { clave: 'monto_cierre_real', etiqueta: MEITI.t('col_real_close', null, 'Cierre Real'), render: (f) => f.estado === 'cerrado' ? `$${(Number(f.monto_cierre_real)||0).toFixed(2)}` : '---' },
    { clave: 'diferencia', etiqueta: MEITI.t('col_diff', null, 'Diferencia'), render: (f) => {
      if (f.estado !== 'cerrado') return <span className="opacity-50">---</span>;
      const color = f.diferencia < 0 ? '#ef4444' : f.diferencia > 0 ? '#10b981' : tema.texto;
      return <span className="font-mono font-bold" style={{ color }}>{f.diferencia > 0 ? '+' : ''}${f.diferencia.toFixed(2)}</span>;
    }},
    { clave: 'estado', etiqueta: MEITI.t('col_status', null, 'Estado'), render: (f) => (
      <UI.Chip tono={f.estado === 'abierto' ? 'exito' : 'neutro'}>{f.estado?.toUpperCase()}</UI.Chip>
    )}
  ];

  return (
    <div className="flex flex-col gap-6">
      <Animacion.AnimatePresence>
        {editando && (
          <Animacion.motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <UI.Tarjeta className="mb-2">
              <div className="flex items-center gap-2 mb-4">
                <Iconos.Pencil size={20} color={tema.colorPrimario} />
                <UI.Etiqueta>{MEITI.t('edit_shift', null, 'Corregir Turno')}</UI.Etiqueta>
              </div>
              <form onSubmit={guardarEdicion} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex-1">
                    <UI.Campo 
                      etiqueta={MEITI.t('f_real_close', null, 'Monto Cierre Real')}
                      tipo="number"
                      valor={form.monto_cierre_real}
                      onChange={(e) => setForm({...form, monto_cierre_real: e.target.value})}
                    />
                  </div>
                  <div className="flex-1">
                    <UI.Campo 
                      etiqueta={MEITI.t('f_status', null, 'Estado del Turno')}
                      tipo="select"
                      valor={form.estado}
                      onChange={(e) => setForm({...form, estado: e.target.value})}
                      opciones={[{value: 'abierto', label: MEITI.t('opt_open', null, 'Abierto')}, {value: 'cerrado', label: MEITI.t('opt_closed', null, 'Cerrado')}]}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <UI.Boton tipo="submit" variante="primario">
                    <span className="flex items-center gap-2"><Iconos.Save size={16} /> {MEITI.t('btn_save', null, 'Guardar Cambios')}</span>
                  </UI.Boton>
                  <UI.Boton tipo="button" variante="secundario" onClick={() => setEditando(null)}>
                    <span className="flex items-center gap-2"><Iconos.X size={16} /> {MEITI.t('btn_cancel', null, 'Cancelar')}</span>
                  </UI.Boton>
                </div>
              </form>
            </UI.Tarjeta>
          </Animacion.motion.div>
        )}
      </Animacion.AnimatePresence>

      <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <UI.Tarjeta className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Iconos.ListChecks size={20} color={tema.colorSecundario} />
              <UI.Etiqueta>{MEITI.t('shift_history', null, 'Historial de Turnos')}</UI.Etiqueta>
            </div>
            <UI.Boton onClick={cargarDatos} variante="secundario" ariaLabel={MEITI.t('refresh', null, 'Actualizar')}>
              <Iconos.RefreshCw size={16} />
            </UI.Boton>
          </div>

          <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
          <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

          {cargando ? (
            <div className="p-8 text-center"><Iconos.LoaderCircle className="animate-spin mx-auto mb-4" size={32} color={tema.colorPrimario} /><UI.Etiqueta>{MEITI.t('loading_shifts', null, 'Cargando historial...')}</UI.Etiqueta></div>
          ) : turnosEnriquecidos.length === 0 ? (
            <UI.EstadoVacio icono="fa-cash-register" mensaje={MEITI.t('no_shifts', null, 'Todavía no hay turnos registrados en la caja.')} />
          ) : (
            <UI.TablaDatos 
              columnas={columnas} 
              datos={turnosEnriquecidos} 
              claveId="id" 
              onEditar={abrirEdicion} 
              onBorrar={(fila) => borrarTurno(fila.id)} 
            />
          )}
        </UI.Tarjeta>
      </Animacion.motion.div>
    </div>
  );
};

export default CafeGranoPOS_muv12ucj__CG_HistorialTurnos;
