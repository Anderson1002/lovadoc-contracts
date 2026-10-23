# Arreglar el desbordamiento de la tabla en "Devueltas"

## Qué pasa
En la columna **Estado**, las cuentas devueltas muestran la observación del supervisor completa en una sola línea. Cuando la observación es larga (por ejemplo, la cuenta #52, "Validano la planilla de seguridad social no corresponde..."), esa línea ensancha la tabla y empuja **Fecha**, **Creado por** y **Acciones** fuera de la pantalla. Por eso aparece la barra de desplazamiento horizontal.

## Cambios
1. **Observación en máximo 2 líneas:** el texto se acomoda dentro de la columna Estado (ancho máximo de unos 320px) y lo que no quepa se corta con "…".
2. **Ver el texto completo:** al pasar el mouse sobre la observación aparece un globo con el texto completo. También se sigue viendo completo en el detalle de la cuenta.
3. **Columnas visibles:** con la columna Estado acotada, Fecha, Creado por y Acciones vuelven a verse sin desplazar la tabla en pantallas normales (1920px).
4. Lo mismo aplica en Historial Completo y en las demás pestañas que usan esta tabla.

## Detalles técnicos
- `BillingAccountsList.tsx`: quitar `whitespace-nowrap` del contenedor de la celda Estado (dejarlo solo en el badge) y envolver `SupervisorObservations` en un `div` con `max-w-[320px] whitespace-normal`, más un `Tooltip` con el comentario completo.
- `SupervisorObservations` (modo `compact`): aplicar `line-clamp-2 break-words` al texto de cada observación.
- Revisar con Playwright a 1922px de ancho que la pestaña Devueltas no tenga barra horizontal.
