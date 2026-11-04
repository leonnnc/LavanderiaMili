/* ==========================================================================
   Lavandería Mili · Estado del equipo
   --------------------------------------------------------------------------
   Esta versión de producción no usa nube: todo se guarda en el navegador del
   equipo (localStorage) y el respaldo se descarga desde el panel «Datos».

   El módulo mantiene el indicador de estado de la cabecera y expone la misma
   forma que usaba la capa de sincronización, para que la app no dependa de
   servicios externos ni de datos de demostración.
   ========================================================================== */

const Sync = (() => {
  const estado = { modo: 'local', sesion: true, conectado: false, pendientes: 0, error: '' };
  const vista = {
    texto: 'Solo este equipo',
    titulo: 'Los datos se guardan en este navegador. Descarga un respaldo desde «Datos» para conservarlos.'
  };

  const oyentes = new Set();

  function avisar() {
    oyentes.forEach((fn) => {
      try {
        fn(estado, vista);
      } catch (error) {
        console.warn('[estado] oyente de estado falló', error);
      }
    });
  }

  return {
    hayNube: false,
    iniciar: avisar,
    salir() {},
    onSesion() {
      return () => {};
    },
    onDatos() {
      return () => {};
    },
    onEstado(fn) {
      if (typeof fn !== 'function') return () => {};
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },
    estado: () => ({ ...estado })
  };
})();
