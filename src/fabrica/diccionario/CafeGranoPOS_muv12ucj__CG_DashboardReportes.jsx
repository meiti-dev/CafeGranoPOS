import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const CafeGranoPOS_muv12ucj__CG_DashboardReportes = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();
  const [ventas, setVentas] = useState([]);
  const [items, setItems] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      const [resVentas, resItems, resProd] = await Promise.all([
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_ventas')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_venta_items')}?ecosistema=${eco}`),
        MEITI.fetchDatos(`/api/boveda/${MEITI.obtenerTabla('cg_productos')}?ecosistema=${eco}`)
      ]);
      if (resVentas.ok) setVentas(resVentas.registros.filter(v => v.estado === 'completada'));
      if (resItems.ok) setItems(resItems.registros);
      if (resProd.ok) setProductos(resProd.registros);
      setCargando(false);
    };
    cargar();
  }, []);

  if (cargando) return <div className="p-8 text-center"><i className="fa-solid fa-spinner fa-spin mx-auto" style={{ fontSize: '32px', color: tema.colorPrimario }}></i></div>;

  const hoyStr = new Date().toISOString().split('T')[0];
  const ventasHoy = ventas.filter(v => (v.fecha_registro || '').startsWith(hoyStr));
  const totalHoy = ventasHoy.reduce((acc, v) => acc + v.total, 0);
  const ticketPromedio = ventasHoy.length > 0 ? totalHoy / ventasHoy.length : 0;

  const ultimos7Dias = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const datosGraficoDias = ultimos7Dias.map(fecha => {
    const total = ventas.filter(v => (v.fecha_registro || '').startsWith(fecha)).reduce((acc, v) => acc + v.total, 0);
    return { fecha: fecha.slice(5), total };
  });

  const conteoProductos = {};
  items.forEach(item => {
    const v = ventas.find(v => v.id === item.venta_id);
    if (v) {
      conteoProductos[item.producto_id] = (conteoProductos[item.producto_id] || 0) + item.cantidad;
    }
  });
  const topProductos = Object.entries(conteoProductos)
    .map(([id, cant]) => ({ nombre: productos.find(p => p.id === id)?.nombre || 'Desc.', cantidad: cant }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6 pb-28">
      <div className="grid grid-cols-2 gap-4">
        <UI.Tarjeta className="p-5 flex flex-col gap-2" style={{ background: tema.colorPrimario, color: '#fff' }}>
          <i className="fa-solid fa-arrow-trend-up" style={{ fontSize: '24px', opacity: 0.8 }}></i>
          <span className="font-bold opacity-90 text-sm">{MEITI.t('sales_today', null, 'Ventas Hoy')}</span>
          <span className="text-3xl font-black">${totalHoy.toFixed(0)}</span>
        </UI.Tarjeta>
        <UI.Tarjeta className="p-5 flex flex-col gap-2" style={{ background: tema.colorSecundario, color: '#fff' }}>
          <i className="fa-solid fa-receipt" style={{ fontSize: '24px', opacity: 0.8 }}></i>
          <span className="font-bold opacity-90 text-sm">{MEITI.t('avg_ticket', null, 'Ticket Promedio')}</span>
          <span className="text-3xl font-black">${ticketPromedio.toFixed(0)}</span>
        </UI.Tarjeta>
      </div>

      <UI.Tarjeta>
        <UI.Etiqueta>{MEITI.t('last_7_days', null, 'Ventas últimos 7 días')}</UI.Etiqueta>
        {ventas.length === 0 ? (
          <UI.EstadoVacio icono="fa-chart-line" mensaje={MEITI.t('no_data_chart', null, 'No hay datos suficientes para graficar.')} />
        ) : (
          <div className="w-full h-64 mt-4">
            <Graficos.ResponsiveContainer width="100%" height="100%">
              <Graficos.BarChart data={datosGraficoDias}>
                <Graficos.CartesianGrid strokeDasharray="3 3" vertical={false} stroke={tema.texto + '22'} />
                <Graficos.XAxis dataKey="fecha" stroke={tema.texto} fontSize={12} tickLine={false} axisLine={false} />
                <Graficos.Tooltip cursor={{fill: tema.texto+'11'}} contentStyle={{borderRadius:'12px', border:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}} />
                <Graficos.Bar dataKey="total" fill={tema.colorPrimario} radius={[4, 4, 0, 0]} />
              </Graficos.BarChart>
            </Graficos.ResponsiveContainer>
          </div>
        )}
      </UI.Tarjeta>

      <UI.Tarjeta>
        <UI.Etiqueta>{MEITI.t('top_products', null, 'Productos más vendidos')}</UI.Etiqueta>
        {topProductos.length === 0 ? (
          <UI.EstadoVacio icono="fa-star" mensaje={MEITI.t('no_top_products', null, 'Aún no hay productos vendidos.')} />
        ) : (
          <div className="flex flex-col gap-3 mt-4">
            {topProductos.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: tema.fondo }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm" style={{ background: tema.colorSecundario + '22', color: tema.colorSecundario }}>{i+1}</div>
                  <span className="font-bold" style={{color: tema.texto}}>{p.nombre}</span>
                </div>
                <span className="font-black" style={{color: tema.texto}}>{p.cantidad} u.</span>
              </div>
            ))}
          </div>
        )}
      </UI.Tarjeta>
    </div>
  );
};

export default CafeGranoPOS_muv12ucj__CG_DashboardReportes;
