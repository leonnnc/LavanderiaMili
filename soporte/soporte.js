/* ==========================================================================
   Panel interno de soporte
   --------------------------------------------------------------------------
   Lee los tickets que los operadores registran desde la app y los guarda en
   este navegador (localStorage). Es un panel de consulta: no hay nube ni
   cuentas externas.
   ========================================================================== */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const CLAVE_LOCAL = 'lavamili.v1.tickets';

  let tickets = [];
  let seleccionado = null;
  let filtros = { texto: '', estado: 'todos', prioridad: 'todas' };

  /* ----------------------------- utilidades ----------------------------- */

  const esc = (texto) =>
    String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const aFecha = (iso) => {
    const f = new Date(iso);
    return Number.isFinite(f.getTime()) ? f : null;
  };

  const fechaCorta = (iso) => {
    const f = aFecha(iso);
    if (!f) return '—';
    return f.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }) + ' · ' +
      f.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  };

  const horasDesde = (iso) => {
    const f = aFecha(iso);
    return f ? (Date.now() - f.getTime()) / 36e5 : 0;
  };

  let temporizador = null;
  function aviso(texto) {
    const caja = $('#aviso');
    caja.textContent = texto;
    caja.hidden = false;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => { caja.hidden = true; }, 3200);
  }

  /* ------------------------------- datos -------------------------------- */

  function leerLocal() {
    try {
      const crudo = JSON.parse(localStorage.getItem(CLAVE_LOCAL) || '[]');
      tickets = (Array.isArray(crudo) ? crudo : []).slice().sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
    } catch (error) {
      tickets = [];
    }
    pintar();
  }

  /* ------------------------------- alertas ------------------------------- */

  function calcularAlertas() {
    const abiertos = tickets.filter((t) => t.estado !== 'cerrada');
    const salida = [];

    const urgentes = abiertos.filter((t) => t.prioridad === 'Urgente');
    if (urgentes.length) {
      salida.push(`<b>${urgentes.length}</b> ${urgentes.length === 1 ? 'ticket urgente sigue' : 'tickets urgentes siguen'} sin cerrar.`);
    }

    const sinRespuesta = abiertos.filter((t) => !(t.respuestas || []).length && horasDesde(t.fecha) > 24);
    if (sinRespuesta.length) {
      salida.push(`<b>${sinRespuesta.length}</b> sin ninguna respuesta después de 24 horas.`);
    }

    const viejos = abiertos.filter((t) => horasDesde(t.fecha) > 72);
    if (viejos.length) {
      salida.push(`<b>${viejos.length}</b> con más de 3 días abiertos.`);
    }

    const porAutor = {};
    abiertos.forEach((t) => { porAutor[t.autor] = (porAutor[t.autor] || 0) + 1; });
    const insistente = Object.entries(porAutor).find(([, n]) => n >= 3);
    if (insistente) {
      salida.push(`<b>${esc(insistente[1])}</b> tickets abiertos de ${esc(insistente[0])}: puede ser un problema recurrente.`);
    }

    return salida;
  }

  /* -------------------------------- pintar ------------------------------- */

  function etiquetaEstado(estado) {
    const clase = String(estado || 'abierta').replace(' ', '-');
    const nombre = estado === 'en proceso' ? 'En proceso' : estado === 'cerrada' ? 'Cerrada' : 'Abierta';
    return `<span class="etiqueta e-${clase}">${nombre}</span>`;
  }

  function etiquetaPrioridad(prioridad) {
    const p = String(prioridad || 'Normal');
    return `<span class="etiqueta p-${p.toLowerCase()}">${esc(p)}</span>`;
  }

  function pintar() {
    const abiertos = tickets.filter((t) => t.estado === 'abierta').length;
    const proceso = tickets.filter((t) => t.estado === 'en proceso').length;
    const cerrados = tickets.filter((t) => t.estado === 'cerrada').length;
    const urgentes = tickets.filter((t) => t.estado !== 'cerrada' && t.prioridad === 'Urgente').length;

    $('#kpis').innerHTML = `
      <div class="kpi abierto"><span>Abiertos</span><strong>${abiertos}</strong></div>
      <div class="kpi proceso"><span>En proceso</span><strong>${proceso}</strong></div>
      <div class="kpi cerrado"><span>Cerrados</span><strong>${cerrados}</strong></div>
      <div class="kpi urgente"><span>Urgentes</span><strong>${urgentes}</strong></div>`;

    const alertas = calcularAlertas();
    const cajaAlertas = $('#alertas');
    cajaAlertas.hidden = alertas.length === 0;
    cajaAlertas.innerHTML = alertas
      .map((a) => `<div class="alerta"><span class="punto"></span><div>${a}</div></div>`)
      .join('');

    const texto = filtros.texto.trim().toLowerCase();
    const lista = tickets.filter((t) => {
      if (filtros.estado !== 'todos' && t.estado !== filtros.estado) return false;
      if (filtros.prioridad !== 'todas' && t.prioridad !== filtros.prioridad) return false;
      if (!texto) return true;
      return `${t.asunto} ${t.autor} ${t.mensaje} ${t.categoria}`.toLowerCase().includes(texto);
    });

    $('#lista').innerHTML = lista.length
      ? lista
          .map(
            (t) => `<button class="ticket${seleccionado === t.id ? ' sel' : ''}" type="button" data-id="${esc(t.id)}">
              <span class="ticket-info">
                <strong>${esc(t.asunto)}</strong>
                <span>${esc(t.autor)} · ${esc(t.rol || '')} · ${fechaCorta(t.fecha)} · ${esc(t.categoria)}</span>
                <p>${esc(t.mensaje)}</p>
              </span>
              <span class="ticket-lado">
                ${etiquetaPrioridad(t.prioridad)}
                ${etiquetaEstado(t.estado)}
              </span>
            </button>`
          )
          .join('')
      : `<div class="vacio">${tickets.length ? 'Ningún ticket coincide con el filtro.' : 'Todavía no hay tickets.'}</div>`;

    if (seleccionado) {
      const actual = tickets.find((t) => t.id === seleccionado);
      if (actual) pintarDetalle(actual); else cerrarDetalle();
    }
  }

  function pintarDetalle(t) {
    $('#detalle').hidden = false;
    $('#detalle').classList.add('abierto');
    $('#detalle').setAttribute('aria-hidden', 'false');
    $('#detalleMeta').textContent = `${t.categoria} · ${t.prioridad} · ${fechaCorta(t.fecha)}`;
    $('#detalleTitulo').textContent = t.asunto;

    const mensajes = [`<div class="mensaje"><header><strong>${esc(t.autor)}</strong><span>${fechaCorta(t.fecha)}</span></header><p>${esc(t.mensaje)}</p></div>`];
    (t.respuestas || []).forEach((r) => {
      mensajes.push(
        `<div class="mensaje mio"><header><strong>${esc(r.autor)}</strong><span>${fechaCorta(r.fecha)}</span></header><p>${esc(r.texto)}</p></div>`
      );
    });
    $('#hilo').innerHTML = mensajes.join('');
  }

  function cerrarDetalle() {
    seleccionado = null;
    $('#detalle').classList.remove('abierto');
    $('#detalle').setAttribute('aria-hidden', 'true');
    setTimeout(() => { if (!seleccionado) $('#detalle').hidden = true; }, 280);
    pintar();
  }

  /* ------------------------------- acciones ------------------------------ */

  /* -------------------------------- sesión ------------------------------- */

  function mostrarPanel() {
    $('#acceso').hidden = true;
    $('#panel').hidden = false;
    $('#chipSesion').textContent = 'Este equipo';
    $('#contexto').textContent = 'Tickets guardados en este navegador';
  }

  function entrarLocal() {
    mostrarPanel();
    leerLocal();
  }

  /* -------------------------------- eventos ------------------------------ */

  function conectar() {
    $('#btnEntrar').addEventListener('click', entrarLocal);

    $('#btnSalir').addEventListener('click', () => {
      tickets = [];
      seleccionado = null;
      $('#panel').hidden = true;
      $('#acceso').hidden = false;
      $('#detalle').hidden = true;
    });

    $('#btnRecargar').addEventListener('click', () => {
      leerLocal();
      aviso('Tickets de este equipo actualizados');
    });

    $('#buscar').addEventListener('input', (e) => { filtros.texto = e.target.value; pintar(); });
    $('#filtroEstado').addEventListener('change', (e) => { filtros.estado = e.target.value; pintar(); });
    $('#filtroPrioridad').addEventListener('change', (e) => { filtros.prioridad = e.target.value; pintar(); });

    $('#lista').addEventListener('click', (evento) => {
      const boton = evento.target.closest('[data-id]');
      if (!boton) return;
      seleccionado = boton.dataset.id;
      const t = tickets.find((x) => x.id === seleccionado);
      if (t) { pintar(); pintarDetalle(t); }
    });

    $('#cerrarDetalle').addEventListener('click', cerrarDetalle);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && seleccionado) cerrarDetalle();
    });
  }

  /* -------------------------------- arranque ----------------------------- */

  function arrancar() {
    conectar();

    const version = document.querySelector('#versionSoporte');
    if (version) version.textContent = 'v' + ((typeof CONFIG !== 'undefined' && CONFIG.version) || '0.01');

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrancar);
  } else {
    arrancar();
  }
})();
