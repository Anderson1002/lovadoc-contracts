
# Plan: Agregar sección de firma dentro del contenedor de la Cuenta de Cobro

## Resumen
Agregar la imagen de la firma del contratista y la información de identificación (C.C. + ciudad de expedición) dentro del contenedor principal con borde negro, manteniendo todo centrado.

## Cambios a realizar

### Archivo: `src/components/billing/InvoicePreview.tsx`

**Ubicación**: Después del texto legal "Esta factura se asimila..." y antes del cierre del contenedor `</div>` (línea 348)

**Agregar**:
1. Una fila en blanco (`h-4` para espacio)
2. La imagen de la firma centrada (si existe `userProfile?.signature_url`)
3. Si no hay firma, mostrar una línea de placeholder
4. Texto "FIRMA DEL CONTRATISTA" centrado
5. Texto "C.C. [document_number] de [document_issue_city]" centrado

## Estructura visual dentro del contenedor

```text
┌─────────────────────────────────────────────────────────────┐
│ ... contenido anterior ...                                  │
│                                                             │
│ Actividad económica RUT                                     │
│ Esta factura se asimila a una letra de cambio...            │
│                                                             │
│                    [IMAGEN DE FIRMA]                        │
│                                                             │
│                  FIRMA DEL CONTRATISTA                      │
│             C.C. 123456789 de Bogotá                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Detalles técnicos

### Código a agregar (después de línea 347, antes de cerrar el div del contenedor):

```jsx
{/* Blank row for spacing */}
<div className="h-4"></div>

{/* Signature section - centered */}
<div className="text-center space-y-2">
  {/* Signature image or placeholder */}
  {userProfile?.signature_url ? (
    <img 
      src={userProfile.signature_url} 
      alt="Firma del contratista" 
      className="max-h-20 mx-auto"
    />
  ) : (
    <div className="h-16 border-b border-foreground max-w-xs mx-auto"></div>
  )}
  
  {/* Contractor signature label */}
  <p className="text-xs font-semibold">FIRMA DEL CONTRATISTA</p>
  
  {/* Document info */}
  <p className="text-xs">
    C.C. {userProfile?.document_number || '_______________'} de {userProfile?.document_issue_city || '_______________'}
  </p>
</div>
```

### Notas importantes:
- La firma se obtiene dinámicamente de `userProfile?.signature_url` (almacenada en el perfil)
- El número de documento viene de `userProfile?.document_number`
- La ciudad de expedición viene de `userProfile?.document_issue_city`
- Si no hay firma guardada, se muestra una línea horizontal como placeholder
- Todo está centrado horizontalmente dentro del contenedor
