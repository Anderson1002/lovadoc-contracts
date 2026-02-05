
# Plan: Corregir la Firma en Cuenta de Cobro

## Problemas Identificados

1. **URL de firma rota**: En la base de datos, `signature_url` contiene solo el path relativo (`d75d63c6-dc44-4f69-9926-0d183b0ecc15/signature_1766100315177.png`), pero el componente intenta usarlo directamente como URL de imagen sin generar la URL firmada de Supabase Storage.

2. **Texto duplicado**: El `alt="Firma del contratista"` se muestra cuando la imagen está rota, creando duplicación con "FIRMA DEL CONTRATISTA".

## Solución

### 1. Modificar `InvoicePreview.tsx`
- Agregar nuevo prop `signatureUrl?: string` para recibir la URL firmada
- Usar `signatureUrl` en lugar de `userProfile.signature_url` para la imagen
- Cambiar el `alt` de la imagen a un texto vacío o descriptivo que no duplique el label

```tsx
// Nuevo prop
signatureUrl?: string;

// En la imagen
{signatureUrl ? (
  <img 
    src={signatureUrl} 
    alt="" // Sin texto alt visible
    className="max-h-20 mx-auto"
  />
) : (
  <div className="h-16 border-b border-foreground max-w-xs mx-auto"></div>
)}
```

### 2. Modificar `CreateBillingAccountDialog.tsx`
- Agregar estado `profileSignatureUrl` para almacenar la URL firmada
- En la carga inicial, obtener la URL firmada de la firma del perfil usando `createSignedUrl`
- Pasar `signatureUrl={profileSignatureUrl}` al `InvoicePreview`

### 3. Modificar `EditBillingAccount.tsx`
- Ya tiene `profileSignatureUrl` definido y generado correctamente
- Solo agregar `signatureUrl={profileSignatureUrl}` al `InvoicePreview`

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/billing/InvoicePreview.tsx` | Agregar prop `signatureUrl`, usar para imagen, quitar alt duplicado |
| `src/components/billing/CreateBillingAccountDialog.tsx` | Agregar lógica para cargar URL firmada, pasarla al preview |
| `src/pages/EditBillingAccount.tsx` | Pasar `profileSignatureUrl` al `InvoicePreview` |

---

## Verificación en Base de Datos

**Resultado de la consulta**:
```
signature_url: d75d63c6-dc44-4f69-9926-0d183b0ecc15/signature_1766100315177.png
document_number: 20392259
document_issue_city: Bogotá
```

La firma existe en la base de datos pero es un path relativo que requiere generar URL firmada con:
```typescript
const { data } = await supabase.storage
  .from('billing-signatures')
  .createSignedUrl(signature_path, 3600);
```

---

## Resultado Esperado

- La imagen de firma se cargará correctamente desde Supabase Storage
- Solo aparecerá el texto "FIRMA DEL CONTRATISTA" en mayúsculas
- La información del documento se mostrará como "C.C. 20392259 de Bogotá"
