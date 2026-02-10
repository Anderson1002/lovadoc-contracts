

# Plan: Corregir criterio de completitud de Cuenta de Cobro

## Problema

En `EditBillingAccount.tsx`, la variable `cuentaCobroComplete` se calcula asi:

```
cuentaCobroComplete = !!(invoiceCity && invoiceDate && invoiceNumber && amountInWords)
```

Pero el campo `invoiceCity` fue eliminado del formulario (la ciudad ahora es fija "Girardot" en el preview). Como ya no se captura ese dato, siempre esta vacio y la cuenta nunca se marca como completa.

## Solucion

Actualizar la condicion en `EditBillingAccount.tsx` (linea 144) para remover `invoiceCity` del criterio:

**Antes:**
```
const cuentaCobroComplete = !!(invoiceCity && invoiceDate && invoiceNumber && amountInWords);
```

**Despues:**
```
const cuentaCobroComplete = !!(invoiceDate && invoiceNumber && amountInWords);
```

Esto coincide con los campos que el usuario realmente debe completar: Documento Equivalente No., Fecha, y Valor en Letras.

### Archivo afectado
- `src/pages/EditBillingAccount.tsx` - linea 144
