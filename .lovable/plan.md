
# Plan: Eliminar secciones de Declaraciones, Beneficios Tributarios y Nota Legal del formulario de Cuenta de Cobro

## Resumen
Eliminar del formulario (`InvoiceForm.tsx`) las tres secciones que ya no se necesitan:
1. "DECLARACIONES BAJO LA GRAVEDAD DEL JURAMENTO" (con sus dos checkboxes)
2. "BENEFICIOS TRIBUTARIOS" (con sus cinco checkboxes)
3. "Nota Legal"

Estas secciones ya se muestran en el preview (`InvoicePreview.tsx`), por lo que no es necesario mantenerlas en el formulario de entrada.

## Cambios

### Archivo: `src/components/billing/InvoiceForm.tsx`

**Eliminar las líneas 165-264** que contienen:
- Sección "Declarations" (líneas 165-192)
- Sección "Tax Benefits" (líneas 194-257)
- Sección "Legal Note" (líneas 259-264)

El formulario terminará después del resumen del monto ("VALOR TOTAL A COBRAR") en la línea 163.

### Detalles Técnicos

- Los props relacionados con declaraciones y beneficios (`declarationSingleEmployer`, `declaration80PercentIncome`, `benefitPrepaidHealth`, etc.) se mantendrán en la interfaz `InvoiceFormProps` por ahora para no romper los componentes padres que los pasan. Se pueden limpiar en un paso posterior si se desea.
- Los imports de `Checkbox` dejará de usarse en este archivo, por lo que también se eliminará.
