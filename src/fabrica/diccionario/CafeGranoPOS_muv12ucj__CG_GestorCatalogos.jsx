import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const CafeGranoPOS_muv12ucj__CG_GestorCatalogos = ({ datos, tema, UI, MEITI }) => {
  const esAdmin = MEITI.miRolEnLaApp() === 'admin' || MEITI.soyDuenoDeLaApp();

  const PESTANAS = [
    { id: 'categorias', titulo: MEITI.t('tab_categories', null, 'Categorías'), icono: 'fa-tags', tabla: 'cg_categorias' },
    { id: 'medios_pago', titulo: MEITI.t('tab_payments', null, 'Medios de Pago'), icono: 'fa-credit-card', tabla: 'cg_medios_pago' },
    { id: 'motivos_anulacion', titulo: MEITI.t('tab_voids', null, 'Motivos Anulación'), icono: 'fa-ban', tabla: 'cg_motivos_anulacion' },
    { id: 'descuentos', titulo: MEITI.t('tab_discounts', null, 'Descuentos'), icono: 'fa-percent', tabla: 'cg_descuentos' }
  ];

  const [pestanaActiva, setPestanaActiva] = useState('categorias');
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  
  const [form, setForm] = useState({});
  const [editando, setEditando] = useState(false);

  const cargarDatos = async () => {
    if (!esAdmin) return;
    setCargando(true);
    const tab = PESTANAS.find(p => p.id === pestanaActiva);
    const url = `/api/boveda/${MEITI.obtenerTabla(tab.tabla)}?ecosistema=${MEITI.obtenerEcosistemaActual()}`;
    
    const res = await MEITI.fetchDatos(url);
    if (res.ok) {
      let data = res.registros || [];
      if (pestanaActiva === 'categorias') data = data.sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
      setRegistros(data);
    } else {
      setError(res.error || MEITI.t('err_load_catalog', null, 'Error al cargar el catálogo.'));
    }
    setCargando(false);
  };

  useEffect(() => {
    cargarDatos();
    setForm({});
    setEditando(false);
    setError(null);
    setExito(null);
  }, [pestanaActiva]);

  if (!esAdmin) return <UI.Aviso tono="alerta" mensaje={MEITI.t('admin_only', null, 'Esta sección es solo para administradores.')} />;

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    setExito(null);

    if (pestanaActiva === 'categorias' && !form.nombre) return setError(MEITI.t('err_req_name', null, 'El nombre es obligatorio.'));
    if (pestanaActiva === 'medios_pago' && !form.nombre) return setError(MEITI.t('err_req_name', null, 'El nombre es obligatorio.'));
    if (pestanaActiva === 'motivos_anulacion' && !form.motivo) return setError(MEITI.t('err_req_reason', null, 'El motivo es obligatorio.'));
    if (pestanaActiva === 'descuentos' && !form.nombre) return setError(MEITI.t('err_req_name', null, 'El nombre es obligatorio.'));

    setGuardando(true);
    const tab = PESTANAS.find(p => p.id === pestanaActiva);
    const url = `/api/boveda/${MEITI.obtenerTabla(tab.tabla)}?ecosistema=${MEITI.obtenerEcosistemaActual()}`;
    
    let payload = { ...form, autor_id: MEITI.obtenerUsuarioActual() };
    if (!editando) {
      payload.id = `${pestanaActiva}_${Date.now()}`;
    }

    if (pestanaActiva === 'categorias') payload.orden = Number(payload.orden) || 0;
    if (pestanaActiva === 'medios_pago') {
      payload.requiere_comprobante = Number(payload.requiere_comprobante ?? 0);
      payload.activo = Number(payload.activo ?? 1);
    }
    if (pestanaActiva === 'motivos_anulacion') payload.activo = Number(payload.activo ?? 1);
    if (pestanaActiva === 'descuentos') {
      payload.porcentaje = Number(payload.porcentaje) || 0;
      payload.activo = Number(payload.activo ?? 1);
    }

    await MEITI.mutar(url, {
      method: editando ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }, {
      alLograr: () => {
        setExito(MEITI.t('save_success', null, 'Registro guardado correctamente.'));
        setForm({});
        setEditando(false);
        cargarDatos();
        setGuardando(false);
      },
      alFallar: (err) => {
        setError(err || MEITI.t('save_error', null, 'Error al guardar el registro.'));
        setGuardando(false);
      }
    });
  };

  const borrar = async (id) => {
    if (!await MEITI.confirmar(MEITI.t('confirm_delete_cat', null, '¿Borrar este registro del catálogo?'), { titulo: MEITI.t('delete', null, 'Borrar'), confirmar: MEITI.t('yes_delete', null, 'Sí, borrar'), tono: 'peligro' })) return;
    
    setError(null);
    setExito(null);
    const tab = PESTANAS.find(p => p.id === pestanaActiva);
    const url = `/api/boveda/${MEITI.obtenerTabla(tab.tabla)}?ecosistema=${MEITI.obtenerEcosistemaActual()}&id=${id}`;
    
    await MEITI.mutar(url, { method: 'DELETE' }, {
      alLograr: () => {
        setExito(MEITI.t('delete_success', null, 'Registro eliminado.'));
        if (form.id === id) {
          setForm({});
          setEditando(false);
        }
        cargarDatos();
      },
      alFallar: (err) => setError(err || MEITI.t('delete_error', null, 'Error al eliminar el registro.'))
    });
  };

  const abrirEdicion = (fila) => {
    setForm({ ...fila });
    setEditando(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setForm({});
    setEditando(false);
    setError(null);
    setExito(null);
  };

  const renderFormulario = () => {
    if (pestanaActiva === 'categorias') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex-1">
            <UI.Campo etiqueta={MEITI.t('f_name', null, 'Nombre')} tipo="text" valor={form.nombre || ''} onChange={e => setForm({...form, nombre: e.target.value})} placeholder={MEITI.t('ph_cat_name', null, 'Ej: Bebidas Calientes')} />
          </div>
          <div className="flex-1">
            <UI.Campo etiqueta={MEITI.t('f_color', null, 'Color (Hex)')} tipo="text" valor={form.color || ''} onChange={e => setForm({...form, color: e.target.value})} placeholder="#FF0000" />
          </div>
          <div className="flex-1">
            <UI.Campo etiqueta={MEITI.t('f_order', null, 'Orden')} tipo="number" valor={form.orden || ''} onChange={e => setForm({...form, orden: e.target.value})} placeholder="1" />
          </div>
        </div>
      );
    }
    if (pestanaActiva === 'medios_pago') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex-1">
            <UI.Campo etiqueta={MEITI.t('f_name', null, 'Nombre')} tipo="text" valor={form.nombre || ''} onChange={e => setForm({...form, nombre: e.target.value})} placeholder={MEITI.t('ph_pay_name', null, 'Ej: Tarjeta de Crédito')} />
          </div>
          <div className="flex-1">
            <UI.Campo etiqueta={MEITI.t('f_req_receipt', null, 'Requiere Comprobante')} tipo="select" valor={String(form.requiere_comprobante ?? '0')} onChange={e => setForm({...form, requiere_comprobante: e.target.value})} opciones={[{value:'1', label:MEITI.t('yes', null, 'Sí')}, {value:'0', label:MEITI.t('no', null, 'No')}]} />
          </div>
          <div className="flex-1">
            <UI.Campo etiqueta={MEITI.t('f_active', null, 'Activo')} tipo="select" valor={String(form.activo ?? '1')} onChange={e => setForm({...form, activo: e.target.value})} opciones={[{value:'1', label:MEITI.t('yes', null, 'Sí')}, {value:'0', label:MEITI.t('no', null, 'No')}]} />
          </div>
        </div>
      );
    }
    if (pestanaActiva === 'motivos_anulacion') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex-1">
            <UI.Campo etiqueta={MEITI.t('f_reason', null, 'Motivo')} tipo="text" valor={form.motivo || ''} onChange={e => setForm({...form, motivo: e.target.value})} placeholder={MEITI.t('ph_reason', null, 'Ej: Error de tipeo')} />
          </div>
          <div className="flex-1">
            <UI.Campo etiqueta={MEITI.t('f_active', null, 'Activo')} tipo="select" valor={String(form.activo ?? '1')} onChange={e => setForm({...form, activo: e.target.value})} opciones={[{value:'1', label:MEITI.t('yes', null, 'Sí')}, {value:'0', label:MEITI.t('no', null, 'No')}]} />
          </div>
        </div>
      );
    }
    if (pestanaActiva === 'descuentos') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex-1">
            <UI.Campo etiqueta={MEITI.t('f_name', null, 'Nombre')} tipo="text" valor={form.nombre || ''} onChange={e => setForm({...form, nombre: e.target.value})} placeholder={MEITI.t('ph_disc_name', null, 'Ej: Empleado')} />
          </div>
          <div className="flex-1">
            <UI.Campo etiqueta={MEITI.t('f_percent', null, 'Porcentaje (%)')} tipo="number" valor={form.porcentaje || ''} onChange={e => setForm({...form, porcentaje: e.target.value})} placeholder="15" />
          </div>
          <div className="flex-1">
            <UI.Campo etiqueta={MEITI.t('f_active', null, 'Activo')} tipo="select" valor={String(form.activo ?? '1')} onChange={e => setForm({...form, activo: e.target.value})} opciones={[{value:'1', label:MEITI.t('yes', null, 'Sí')}, {value:'0', label:MEITI.t('no', null, 'No')}]} />
          </div>
        </div>
      );
    }
    return null;
  };

  const obtenerColumnas = () => {
    if (pestanaActiva === 'categorias') return [
      { clave: 'nombre', etiqueta: MEITI.t('col_name', null, 'Nombre') },
      { clave: 'color', etiqueta: MEITI.t('col_color', null, 'Color'), render: (f) => <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full border" style={{backgroundColor: f.color || 'transparent', borderColor: tema.texto+'33'}}></div><span className="opacity-70 font-mono text-xs">{f.color || '---'}</span></div> },
      { clave: 'orden', etiqueta: MEITI.t('col_order', null, 'Orden') }
    ];
    if (pestanaActiva === 'medios_pago') return [
      { clave: 'nombre', etiqueta: MEITI.t('col_name', null, 'Nombre') },
      { clave: 'requiere_comprobante', etiqueta: MEITI.t('col_req_receipt', null, 'Req. Comprobante'), render: (f) => <UI.Chip tono={Number(f.requiere_comprobante) === 1 ? 'exito' : 'neutro'}>{Number(f.requiere_comprobante) === 1 ? MEITI.t('yes', null, 'Sí') : MEITI.t('no', null, 'No')}</UI.Chip> },
      { clave: 'activo', etiqueta: MEITI.t('col_active', null, 'Activo'), render: (f) => <UI.Chip tono={Number(f.activo) === 1 ? 'exito' : 'peligro'}>{Number(f.activo) === 1 ? MEITI.t('yes', null, 'Sí') : MEITI.t('no', null, 'No')}</UI.Chip> }
    ];
    if (pestanaActiva === 'motivos_anulacion') return [
      { clave: 'motivo', etiqueta: MEITI.t('col_reason', null, 'Motivo') },
      { clave: 'activo', etiqueta: MEITI.t('col_active', null, 'Activo'), render: (f) => <UI.Chip tono={Number(f.activo) === 1 ? 'exito' : 'peligro'}>{Number(f.activo) === 1 ? MEITI.t('yes', null, 'Sí') : MEITI.t('no', null, 'No')}</UI.Chip> }
    ];
    if (pestanaActiva === 'descuentos') return [
      { clave: 'nombre', etiqueta: MEITI.t('col_name', null, 'Nombre') },
      { clave: 'porcentaje', etiqueta: MEITI.t('col_percent', null, 'Porcentaje'), render: (f) => <span className="font-bold" style={{color: tema.colorSecundario}}>{f.porcentaje}%</span> },
      { clave: 'activo', etiqueta: MEITI.t('col_active', null, 'Activo'), render: (f) => <UI.Chip tono={Number(f.activo) === 1 ? 'exito' : 'peligro'}>{Number(f.activo) === 1 ? MEITI.t('yes', null, 'Sí') : MEITI.t('no', null, 'No')}</UI.Chip> }
    ];
    return [];
  };

  return (
    <div className="flex flex-col gap-6">
      <UI.Pestanas pestanas={PESTANAS} activa={pestanaActiva} onCambio={setPestanaActiva} />

      <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} key={`form-${pestanaActiva}`}>
        <UI.Tarjeta>
          <div className="flex items-center gap-2 mb-4">
            <Iconos.Settings2 size={20} color={tema.colorPrimario} />
            <UI.Etiqueta>{editando ? MEITI.t('edit_record', null, 'Editar Registro') : MEITI.t('new_record', null, 'Nuevo Registro')}</UI.Etiqueta>
          </div>
          
          <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError(null)} />
          <UI.Aviso mensaje={exito} tono="exito" onCerrar={() => setExito(null)} />

          <form onSubmit={guardar} className="flex flex-col gap-4">
            {renderFormulario()}
            <div className="flex gap-2 mt-2">
              <UI.Boton tipo="submit" variante="primario" disabled={guardando}>
                <span className="flex items-center gap-2">
                  <Iconos.Save size={16} /> 
                  {guardando ? MEITI.t('saving', null, 'Guardando...') : (editando ? MEITI.t('btn_update', null, 'Actualizar') : MEITI.t('btn_create', null, 'Crear Registro'))}
                </span>
              </UI.Boton>
              {editando && (
                <UI.Boton tipo="button" variante="secundario" onClick={cancelarEdicion}>
                  <span className="flex items-center gap-2"><Iconos.X size={16} /> {MEITI.t('btn_cancel', null, 'Cancelar')}</span>
                </UI.Boton>
              )}
            </div>
          </form>
        </UI.Tarjeta>
      </Animacion.motion.div>

      <Animacion.motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} key={`list-${pestanaActiva}`}>
        <UI.Tarjeta className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Iconos.List size={20} color={tema.colorSecundario} />
            <UI.Etiqueta>{MEITI.t('catalog_list', null, 'Registros del Catálogo')}</UI.Etiqueta>
          </div>
          
          {cargando ? (
            <div className="p-8 text-center">
              <Iconos.LoaderCircle className="animate-spin mx-auto mb-4" size={32} color={tema.colorPrimario} />
              <UI.Etiqueta>{MEITI.t('loading_catalog', null, 'Cargando catálogo...')}</UI.Etiqueta>
            </div>
          ) : registros.length === 0 ? (
            <UI.EstadoVacio icono="fa-folder-open" mensaje={MEITI.t('empty_catalog', null, 'No hay registros en este catálogo todavía.')} />
          ) : (
            <UI.TablaDatos 
              columnas={obtenerColumnas()} 
              datos={registros} 
              claveId="id" 
              onEditar={abrirEdicion} 
              onBorrar={(fila) => borrar(fila.id)} 
            />
          )}
        </UI.Tarjeta>
      </Animacion.motion.div>
    </div>
  );
};

export default CafeGranoPOS_muv12ucj__CG_GestorCatalogos;
