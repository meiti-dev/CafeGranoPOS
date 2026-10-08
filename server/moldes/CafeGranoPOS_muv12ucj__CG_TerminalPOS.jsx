/* global React, useState, useEffect, useRef, useMemo, useCallback, datos, tema, UI, MEITI, LIBRERIAS_PREMIUM, Iconos, Animacion, Graficos, render */
// Molde de MEITI: este archivo es el código que corre la app (server/server.js lo carga al arrancar; si lo cambias, reinicia el backend).
({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const miId = MEITI.obtenerUsuarioActual();
  
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  const [catActiva, setCatActiva] = useState('todas');
  const [carrito, setCarrito] = useState([]);
  const [verCarrito, setVerCarrito] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [medioSeleccionado, setMedioSeleccionado] = useState('');
  const [pagoEfectivo, setPagoEfectivo] = useState('');

  const cargarDatos = async () => {
    setCargando(true);
    const [resProd, resCat, resMedios, resTurnos] = await Promise.all([
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_productos')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_categorias')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_medios_pago')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_caja_turnos')}?ecosistema=${eco}`)
    ]);

    if (resProd.ok) setProductos(resProd.registros.filter(p => String(p.disponible) === '1').map(p => ({...p, precio: Number(p.precio || 0)})).sort((a, b) => (a.orden || 0) - (b.orden || 0)));
    if (resCat.ok) setCategorias(resCat.registros.sort((a, b) => (a.orden || 0) - (b.orden || 0)));
    if (resMedios.ok) {
      const activos = resMedios.registros.filter(m => String(m.activo) === '1');
      setMediosPago(activos);
      if (activos.length > 0) setMedioSeleccionado(activos[0].nombre);
    }
    if (resTurnos.ok) {
      const abierto = resTurnos.registros.find(t => t.estado === 'abierto');
      setTurnoActivo(abierto || null);
    }
    setCargando(false);
  };

  useEffect(() => { cargarDatos(); }, []);

  const agregarAlCarrito = (prod) => {
    setCarrito(prev => {
      const existe = prev.find(i => i.producto_id === prod.id);
      if (existe) return prev.map(i => i.producto_id === prod.id ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio_unitario } : i);
      return [...prev, { producto_id: prod.id, nombre: prod.nombre, cantidad: 1, precio_unitario: prod.precio, subtotal: prod.precio }];
    });
  };

  const modificarCantidad = (id, delta) => {
    setCarrito(prev => {
      return prev.map(i => {
        if (i.producto_id === id) {
          const nuevaCant = Math.max(0, i.cantidad + delta);
          return { ...i, cantidad: nuevaCant, subtotal: nuevaCant * i.precio_unitario };
        }
        return i;
      }).filter(i => i.cantidad > 0);
    });
  };

  const totalCarrito = carrito.reduce((acc, item) => acc + item.subtotal, 0);
  const vuelto = parseFloat(pagoEfectivo) > totalCarrito ? parseFloat(pagoEfectivo) - totalCarrito : 0;

  const confirmarVenta = async () => {
    if (carrito.length === 0 || !turnoActivo || !medioSeleccionado) return;
    setProcesando(true);
    setError(null);

    const ventaId = 'vta_' + Date.now();
    const mutaciones = [
      {
        url: `/api/boveda/${MEITI.obtenerTabla('cg_ventas')}?ecosistema=${eco}`,
        opciones: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: ventaId,
            autor_id: miId,
            turno_id: turnoActivo.id,
            total: totalCarrito,
            medio_pago: medioSeleccionado,
            estado: 'completada',
            fecha_registro: new Date().toISOString()
          })
        }
      },
      ...carrito.map(item => ({
        url: `/api/boveda/${MEITI.obtenerTabla('cg_venta_items')}?ecosistema=${eco}`,
        opciones: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: 'vi_' + Date.now() + Math.random().toString(36).substring(7),
            venta_id: ventaId,
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.subtotal
          })
        }
      }))
    ];

    await MEITI.mutarVarias(mutaciones, {
      alLograr: () => {
        setCarrito([]);
        setVerCarrito(false);
        setPagoEfectivo('');
        setProcesando(false);
      },
      alFallar: (err) => {
        setError(err || MEITI.t('err_sale', null, 'Error al procesar la venta.'));
        setProcesando(false);
      }
    });
  };

  if (cargando) return <div className="p-8 text-center"><Iconos.LoaderCircle size={32} className="animate-spin mx-auto" color={tema.colorPrimario} /></div>;

  if (!turnoActivo) return (
    <UI.Tarjeta className="text-center py-12 flex flex-col items-center gap-4">
      <Iconos.Lock size={48} color={tema.colorSecundario} />
      <h2 className="text-2xl font-bold" style={{color: tema.texto}}>{MEITI.t('register_closed', null, 'La caja está cerrada')}</h2>
      <p className="opacity-70" style={{color: tema.texto}}>{MEITI.t('register_closed_desc', null, 'Debes abrir un turno de caja antes de poder registrar ventas.')}</p>
      <UI.Boton onClick={() => MEITI.irAPagina('caja')} variante="primario">{MEITI.t('go_to_register', null, 'Ir a Caja')}</UI.Boton>
    </UI.Tarjeta>
  );

  const prodsFiltrados = catActiva === 'todas' ? productos : productos.filter(p => p.categoria_id === catActiva);

  return (
    <div className="flex flex-col gap-4 pb-32">
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      
      <div className="flex gap-2 overflow-x-auto snap-x pb-2 px-1">
        <button
          onClick={() => setCatActiva('todas')}
          className="snap-start whitespace-nowrap px-5 py-2.5 rounded-full font-bold transition-all"
          style={{ background: catActiva === 'todas' ? tema.colorPrimario : tema.superficie, color: catActiva === 'todas' ? '#fff' : tema.texto, border: `1px solid ${tema.colorPrimario}33` }}
        >
          {MEITI.t('all_cats', null, 'Todas')}
        </button>
        {categorias.map(c => (
          <button
            key={c.id}
            onClick={() => setCatActiva(c.id)}
            className="snap-start whitespace-nowrap px-5 py-2.5 rounded-full font-bold transition-all"
            style={{ background: catActiva === c.id ? tema.colorPrimario : tema.superficie, color: catActiva === c.id ? '#fff' : tema.texto, border: `1px solid ${tema.colorPrimario}33` }}
          >
            {c.nombre}
          </button>
        ))}
      </div>

      {prodsFiltrados.length === 0 ? (
        <UI.EstadoVacio icono="fa-mug-hot" mensaje={MEITI.t('no_products', null, 'No hay productos en esta categoría.')} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {prodsFiltrados.map(p => (
            <button 
              key={p.id} 
              onClick={() => agregarAlCarrito(p)}
              className="flex flex-col items-center text-center p-3 rounded-2xl transition-transform active:scale-95 shadow-sm"
              style={{ background: tema.superficie, border: `1px solid ${tema.texto}11` }}
            >
              <div className="w-16 h-16 rounded-xl mb-2 overflow-hidden bg-black/5 flex items-center justify-center">
                {p.imagen_url ? <img src={p.imagen_url} alt={p.nombre} className="w-full h-full object-cover" /> : <Iconos.Coffee size={24} color={tema.colorPrimario} />}
              </div>
              <span className="font-bold text-sm leading-tight line-clamp-2" style={{color: tema.texto}}>{p.nombre}</span>
              <span className="font-black mt-1" style={{color: tema.colorSecundario}}>${p.precio.toFixed(2)}</span>
            </button>
          ))}
        </div>
      )}

      {carrito.length > 0 && (
        <div className="fixed bottom-24 inset-x-4 z-30">
          <button 
            onClick={() => setVerCarrito(true)}
            className="w-full py-4 rounded-2xl font-black text-lg shadow-2xl flex items-center justify-between px-6"
            style={{ background: tema.colorSecundario, color: '#fff' }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-3 py-1 rounded-full text-sm">{carrito.reduce((a, b) => a + b.cantidad, 0)}</div>
              <span>{MEITI.t('view_ticket', null, 'Ver Ticket')}</span>
            </div>
            <span>${totalCarrito.toFixed(2)}</span>
          </button>
        </div>
      )}

      <Animacion.AnimatePresence>
        {verCarrito && (
          <>
            <Animacion.motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40"
              onClick={() => setVerCarrito(false)}
            />
            <Animacion.motion.div 
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 z-50 rounded-t-3xl flex flex-col shadow-2xl max-h-[85vh]"
              style={{ background: tema.fondo }}
            >
              <div className="p-4 flex justify-center shrink-0">
                <div className="w-12 h-1.5 rounded-full opacity-20" style={{ background: tema.texto }} />
              </div>
              
              <div className="px-6 pb-4 flex justify-between items-center shrink-0 border-b" style={{ borderColor: tema.texto + '11' }}>
                <h2 className="text-2xl font-black" style={{ color: tema.texto }}>{MEITI.t('current_ticket', null, 'Ticket en Curso')}</h2>
                <button onClick={() => setCarrito([])} className="text-sm font-bold text-red-500">{MEITI.t('clear_all', null, 'Vaciar')}</button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                {carrito.map(item => (
                  <div key={item.producto_id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-bold" style={{ color: tema.texto }}>{item.nombre}</div>
                      <div className="text-sm opacity-70" style={{ color: tema.texto }}>${item.precio_unitario.toFixed(2)} c/u</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => modificarCantidad(item.producto_id, -1)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: tema.superficie, color: tema.texto, border: `1px solid ${tema.texto}22` }}><Iconos.Minus size={16} /></button>
                      <span className="font-black w-6 text-center" style={{ color: tema.texto }}>{item.cantidad}</span>
                      <button onClick={() => modificarCantidad(item.producto_id, 1)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: tema.colorPrimario, color: '#fff' }}><Iconos.Plus size={16} /></button>
                    </div>
                    <div className="w-20 text-right font-bold" style={{ color: tema.texto }}>${item.subtotal.toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div className="p-6 shrink-0 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]" style={{ background: tema.superficie }}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold opacity-70" style={{ color: tema.texto }}>{MEITI.t('total', null, 'Total')}</span>
                  <span className="text-3xl font-black" style={{ color: tema.colorPrimario }}>${totalCarrito.toFixed(2)}</span>
                </div>

                <div className="mb-4">
                  <UI.Etiqueta>{MEITI.t('payment_method', null, 'Medio de Pago')}</UI.Etiqueta>
                  <div className="flex gap-2 overflow-x-auto snap-x pb-2 mt-2">
                    {mediosPago.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setMedioSeleccionado(m.nombre)}
                        className="snap-start whitespace-nowrap px-4 py-2 rounded-xl font-bold transition-all"
                        style={{ background: medioSeleccionado === m.nombre ? tema.colorSecundario : tema.fondo, color: medioSeleccionado === m.nombre ? '#fff' : tema.texto, border: `1px solid ${tema.colorSecundario}44` }}
                      >
                        {m.nombre}
                      </button>
                    ))}
                  </div>
                </div>

                {String(medioSeleccionado || '').toLowerCase().includes('efectivo') && (
                  <div className="mb-6 flex gap-4 items-end">
                    <div className="flex-1">
                      <UI.Campo etiqueta={MEITI.t('cash_received', null, 'Efectivo Recibido')} tipo="number" valor={pagoEfectivo} onChange={e => setPagoEfectivo(e.target.value)} placeholder="0.00" />
                    </div>
                    <div className="flex-1 p-3 rounded-xl text-center" style={{ background: vuelto > 0 ? '#10b98122' : tema.fondo, border: `1px solid ${vuelto > 0 ? '#10b981' : tema.texto + '22'}` }}>
                      <div className="text-xs font-bold opacity-70 uppercase" style={{ color: tema.texto }}>{MEITI.t('change', null, 'Vuelto')}</div>
                      <div className="font-black text-lg" style={{ color: vuelto > 0 ? '#10b981' : tema.texto }}>${vuelto.toFixed(2)}</div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={confirmarVenta}
                  disabled={procesando || carrito.length === 0}
                  className="w-full py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-2"
                  style={{ background: tema.colorPrimario, color: '#fff', opacity: procesando ? 0.7 : 1 }}
                >
                  <Iconos.CheckCircle size={24} />
                  {procesando ? MEITI.t('processing', null, 'Procesando...') : MEITI.t('confirm_sale', null, 'Cobrar Ticket')}
                </button>
              </div>
            </Animacion.motion.div>
          </>
        )}
      </Animacion.AnimatePresence>
    </div>
  );
}