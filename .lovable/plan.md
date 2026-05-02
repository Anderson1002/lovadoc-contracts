## Mejora UX en /contract-imports — Paginación

### Problema
La tabla muestra hasta 1000 filas en una sola lista, generando scroll infinito y mala experiencia al revisar/editar contratos.

### Solución propuesta
Mantener la carga actual (hasta 1000 registros del lado servidor) y agregar **paginación del lado cliente** con:

1. **Selector de filas por página**: 10, 25, 50, 100 (default: 25).
2. **Controles de navegación**: Primera, Anterior, números de página (con elipsis), Siguiente, Última.
3. **Indicador de rango**: "Mostrando 1–25 de 487 registros".
4. **Reset automático a página 1** cuando:
   - El usuario cambia el término de búsqueda.
   - El usuario cambia el tamaño de página.
5. **Scroll suave al tope de la tabla** al cambiar de página.
6. **Exportar CSV** seguirá exportando todos los registros filtrados (no solo la página visible) — más útil para el rol Jurídica.

### Cambios técnicos

**Archivo único**: `src/pages/ContractImports.tsx`

- Nuevos estados: `pageSize` (default 25), `currentPage` (default 1).
- `useMemo` adicional `paginated` que rebana `filtered` con `slice((page-1)*size, page*size)`.
- `useEffect` para resetear `currentPage = 1` cuando cambien `search` o `pageSize`.
- Reemplazar el render directo de `filtered.map(...)` por `paginated.map(...)`.
- Bajo la tabla, agregar bloque con:
  - `Select` (componente `@/components/ui/select` ya disponible) para `pageSize`.
  - Componente `Pagination` ya existente en `src/components/ui/pagination.tsx` para los controles, con generación dinámica de páginas (mostrar máx 5 números + elipsis).
  - Texto de rango a la izquierda.
- Quitar el aviso "Mostrando los primeros 1000 registros" o conservarlo solo cuando `rows.length === 1000`.

### Layout del footer de la tabla

```text
[Mostrando 1–25 de 487]   [Filas: 25 ▼]   [« ‹ 1 2 3 … 20 › »]
```

Responsive: en móvil se apila en columna.

### Fuera de alcance
- No se modifica la consulta a Supabase (sigue trayendo 1000 máx). Si en el futuro hay >1000 registros se puede migrar a paginación server-side con `range()` y `count: 'exact'`, pero hoy no es necesario.
- No se tocan otras tablas del proyecto.
