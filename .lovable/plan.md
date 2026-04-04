
Plan: Corregir la navegación real del supervisor desde `/contracts`

Diagnóstico confirmado
- La imagen 2 muestra la vista de `EditContract.tsx`, no la nueva vista del supervisor.
- El texto “Detalle del Contrato” + la alerta “Contrato en revisión” solo aparecen en la pantalla del empleado.
- Eso significa que, aunque haces clic en “Ver detalles” desde `/contracts`, el supervisor termina cayendo en `/contracts/:id/edit`.
- El botón de `ContractTable` ya está conectado a `onView`, y `Contracts.tsx` ya intenta mandar al supervisor a `/contracts/:id/review`. Por eso el problema más probable no está en el botón, sino en el flujo posterior.
- La causa más fuerte está en la detección de rol dentro de `SupervisorContractReview.tsx` y `EditContract.tsx`: ambos usan una consulta distinta al resto del proyecto (`roles:role_id(name)`), y si esa resolución falla el supervisor queda tratado como `employee`.

Qué se va a corregir
1. `src/pages/SupervisorContractReview.tsx`
   - Cambiar la consulta de rol al mismo patrón estable que usa el resto de la app: `roles!profiles_role_id_fkey(name)`.
   - Quitar el fallback silencioso que convierte al usuario en `employee` si el rol no se resuelve bien.
   - Mantener esta página como la vista exclusiva del supervisor:
     - formulario bloqueado
     - `ContractStateActions`
     - `ContractStateHistory`

2. `src/pages/EditContract.tsx`
   - Corregir la misma consulta de rol.
   - Mantener la regla: si el rol real es `supervisor`, redirigir siempre a `/contracts/:id/review`.
   - Dejar las alertas “Contrato en revisión” y “Contrato devuelto” únicamente para `employee`.

3. `src/pages/Contracts.tsx`
   - Endurecer la navegación para evitar clics con rol aún no resuelto:
     - iniciar `userRole` como `null` en vez de `employee`
     - no ejecutar `handleView` hasta conocer el rol real
   - Esto evita que un supervisor sea enviado por error a `/edit` por un estado inicial incorrecto.

Validación esperada
- Flujo: `Control de Contratos` → menú de fila → `Ver detalles`
- Resultado correcto para supervisor:
  - ruta final: `/contracts/{id}/review`
  - título de revisión, no “Detalle del Contrato”
  - formulario bloqueado
  - acciones de estado visibles
  - card completa de `ContractStateHistory`
- Resultado incorrecto que debe desaparecer:
  - ruta `/edit`
  - alerta “Contrato en revisión”
  - pantalla pensada para employee

Archivos afectados
- `src/pages/SupervisorContractReview.tsx`
- `src/pages/EditContract.tsx`
- `src/pages/Contracts.tsx`

Resultado final
- El supervisor tendrá una vista realmente independiente.
- La lógica ya no se mezclará con la del empleado.
- El historial sí aparecerá, porque ya no estarás cayendo en la pantalla equivocada.
