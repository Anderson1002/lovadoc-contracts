
# Plan: Vista de 3 Documentos para Supervisor + Observaciones por Documento

## Los 3 documentos de una cuenta de cobro

1. **Informe de Actividades** - Campos del empleado: actividades, acciones desarrolladas, evidencias, datos de planilla (salud, pension, ARL), firma del contratista
2. **Certificacion** - Campos del empleado: novedades del periodo, valor ejecutado antes, fecha de entrega del informe, mes de certificacion, lista de anexos. Campos auto-generados: tabla financiera (15 campos), texto legal, firma del supervisor
3. **Cuenta de Cobro (Invoice)** - Campos del empleado: numero de factura, fecha, monto en letras, declaraciones tributarias (SI/NO), beneficios tributarios. Campos auto-generados: datos del contratista, datos del cliente, texto legal

## Problema actual

- El supervisor solo ve el "Informe de Actividades" en la vista previa
- No puede ver la Certificacion ni la Cuenta de Cobro
- Al devolver, solo puede dejar un comentario general, sin indicar en cual documento esta el problema

## Cambios propuestos

### 1. Ampliar la vista previa con pestanas (Tabs) - `BillingReviewList.tsx`

Reemplazar el dialogo de vista previa actual (que solo muestra `BillingDocumentPreview`) por un dialogo con 3 pestanas:

- **Informe de Actividades** - Muestra `BillingDocumentPreview` (ya existente)
- **Certificacion** - Muestra `CertificationPreview` (ya existente, solo falta integrarlo)
- **Cuenta de Cobro** - Muestra `InvoicePreview` (ya existente, solo falta integrarlo)

Para esto se necesita cargar campos adicionales del `billing_accounts` en la funcion `handlePreview`:
- `novedades`, `certification_date`, `certification_month`, `report_delivery_date`
- `valor_ejecutado_antes`, `risk_matrix_compliance`, `social_security_verified`, `anexos_lista`
- `invoice_number`, `invoice_date`, `invoice_city`, `amount_in_words`
- `declaration_single_employer`, `declaration_80_percent_income`
- `benefit_prepaid_health`, `benefit_voluntary_pension`, `benefit_housing_interest`, `benefit_health_contributions`, `benefit_economic_dependents`
- `firma_url`, `supervisor_signature_url`

Todos estos campos ya existen en la tabla `billing_accounts` y ya se cargan con `select(*)`.

### 2. Mejorar el dialogo de devolucion - `BillingReviewList.tsx`

Cuando el supervisor elige "Devolver", en lugar de un solo campo de comentario, mostrar:

- Un selector de documento (Informe / Certificacion / Cuenta de Cobro) para indicar en cual documento esta la observacion
- El campo de comentario existente para detallar la observacion
- El comentario guardado incluira automaticamente el prefijo del documento: ej. "[INFORME] Falta la planilla de ARL"

Esto no requiere cambios en la base de datos, ya que el campo `comentario_supervisor` es texto libre y puede contener el prefijo del documento.

### 3. Cargar campos del contrato adicionales

Ampliar el `select` de contratos en `handlePreview` para incluir:
- `cdp`, `rp`, `budget_code`, `addition_number`, `addition_cdp`, `addition_rp`, `addition_amount`
- `execution_period_months`, `execution_period_days`

Estos campos son necesarios para renderizar correctamente la tabla financiera de la Certificacion.

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/billing/BillingReviewList.tsx` | Agregar tabs con los 3 documentos en el dialogo de vista previa. Mejorar dialogo de devolucion con selector de documento. Ampliar query de contratos. |

## Resultado esperado

- El supervisor puede navegar entre los 3 documentos de una cuenta de cobro
- Al devolver, puede indicar en cual documento esta el problema
- El empleado ve claramente en que documento y campo debe corregir
- No se requieren cambios en la base de datos
