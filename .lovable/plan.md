
# Plan: Corregir la Firma en Cuenta de Cobro ✅ COMPLETADO

## Cambios Realizados

1. **InvoicePreview.tsx**: 
   - Agregado nuevo prop `signatureUrl?: string`
   - Cambiado para usar `signatureUrl` en lugar de `userProfile.signature_url`
   - Eliminado el texto `alt` duplicado

2. **CreateBillingAccountDialog.tsx**:
   - Agregado estado `profileSignatureUrl`
   - Agregada lógica para cargar URL firmada desde Supabase Storage
   - Pasado `signatureUrl={profileSignatureUrl}` al InvoicePreview

3. **EditBillingAccount.tsx**:
   - Ya tenía `profileSignatureUrl` cargado correctamente
   - Solo agregado `signatureUrl={profileSignatureUrl}` al InvoicePreview

## Resultado

- La imagen de firma se carga correctamente desde Supabase Storage usando URL firmada
- Solo aparece el texto "FIRMA DEL CONTRATISTA" en mayúsculas (sin duplicación)
- La información del documento se muestra como "C.C. [número] de [ciudad]"

