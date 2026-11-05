# Lavandería Mili · Control de servicios

Sistema de mostrador para lavandería y tintorería: registro de ingresos, pesaje,
tarifario, cobros, comprobantes para imprimir o enviar por WhatsApp, clientes,
almacén de prendas y tablero del día.

Esta es la **versión de producción**: sin datos de ejemplo, sin cuentas de
demostración y sin servicios externos. Todo se guarda en el equipo donde se usa.

## Cómo abrirla

**En el equipo del mostrador**

1. Doble clic en `servir-local.bat` (abre `http://localhost:8137`).
2. Entra con tu usuario y PIN.

El archivo necesita Python instalado. Abrir `index.html` con doble clic también
funciona en la mayoría de los navegadores, pero el servidor local evita
restricciones de archivos locales.

**Publicada en GitHub Pages**

Actívala una vez en *Settings → Pages → Branch: `main`, carpeta `/ (root)`*. La
dirección queda como <https://leonnnc.github.io/LavanderiaMili/>.

Ten en cuenta que en la web los datos quedan en el navegador de cada equipo, no
en el repositorio.

## Acceso

El sistema **no trae usuarios**: el equipo arranca en blanco.

1. La primera vez, la pantalla de acceso pide crear la cuenta de administración
   (nombre, usuario, PIN de 4 a 8 dígitos).
2. Con esa cuenta se entra y se agrega al resto del personal desde «Perfiles».
3. `assets/js/config.js` tiene `operadores: []` a propósito; lo que se guarda en
   «Perfiles» es el directorio real y manda sobre ese archivo.

- La **Administradora** edita tarifas, perfiles, datos y respaldos.
- La **Operadora** registra servicios, cobra y actualiza estados.

Los cambios de precio que hace una operadora quedan en la auditoría y necesitan
un código de autorización de 5 dígitos que genera la administración (vigente 15
minutos).

## Dónde viven los datos

En el navegador del equipo (`localStorage`), bajo la clave `lavamili.prod.v1.*`.
El sistema arranca sin usuarios, sin clientes, sin órdenes y sin tickets. No se
envía nada a internet: no hay Firebase, ni cuentas de correo, ni sincronización.

Consecuencias prácticas:

- Cada equipo tiene su propia base. Dos computadoras no se ven entre sí.
- Si se limpia la caché o los datos del navegador, se pierde todo si no hay respaldo.
- **Descarga un respaldo al cerrar el día**: menú del usuario → «Datos» →
  «Descargar respaldo (JSON)». Ese mismo archivo se restaura con «Restaurar desde
  respaldo».

## Estructura

```
index.html               Pantalla de acceso y aplicación
assets/css/estilos.css   Estilos
assets/js/config.js      Negocio, tarifario, operadores, horarios
assets/js/store.js       Persistencia local y respaldo
assets/js/local.js       Indicador de estado (trabajo en este equipo)
assets/js/app.js         Lógica de la aplicación
assets/js/comprobante.js Comprobante en imagen para WhatsApp
assets/js/ticket.js      Impresión en térmica de 58 mm y 80 mm
soporte/                 Panel interno de tickets (solo consulta)
servir-local.bat         Servidor local para Windows
```

## Diferencias con la versión de desarrollo

- El sistema arranca en blanco: sin usuarios, clientes, órdenes ni tickets. La
  primera cuenta se crea en la pantalla de acceso.
- Se eliminaron las órdenes de ejemplo y el botón «Cargar 6 órdenes de ejemplo».
- Los datos usan la clave `lavamili.prod.v1.*`, separada de la versión de
  desarrollo, para que no herede nada de ella.
- El acceso es únicamente con usuario y PIN: no hay Firebase Auth, ni
  recuperación por correo, ni PIN de desarrollo.
- Se retiró la sincronización con Firestore, las reglas de seguridad y la guía de
  Firebase. La app no hace peticiones a servicios externos.
- El panel de soporte quedó como consulta de los tickets guardados en el equipo.

## Pendientes antes de operar con clientes

1. Crear la cuenta de administración en el primer arranque.
2. Completar los datos del negocio (dirección, teléfono, horario) en `config.js`.
3. Cargar el tarifario real desde el panel «Precios».
4. Definir quién descarga el respaldo y con qué frecuencia.
