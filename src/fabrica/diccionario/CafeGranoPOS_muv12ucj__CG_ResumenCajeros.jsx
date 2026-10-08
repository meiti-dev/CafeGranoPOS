import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const CafeGranoPOS_muv12ucj__CG_ResumenCajeros = ({ datos, tema, UI, MEITI }) => {
  const [turnos, setTurnos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const esAdmin = MEITI.miRolEnLaApp() === 'admin' || MEITI.soyDuenoDeLaApp();

  const cargarDatos = async () => {
    if (!esAdmin) return;
    setCargando(true);
    const eco = MEITI.obtenerEcosistemaActual();
    const [resTurnos, resVentas] = await Promise.all([
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_caja_turnos')}?ecosistema=${eco}`),
      MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_ventas')}?ecosistema=${eco}`)
    ]);

    if (!resTurnos.ok || !resVentas.ok) {
      setError(resTurnos.error || resVentas.error || MEITI.t('err_load_data', null, 'Error al cargar los datos.'));
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

  if (cargando) return <UI.Tarjeta><div className="p-8 text-center"><Iconos.LoaderCircle className="animate-spin mx-auto mb-4" size={32} color={tema.colorPrimario} /><UI.Etiqueta>{MEITI.t('loading_stats', null, 'Calculando estadísticas...')}</UI.Etiqueta></div></UI.Tarjeta>;

  const ventasValidas = ventas.filter(v => v.estado !== 'anulada');
  const totalVendido = ventasValidas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
  const turnosCerrados = turnos.filter(t => t.estado === 'cerrado');
  
  let descuadreTotal = 0;
  turnosCerrados.forEach(t => {
    const ventasDelTurno = ventasValidas.filter(v => v.turno_id === t.id).reduce((acc, v) => acc + (Number(v.total) || 0), 0);
    const esperado = (Number(t.monto_apertura) || 0) + ventasDelTurno;
    descuadreTotal += (Number(t.monto_cierre_real) || 0) - esperado;
  });

  const ventasPorCajero = ventasValidas.reduce((acc, v) => {
    const cajero = v.autor_id || 'Desconocido';
    acc[cajero] = (acc[cajero] || 0) + (Number(v.total) || 0);
    return acc;
  }, {});

  const datosGrafico = Object.keys(ventasPorCajero).map(c => ({
    nombre: c.split('@')[0],
    ventas: ventasPorCajero[c]
  })).sort((a, b) => b.ventas - a.ventas);

  return (
    <div className="flex flex-col gap-6">
      <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <UI.Tarjeta className="flex items-center gap-4 p-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: tema.colorPrimario + '22', color: tema.colorPrimario }}>
              <Iconos.Banknote size={28} />
            </div>
            <div>
              <UI.Etiqueta>{MEITI.t('total_sales', null, 'Ventas Totales')}</UI.Etiqueta>
              <div className="text-2xl font-black font-mono" style={{ color: tema.texto }}>${totalVendido.toFixed(2)}</div>
            </div>
          </UI.Tarjeta>
        </Animacion.motion.div>

        <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <UI.Tarjeta className="flex items-center gap-4 p-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: tema.colorSecundario + '22', color: tema.colorSecundario }}>
              <Iconos.History size={28} />
            </div>
            <div>
              <UI.Etiqueta>{MEITI.t('total_shifts', null, 'Turnos Registrados')}</UI.Etiqueta>
              <div className="text-2xl font-black font-mono" style={{ color: tema.texto }}>{turnos.length}</div>
            </div>
          </UI.Tarjeta>
        </Animacion.motion.div>

        <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <UI.Tarjeta className="flex items-center gap-4 p-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: (descuadreTotal < 0 ? '#ef4444' : '#10b981') + '22', color: descuadreTotal < 0 ? '#ef4444' : '#10b981' }}>
              <Iconos.Scale size={28} />
            </div>
            <div>
              <UI.Etiqueta>{MEITI.t('total_diff', null, 'Descuadre Histórico')}</UI.Etiqueta>
              <div className="text-2xl font-black font-mono" style={{ color: descuadreTotal < 0 ? '#ef4444' : '#10b981' }}>
                {descuadreTotal > 0 ? '+' : ''}${descuadreTotal.toFixed(2)}
              </div>
            </div>
          </UI.Tarjeta>
        </Animacion.motion.div>
      </div>

      <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
        <UI.Tarjeta>
          <div className="flex items-center gap-2 mb-6">
            <Iconos.ChartColumn size={20} color={tema.colorPrimario} />
            <h3 className="font-bold text-lg" style={{ color: tema.texto }}>{MEITI.t('sales_by_cashier', null, 'Ventas por Cajero')}</h3>
          </div>
          
          {datosGrafico.length === 0 ? (
            <UI.EstadoVacio icono="fa-chart-simple" mensaje={MEITI.t('no_sales_chart', null, 'Todavía no hay ventas registradas para graficar.')} />
          ) : (
            <div className="w-full h-80">
              <Graficos.ResponsiveContainer width="100%" height="100%">
                <Graficos.BarChart data={datosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <Graficos.CartesianGrid strokeDasharray="3 3" stroke={tema.texto + '22'} vertical={false} />
                  <Graficos.XAxis dataKey="nombre" stroke={tema.texto} fontSize={12} tickLine={false} axisLine={false} />
                  <Graficos.YAxis stroke={tema.texto} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                  <Graficos.Tooltip 
                    cursor={{ fill: tema.texto + '11' }}
                    contentStyle={{ backgroundColor: tema.superficie, borderColor: tema.colorPrimario + '44', borderRadius: '8px', color: tema.texto }}
                    itemStyle={{ color: tema.colorPrimario, fontWeight: 'bold' }}
                    formatter={(value) => [`$${value.toFixed(2)}`, MEITI.t('sales', null, 'Ventas')]}
                  />
                  <Graficos.Bar dataKey="ventas" fill={tema.colorPrimario} radius={[4, 4, 0, 0]} />
                </Graficos.BarChart>
              </Graficos.ResponsiveContainer>
            </div>
          )}
        </UI.Tarjeta>
      </Animacion.motion.div>
    </div>
  );
};

export default CafeGranoPOS_muv12ucj__CG_ResumenCajeros;
