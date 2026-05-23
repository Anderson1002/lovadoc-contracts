## Diagnóstico

En la imagen se ve que el formulario de `Desglose de Aportes` queda cortado en la parte inferior y el usuario tiene que hacer foco en un campo, usar Tab y seguir navegando para alcanzar el botón final `Radicar Cuenta de Cobro`.

La causa más probable está en la estructura actual del diálogo:

- `DialogContent` tiene `max-h-[95vh] overflow-hidden`.
- La grilla interna también tiene `overflow-hidden` y una altura calculada con `calc(95vh - 260px)`.
- Dentro de esa grilla hay dos `ScrollArea` independientes.
- El footer con `Guardar y Cerrar` / `Radicar Cuenta de Cobro` está fuera del `ScrollArea`, pero el alto reservado al contenido no está dejando suficiente espacio real para verlo cómodamente.

## Mejor opción

Usar una estructura de diálogo con altura fija controlada y layout vertical:

```text
DialogContent
  Header fijo
  Progress fijo
  Contenido flexible con scroll interno
    Columna izquierda: formulario con scroll
    Columna derecha: preview con scroll
  Footer fijo siempre visible
```

## Cambios propuestos

1. Cambiar el `DialogContent` a un layout vertical estable, por ejemplo:
   - `max-h-[95vh]`
   - `h-[95vh]`
   - `flex flex-col`
   - mantener `overflow-hidden` solo en el contenedor general.

2. Cambiar la grilla central para que ocupe el espacio restante sin cálculos manuales frágiles:
   - reemplazar `style={{ maxHeight: 'calc(95vh - 260px)' }}` por clases tipo `flex-1 min-h-0 overflow-hidden`.

3. Ajustar los `ScrollArea` internos:
   - izquierda: `h-full min-h-0 pr-4`
   - derecha: `h-full min-h-0 pr-4`
   - agregar padding inferior suficiente al contenido del formulario para que el último bloque no quede pegado ni oculto.

4. Mantener el footer fuera del scroll para que `Radicar Cuenta de Cobro` esté siempre visible, sin tener que tabular ni forzar navegación por teclado.

5. Ajustar responsive móvil/tablet:
   - en pantallas pequeñas, usar una sola columna y permitir que el formulario conserve scroll claro.
   - evitar que el preview robe altura al formulario.

## Resultado esperado

El usuario podrá bajar normalmente con rueda/trackpad/barra de scroll hasta el final del `Desglose de Aportes`, y el botón `Radicar Cuenta de Cobro` quedará siempre visible en el footer del diálogo.