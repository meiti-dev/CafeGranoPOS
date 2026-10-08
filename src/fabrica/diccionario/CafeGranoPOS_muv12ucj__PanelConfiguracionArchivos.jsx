import React, { useState, useEffect } from 'react';
import { LIBRERIAS_PREMIUM } from '../core/libreriasPremium.js';

const { Iconos, Animacion, Graficos } = LIBRERIAS_PREMIUM;

// 🛡️ Ladrillo Forjado por IA y Aprobado por el Pentágono (MEITI)
const CafeGranoPOS_muv12ucj__PanelConfiguracionArchivos = ({ datos, tema, UI, MEITI }) => {
  const eco = MEITI.obtenerEcosistemaActual();

  const [estado, setEstado] = React.useState(null);
  const [elegido, setElegido] = React.useState('');
  const [valores, setValores] = React.useState({});
  const [cargando, setCargando] = React.useState(true);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState('');
  const [aviso, setAviso] = React.useState('');

  const cargar = async () => {
    setCargando(true);
    const res = await MEITI.fetchDatos(`/api/almacenamiento/estado?ecosistema=${eco}`);
    if (res.ok && res.registros && res.registros.length) {
      const d = res.registros[0];
      setEstado(d);
      setElegido(d.proveedor || (d.proveedores && d.proveedores[0] ? d.proveedores[0].id : ''));
      setValores(d.publica ? { ...d.publica } : {});
    } else {
      setError('No se pudo leer la configuración.');
    }
    setCargando(false);
  };

  React.useEffect(() => { cargar(); }, []);

  const proveedores = (estado && estado.proveedores) || [];
  const ficha = proveedores.find(p => p.id === elegido);

  const guardar = async () => {
    setGuardando(true); setError(''); setAviso('');
    const r = await MEITI.fetchMutante('/api/almacenamiento/guardar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ecosistema: eco, proveedor: elegido, valores })
    });
    if (r.ok) { setAviso('Listo. Esta app ya puede guardar fotos, videos y documentos.'); await cargar(); }
    else { setError((r.datos && r.datos.error) || 'No se pudo guardar.'); }
    setGuardando(false);
  };

  const desconectar = async () => {
    if (!(await MEITI.confirmar('¿Desconectar la cuenta de archivos? Los archivos ya subidos siguen en tu proveedor.', { titulo: MEITI.t('disconnect_button', null, 'Desconectar'), confirmar: MEITI.t('disconnect_confirm', null, 'Sí, desconectar'), tono: 'peligro' }))) return;
    setGuardando(true); setError(''); setAviso('');
    const r = await MEITI.fetchMutante('/api/almacenamiento/borrar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ecosistema: eco })
    });
    if (r.ok) { setAviso('Cuenta desconectada.'); setValores({}); await cargar(); }
    else { setError('No se pudo desconectar.'); }
    setGuardando(false);
  };

  if (cargando) return <UI.Tarjeta><p className="text-sm opacity-60">{MEITI.t('loading_config', null, "Cargando configuración...")}</p></UI.Tarjeta>;

  return (
    <UI.Tarjeta>
      <div className="flex items-center gap-2 mb-1">
        <i className="fa-solid fa-photo-film" style={{ color: tema.colorPrimario }}></i>
        <UI.Etiqueta>{MEITI.t('app_files_title', null, "Archivos de la app")}</UI.Etiqueta>
      </div>
      <p className="text-xs mb-4 leading-relaxed" style={{ opacity: 0.7 }}>
        {MEITI.t('storage_explanation', null, "Conecta tu cuenta de almacenamiento para que esta app pueda guardar fotos, videos o documentos. Los archivos viajan directo del navegador a tu cuenta: esta app guarda solo la dirección, nunca el archivo.")}
      </p>

      {estado && estado.configurado && (
        <div className="mb-3"><UI.Chip tono="exito">{MEITI.t('connected_with_label', null, "Conectado con")} {(proveedores.find(p => p.id === estado.proveedor) || {}).nombre || estado.proveedor}</UI.Chip></div>
      )}
      {aviso && <UI.Aviso mensaje={aviso} tono="exito" onCerrar={() => setAviso('')} />}
      {error && <UI.Aviso mensaje={error} tono="peligro" onCerrar={() => setError('')} />}

      <div className="flex flex-col gap-3">
        <UI.Campo
          tipo="select"
          etiqueta={MEITI.t('provider_label', null, "Proveedor")}
          valor={elegido}
          onChange={(e) => { setElegido(e.target.value); setValores({}); }}
          opciones={proveedores.map(p => ({ value: p.id, label: p.nombre }))}
        />
        {ficha && ficha.ayuda && <p className="text-[11px] -mt-2" style={{ opacity: 0.55 }}>{ficha.ayuda}</p>}

        {(ficha ? ficha.campos : []).map(c => (
          <UI.Campo
            key={c.clave}
            tipo={c.secreto ? 'password' : 'text'}
            etiqueta={c.secreto ? `${c.etiqueta} (no se muestra nunca)` : c.etiqueta}
            valor={valores[c.clave] || ''}
            onChange={(e) => setValores(v => ({ ...v, [c.clave]: e.target.value }))}
            placeholder={c.secreto && estado && estado.configurado ? 'Guardado — escribe uno nuevo para cambiarlo' : ''}
          />
        ))}

        <div className="flex gap-2 flex-wrap">
          <UI.Boton onClick={guardar} disabled={guardando || !elegido}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </UI.Boton>
          {estado && estado.configurado && (
            <UI.Boton variante="fantasma-peligro" onClick={desconectar} disabled={guardando}>{MEITI.t('disconnect_button', null, "Desconectar")}</UI.Boton>
          )}
        </div>
      </div>

      <p className="text-[11px] mt-4 pt-3" style={{ opacity: 0.5, borderTop: `1px solid ${tema.texto}1a` }}>
        {MEITI.t('deletion_warning', null, "Si borras un registro de la app, el archivo queda en tu cuenta: esta app no administra tu almacenamiento. Los borras desde tu proveedor cuando quieras.")}
      </p>
    </UI.Tarjeta>
  );
};

export default CafeGranoPOS_muv12ucj__PanelConfiguracionArchivos;
