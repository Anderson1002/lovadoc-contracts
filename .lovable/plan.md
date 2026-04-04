

# Plan: Asegurar que CDP, RP, Descripción y Valor Total no sean editables para empleados

## Problema

Los campos ya tienen `disabled={isEmployee}`, pero hay una condicion de carrera (race condition): el rol del usuario se carga de forma asincrona. Si el formulario se renderiza antes de que el rol se cargue, `isEmployee` es `false` y los campos aparecen editables.

## Solucion

En `src/pages/EditContract.tsx`:

1. **No renderizar el formulario hasta que el rol este cargado** - Agregar una condicion que espere a que `userRole` no sea `null` antes de mostrar el formulario. Mientras tanto, mostrar el spinner de carga.

2. **Cambiar la condicion de loading** - Actualmente `loading` se pone en `false` cuando el contrato se carga, pero no espera al rol. Combinar ambas condiciones:

```tsx
if (loading || userRole === null) {
  return <Layout><div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div></Layout>;
}
```

Esto garantiza que cuando el formulario se muestra, `isEmployee` ya tiene el valor correcto y los campos CDP, RP, Descripcion y Valor Total estaran correctamente deshabilitados.

## Archivo afectado

| Archivo | Cambio |
|---------|--------|
| `src/pages/EditContract.tsx` | Agregar `userRole === null` a la condicion de loading para evitar renderizar el formulario antes de conocer el rol |

