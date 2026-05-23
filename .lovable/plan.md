## Análisis del problema

En `CreateBillingAccountDialog.tsx` (tab "Informe"):

1. **Scroll incompleto:** el `ScrollArea` izquierdo (línea 1004, `h-full`) vive dentro de un contenedor con `maxHeight: calc(95vh - 200px)` y los botones de acción ("Guardar y Cerrar" / "Radicar Cuenta de Cobro") están **dentro** del mismo ScrollArea. La tarjeta "Desglose de Aportes" es la última antes de esos botones, así que al final del scroll los últimos campos (Fecha de Pago de ARL) quedan visualmente pegados/cortados contra los botones y no se ven cómodamente. Hay que usar TAB para que el navegador haga `scrollIntoView` campo por campo.

2. **Falta botón de guardado propio:** las otras secciones (Detalles, Actividades, Planilla) tienen su botón "Guardar X". El Desglose no — aunque sus valores se persisten dentro de `savePlanillaOnly` (líneas 571-580), no hay feedback visible ni ancla para llegar al final.

## Solución propuesta (mínima y consistente)

### 1. Añadir botón "Guardar Desglose de Aportes"
Dentro de la `Card` de Desglose (después del bloque ARL, antes de `</CardContent>`):

- Nueva función `saveDesgloseOnly()` que:
  - Valida `currentDraftId` y que los 9 campos (Salud/Pensión/ARL × Número/Valor/Fecha) estén completos.
  - Hace `UPDATE billing_accounts` solo con los 9 campos `*_planilla_*` de salud/pensión/arl.
  - Muestra toast "Desglose guardado".
- Botón `w-full` con `variant={canSaveDesglose ? "outline" : "secondary"}`, ícono `Save`, deshabilitado si faltan campos o no hay `currentDraftId`.
- Variable derivada `canSaveDesglose = currentDraftId && saludNumero && saludValor && saludFecha && pensionNumero && pensionValor && pensionFecha && arlNumero && arlValor && arlFecha`.
- Mantener la persistencia adicional que ya hace `savePlanillaOnly` (no se rompe nada).

### 2. Arreglar el corte visual al final del scroll
- Sacar los botones de acción ("Guardar y Cerrar" + "Radicar Cuenta de Cobro") del `ScrollArea` y dejarlos como **footer fijo** debajo del grid, para que el ScrollArea use toda la altura y el contenido nunca quede tapado.
- Ajustar el `maxHeight` del grid de `calc(95vh - 200px)` a `calc(95vh - 260px)` para reservar espacio del nuevo footer.
- Añadir `pb-4` al contenido interno del ScrollArea como margen de seguridad.

### Resultado para el usuario
- El Desglose se ve completo al hacer scroll, sin necesidad de TAB.
- Tiene un botón "Guardar Desglose" igual que Planilla → coherencia visual y feedback inmediato.
- Los botones de acción quedan siempre visibles abajo (no scrollean).

## Archivos a modificar
- `src/components/billing/CreateBillingAccountDialog.tsx` (única edición).
