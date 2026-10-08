import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const CafeGranoPOS_muv12ucj__CG_GestionCaja = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();
  
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  const [montoApertura, setMontoApertura] = useState('');
  const [montoCierre, setMontoCierre] = useState('');
  
  const [verModalMov, setVerModalMov] = useState(false);
  const [formMov, setFormMov] = useState({ tipo: 'retiro', monto: '', concepto: '' });

  const cargarDatos = async () => {
    setCargando(true);
    const resTurnos = await MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_caja_turnos')}?ecosistema=${eco}`);
    
    if (resTurnos.ok) {
      const abierto = resTurnos.registros.find(t => t.estado === 'abierto');
      setTurnoActivo(abierto || null);
      
      if (abierto) {
        const [resVentas, resMovs] = await Promise.all([
          MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_ventas')}?ecosistema=${eco}`),
          MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_caja_movimientos')}?ecosistema=${eco}`)
        ]);
        if (resVentas.ok) setVentas(resVentas.registros.filter(v => v.turno_id === abierto.id && v.estado === 'completada'));
        if (resMovs.ok) setMovimientos(resMovs.registros.filter(m => m.turno_id === abierto.id));
      }
    }
    setCargando(false);
  };

  useEffect(() => { cargarDatos(); }, []);

  const abrirCaja = async () => {
    if (montoApertura === '' || isNaN(parseFloat(montoApertura))) return setError(MEITI.t('err_open_amount', null, 'Ingresa un monto inicial válido.'));
    setError(null);
    
    const payload = {
      id: 'turno_' + Date.now(),
      autor_id: miId,
      fecha_apertura: new Date().toISOString(),
      monto_apertura: parseFloat(montoApertura),
      estado: 'abierto'
    };
    
    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('cg_caja_turnos')}?ecosistema=${eco}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => { setMontoApertura(''); cargarDatos(); },
      alFallar: setError
    });
  };

  const registrarMovimiento = async () => {
    if (!formMov.monto || isNaN(parseFloat(formMov.monto)) || !formMov.concepto.trim()) return setError(MEITI.t('err_mov_fields', null, 'Completa monto y concepto.'));
    setError(null);
    
    const payload = {
      id: 'mov_' + Date.now(),
      autor_id: miId,
      turno_id: turnoActivo.id,
      tipo: formMov.tipo,
      monto: parseFloat(formMov.monto),
      concepto: formMov.concepto.trim(),
      fecha_registro: new Date().toISOString()
    };

    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('cg_caja_movimientos')}?ecosistema=${eco}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => { setVerModalMov(false); setFormMov({ tipo: 'retiro', monto: '', concepto: '' }); cargarDatos(); },
      alFallar: setError
    });
  };

  const cerrarCaja = async () => {
    if (montoCierre === '' || isNaN(parseFloat(montoCierre))) return setError(MEITI.t('err_close_amount', null, 'Ingresa el monto real en caja.'));
    if (!await MEITI.confirmar(MEITI.t('confirm_close_q', null, '¿Estás seguro de cerrar la caja? Ya no podrás registrar ventas en este turno.'))) return;
    setError(null);
    
    const payload = {
      ...turnoActivo,
      estado: 'cerrado',
      fecha_cierre: new Date().toISOString(),
      monto_cierre_real: parseFloat(montoCierre)
    };

    await MEITI.mutar(`/api/boveda/${MEITI.obtenerTabla('cg_caja_turnos')}?ecosistema=${eco}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => { setMontoCierre(''); cargarDatos(); },
      alFallar: setError
    });
  };

  if (cargando) return <div className="p-8 text-center"><Iconos.LoaderCircle size={32} className="animate-spin mx-auto" color={tema.colorPrimario} /></div>;

  if (!turnoActivo) return (
    <div className="flex flex-col gap-6 pb-28">
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      <UI.Tarjeta className="text-center py-12 flex flex-col items-center gap-6">
        <div className="w-24 h-24 rounded-full flex items-center justify-center bg-black/5">
          <Iconos.KeyRound size={48} color={tema.colorPrimario} />
        </div>
        <div>
          <h2 className="text-3xl font-black" style={{color: tema.texto}}>{MEITI.t('open_register', null, 'Apertura de Caja')}</h2>
          <p className="opacity-70 mt-2" style={{color: tema.texto}}>{MEITI.t('open_register_desc', null, 'Ingresa el monto de cambio inicial para comenzar el turno.')}</p>
        </div>
        <div className="w-full max-w-xs">
          <UI.Campo etiqueta={MEITI.t('initial_cash', null, 'Fondo de Caja Inicial ($)')} tipo="number" valor={montoApertura} onChange={e => setMontoApertura(e.target.value)} placeholder="0.00" />
        </div>
        <UI.Boton onClick={abrirCaja} variante="primario" className="w-full max-w-xs py-4 text-lg">{MEITI.t('btn_open_register', null, 'Abrir Turno')}</UI.Boton>
      </UI.Tarjeta>
    </div>
  );

  const ventasEfectivo = ventas.filter(v => (v.medio_pago || '').toLowerCase().includes('efectivo')).reduce((acc, v) => acc + v.total, 0);
  const ventasOtros = ventas.filter(v => !(v.medio_pago || '').toLowerCase().includes('efectivo')).reduce((acc, v) => acc + v.total, 0);
  const ingresos = movimientos.filter(m => m.tipo === 'ingreso').reduce((acc, m) => acc + m.monto, 0);
  const retiros = movimientos.filter(m => m.tipo === 'retiro').reduce((acc, m) => acc + m.monto, 0);
  const efectivoEsperado = turnoActivo.monto_apertura + ventasEfectivo + ingresos - retiros;

  return (
    <div className="flex flex-col gap-6 pb-32">
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UI.Tarjeta className="p-6 flex flex-col gap-2" style={{ background: tema.colorPrimario, color: '#fff' }}>
          <span className="font-bold opacity-80 uppercase tracking-wider text-sm">{MEITI.t('expected_cash', null, 'Efectivo Esperado en Caja')}</span>
          <span className="text-5xl font-black">${efectivoEsperado.toFixed(2)}</span>
          <div className="text-sm opacity-90 mt-2">
            {MEITI.t('initial', null, 'Inicial')}: ${turnoActivo.monto_apertura.toFixed(2)} | {MEITI.t('cash_sales', null, 'Ventas Ef.')}: ${ventasEfectivo.toFixed(2)}
          </div>
        </UI.Tarjeta>

        <UI.Tarjeta className="p-6 flex flex-col gap-2">
          <span className="font-bold opacity-70 uppercase tracking-wider text-sm" style={{color: tema.texto}}>{MEITI.t('other_sales', null, 'Ventas Tarjeta / QR')}</span>
          <span className="text-4xl font-black" style={{color: tema.colorSecundario}}>${ventasOtros.toFixed(2)}</span>
          <div className="text-sm opacity-70 mt-2" style={{color: tema.texto}}>
            {MEITI.t('total_sales', null, 'Total Vendido')}: ${(ventasEfectivo + ventasOtros).toFixed(2)}
          </div>
        </UI.Tarjeta>
      </div>

      <UI.Tarjeta>
        <div className="flex justify-between items-center mb-4">
          <UI.Etiqueta>{MEITI.t('movements', null, 'Movimientos de Caja')}</UI.Etiqueta>
          <UI.Boton onClick={() => setVerModalMov(true)} variante="secundario">+ {MEITI.t('add_movement', null, 'Registrar')}</UI.Boton>
        </div>
        {movimientos.length === 0 ? (
          <UI.EstadoVacio icono="fa-money-bill-transfer" mensaje={MEITI.t('no_movements', null, 'No hay retiros ni ingresos extra en este turno.')} />
        ) : (
          <div className="flex flex-col gap-3">
            {movimientos.map(m => (
              <div key={m.id} className="flex justify-between items-center p-3 rounded-xl" style={{ background: tema.fondo }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: m.tipo === 'ingreso' ? '#10b98122' : '#ef444422', color: m.tipo === 'ingreso' ? '#10b981' : '#ef4444' }}>
                    <Iconos.ArrowUpDown size={20} />
                  </div>
                  <div>
                    <div className="font-bold" style={{color: tema.texto}}>{m.concepto}</div>
                    <div className="text-xs opacity-70" style={{color: tema.texto}}>{new Date(m.fecha_registro).toLocaleTimeString()}</div>
                  </div>
                </div>
                <div className="font-black" style={{color: m.tipo === 'ingreso' ? '#10b981' : '#ef4444'}}>
                  {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </UI.Tarjeta>

      <UI.Tarjeta className="border-2" style={{ borderColor: tema.colorPrimario + '44' }}>
        <UI.Etiqueta>{MEITI.t('close_register', null, 'Arqueo y Cierre de Caja')}</UI.Etiqueta>
        <p className="text-sm opacity-70 mb-4" style={{color: tema.texto}}>{MEITI.t('close_desc', null, 'Cuenta el dinero físico y regístralo aquí para cerrar el turno.')}</p>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <UI.Campo etiqueta={MEITI.t('actual_cash', null, 'Efectivo Real Contado ($)')} tipo="number" valor={montoCierre} onChange={e => setMontoCierre(e.target.value)} placeholder="0.00" />
          </div>
          <UI.Boton onClick={cerrarCaja} variante="primario" className="w-full md:w-auto py-3 px-8">{MEITI.t('btn_close_register', null, 'Cerrar Turno')}</UI.Boton>
        </div>
      </UI.Tarjeta>

      <Animacion.AnimatePresence>
        {verModalMov && (
          <>
            <Animacion.motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40" onClick={() => setVerModalMov(false)} />
            <Animacion.motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl p-6 flex flex-col gap-4 shadow-2xl" style={{ background: tema.fondo }}>
              <div className="w-12 h-1.5 rounded-full mx-auto opacity-20 mb-2" style={{ background: tema.texto }} />
              <h3 className="text-xl font-black" style={{color: tema.texto}}>{MEITI.t('new_movement', null, 'Nuevo Movimiento')}</h3>
              <UI.Campo etiqueta={MEITI.t('mov_type', null, 'Tipo')} tipo="select" valor={formMov.tipo} onChange={e => setFormMov({...formMov, tipo: e.target.value})} opciones={[{value:'retiro', label: MEITI.t('withdrawal', null, 'Retiro de Dinero')}, {value:'ingreso', label: MEITI.t('deposit', null, 'Ingreso Extra')}]} />
              <UI.Campo etiqueta={MEITI.t('amount', null, 'Monto ($)')} tipo="number" valor={formMov.monto} onChange={e => setFormMov({...formMov, monto: e.target.value})} />
              <UI.Campo etiqueta={MEITI.t('concept', null, 'Concepto / Motivo')} tipo="text" valor={formMov.concepto} onChange={e => setFormMov({...formMov, concepto: e.target.value})} placeholder={MEITI.t('ph_concept', null, 'Ej: Pago a proveedor, Cambio extra')} />
              <UI.Boton onClick={registrarMovimiento} variante="primario" className="py-4 mt-2">{MEITI.t('save_movement', null, 'Guardar Movimiento')}</UI.Boton>
            </Animacion.motion.div>
          </>
        )}
      </Animacion.AnimatePresence>
    </div>
  );
};

export default CafeGranoPOS_muv12ucj__CG_GestionCaja;
