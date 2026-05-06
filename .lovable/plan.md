## Diagnóstico

En la imagen, el botón correcto para guardar avances sin enviar es **Guardar Borrador**. El error que ves (*"El empleado solo puede enviar a pendiente_revision"*) ocurre porque la cuenta está en estado `rechazada` y el código intenta forzarla a `borrador`. Un trigger en la base de datos no permite ese cambio: el empleado solo puede dejarla como está o enviarla a `pendiente_revision`.

Por eso después del clic la pantalla se ve "vacía" / no responde: la actualización fue rechazada por la base de datos y nada quedó guardado.

## Ajustes

1. **Guardar Borrador en cuentas devueltas (`EditBillingAccount.tsx`)**
   - Quitar `status: 'borrador'` del `update` de `saveAsDraft`.
   - Conservar el estado actual (`rechazada` o `borrador`) y solo persistir los datos del formulario y el desglose.
   - Cambiar el texto del botón cuando la cuenta esté `rechazada` a **Guardar Cambios** para que no parezca que la regresa a borrador.

2. **Guardado por secciones (como antes)** dentro de la pantalla de edición:
   - Botón **Guardar Detalles** (contrato, valor, fechas).
   - Botón **Guardar Planilla** (número, valor, fecha, archivo).
   - Botón **Guardar Desglose de Aportes** (Salud, Pensión, ARL — los 9 campos obligatorios).
   - Cada uno guarda solo su sección, sin tocar el `status` ni los demás bloques. Esto evita perder datos y permite avanzar por partes.

3. **Validación de envío más clara**
   - Mantener **Enviar a Revisión** deshabilitado mientras falten campos.
   - Si falta el desglose (fechas de pago en tu captura) mostrar un aviso específico debajo del botón indicando qué falta.

4. **Mensajes de error más útiles**
   - Capturar el error del trigger y mostrar: *"No se puede cambiar el estado. Use Enviar a Revisión cuando termine."* en lugar del mensaje técnico actual.

## Resultado esperado

```text
Cuenta rechazada → editar:
  - Llenas/corriges una sección
  - Clic en Guardar Detalles / Guardar Planilla / Guardar Desglose
  - Los datos quedan guardados, la cuenta sigue en "rechazada"
  - Cuando todo esté completo → Enviar a Revisión (pasa a pendiente_revision)
```

En tu pantalla actual basta con completar las **fechas de pago** de Salud, Pensión y ARL (están vacías) y luego usar **Guardar Borrador** (que tras este ajuste sí guardará) o **Enviar a Revisión** si ya está todo.