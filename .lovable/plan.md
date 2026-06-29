## Objetivo
Permitir que la supervisora (y demás roles revisores) pueda **ver y descargar el PDF de la planilla de seguridad social** que carga el OPS, dentro del modal de revisión de cuentas de cobro.

## Cambios

### Único archivo a modificar
`src/components/billing/BillingReviewList.tsx`

### Qué agregar
En la sección de revisión donde ya se muestran los datos de planilla (Salud / Pensión / ARL), agregar un bloque nuevo **"Archivo de Planilla"** con:

1. **Si `previewBilling.planilla_file_url` existe:**
   - Botón **"Ver Planilla"** → genera signed URL con `supabase.storage.from('billing-documents').createSignedUrl(planilla_file_url, 3600)` y abre en nueva pestaña (`window.open(url, '_blank')`).
   - Botón secundario **"Descargar"** → mismo signed URL con `download` attribute.
   - Mostrar el nombre del archivo (parseado del path) como referencia visual.

2. **Si `planilla_file_url` está vacío o null:**
   - Badge gris/amarillo: **"Sin archivo cargado"** para que la supervisora sepa que el OPS no subió el PDF.

### Patrón a reutilizar
Mismo patrón ya probado en la sección de evidencias de actividades (línea ~1087 del mismo archivo), que ya usa `createSignedUrl` correctamente con el bucket `billing-documents`.

## Lo que NO se toca
- Base de datos (campo `planilla_file_url` ya existe y se guarda bien).
- RLS / Storage policies (ya permiten lectura a supervisor/admin/super_admin).
- Carga del archivo por parte del OPS (funciona correctamente).
- Otros componentes o vistas.

## Validación post-cambio
1. Entrar como supervisora `lidy-456@hotmail.com`.
2. Abrir una cuenta de cobro pendiente que tenga planilla cargada → debe aparecer el botón "Ver Planilla" y abrir el PDF en pestaña nueva.
3. Abrir una cuenta sin planilla → debe mostrar el badge "Sin archivo cargado".
