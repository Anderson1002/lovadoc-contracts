## Análisis profundo

### Problema 1 — Calendarios feos en `/contracts/new`
En `src/pages/CreateContract.tsx` (líneas 762 y 803) los `Calendar` usan `captionLayout="dropdown-buttons"` con `fromYear`/`toYear`, lo cual hace que `react-day-picker` renderice los `<select>` nativos de mes/año. El componente `src/components/ui/calendar.tsx` actual NO tiene estilos para `caption_dropdowns`, `dropdown`, `vhidden`, etc., así que aparecen los selects nativos sin estilo (los que se ven en la imagen). Por memoria del proyecto se debe conservar el rango extendido (2020+), así que la solución correcta es **estilar los dropdowns** en `Calendar`, no eliminarlos.

### Problema 2 — `new row violates row-level security policy` al subir el contrato firmado
Inconsistencias entre el flujo de subida y las políticas de Storage del bucket `contracts`:

1. La subida (línea 299) usa path `${profile.id}/${fileName}` (sin prefijo `contracts/`).
2. La política `INSERT` `write_contract_files_by_creator` exige que el path empiece por `contracts/${contract.id}/` y que `contracts.created_by = auth.uid()`. Pero:
   - El upload ocurre **antes** de crear el contrato (aún no hay `contract.id`).
   - `contracts.created_by` guarda `profile.id`, no `auth.uid()` (validado en línea 333).
3. La política `SELECT` (`read_contract_files`) sí acepta el patrón `${profile.id}/...` (primer OR: `left(name, 36) = profile.id`). O sea, lectura y escritura están desalineadas.

Resultado: el `INSERT` en storage siempre falla para el empleado → toast rojo "Error al subir el contrato: new row violates row-level security policy".

## Cambios propuestos

### 1) Estilar dropdowns del calendario (`src/components/ui/calendar.tsx`)
Agregar clases para los dropdowns que `react-day-picker` renderiza cuando `captionLayout="dropdown-buttons"`:

- `caption_label: "hidden"` cuando hay dropdowns (o conservar oculto vía `vhidden`)
- `caption_dropdowns: "flex justify-center gap-1"`
- `dropdown: "appearance-none bg-background border border-input rounded-md px-2 py-1 text-sm font-medium cursor-pointer hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"`
- `dropdown_month` / `dropdown_year`: contenedores con `relative`
- `dropdown_icon: "ml-1 h-4 w-4"`
- `vhidden: "hidden"` para ocultar los labels duplicados ("June 2026 / Month: ... / June / Year: ...") que aparecen en la captura.

Sin tocar el resto del componente. Resultado: dos selects limpios "Mes" y "Año" en una sola línea, con la flecha izquierda/derecha de navegación.

### 2) Alinear las políticas de Storage del bucket `contracts` (migración SQL)

Reemplazar las políticas `INSERT` y `UPDATE` para que acepten el mismo patrón que ya acepta la `SELECT`:

```text
INSERT/UPDATE permitidos si:
  bucket_id = 'contracts' AND (
    left(name, 36) = (SELECT profiles.id::text FROM profiles WHERE user_id = auth.uid())
    OR existe contrato c con path 'contracts/<c.id>/...' y p.user_id = auth.uid()
    OR el usuario es supervisor/admin/super_admin
  )
```

Esto:
- Permite al empleado subir bajo `${profile.id}/...` (patrón actual del código).
- Mantiene compatibilidad con el patrón `contracts/${contract.id}/...` que ya usa la política SELECT.
- Habilita a supervisores/admins a subir/reemplazar archivos.

No se cambia el flujo de subida en el cliente — el path `${profile.id}/${fileName}` queda igual y la lectura sigue funcionando porque la `SELECT` actual ya lo soporta.

### 3) Sin cambios funcionales adicionales
- No se modifican otros componentes ni lógica de negocio.
- No se toca el `tipo` ni los campos del formulario.
- Se respeta la memoria: rango de fechas extendido (2020+) sigue activo, solo se estiliza.

## Resultado esperado
- Los popovers de "Fecha de Inicio" y "Fecha de Finalización" muestran dropdowns limpios y consistentes con el design system.
- El empleado puede crear el contrato y subir el PDF firmado sin el error de RLS.
