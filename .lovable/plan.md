
# Plan: Actualizar PDF de Cuenta de Cobro para coincidir con la vista previa HTML

## Resumen

Reemplazar completamente la funcion `handleExportPDF` en `InvoicePreview.tsx` para que el PDF generado replique exactamente la estructura de la vista previa HTML.

## Estructura del PDF actualizado

El PDF seguira este orden (igual al HTML):

1. **Encabezado del contratista** (centrado, 6 lineas): Nombre (bold), NIT/CC, Direccion, Tel, Email, Regimen tributario
2. **Linea divisoria** + titulo "DOCUMENTO EQUIVALENTE FACTURA No. DSE"
3. **Datos del cliente** (izquierda): Ciudad/fecha, Cliente, NIT, Direccion, Telefono
4. **Recuadro principal bordeado** que contiene:
   - Bloque narrativo: "POR PRESTACION DE SERVICIOS COMO: (...) DEL PERIODO DEL MES DE ..."
   - Monto centrado: "SON: $X.XXX.XXX"
   - Monto en letras centrado
   - Datos bancarios centrados: cuenta y banco
   - Declaracion legal justificada (parrafo completo del Art. 383)
   - Texto de beneficios tributarios
   - Tabla de 5 beneficios con columnas 90/10 (descripcion | SI/NO)
   - "Actividad economica RUT"
   - Nota legal Art. 774
   - Imagen de firma del contratista (si existe `signatureUrl`)
   - "FIRMA DEL CONTRATISTA"
   - "C.C. XXXXX de Ciudad"

## Cambios tecnicos

### Archivo: `src/components/billing/InvoicePreview.tsx`

**Reemplazar `handleExportPDF` (lineas 50-205)** con nueva implementacion que:

- Elimina las secciones antiguas: "DEBE A", "LA SUMA DE", "VALOR", declaraciones con checkmarks, beneficios con checkmarks, nota legal antigua, firma izquierda, fecha/ciudad final
- Agrega recuadro bordeado usando `doc.rect()` alrededor del contenido principal
- Agrega bloque narrativo con `splitTextToSize` para texto justificado
- Agrega montos y datos bancarios centrados
- Agrega parrafo legal completo (Art. 383) con texto justificado
- Agrega tabla de beneficios usando `autoTable` con 2 columnas (90%/10%)
- Agrega notas legales (RUT y Art. 774)
- Carga la imagen de firma desde `signatureUrl` usando `fetch` + `canvas` para convertir a base64, y la inserta centrada con `doc.addImage()`
- Agrega texto de firma centrado: label + C.C. + ciudad de expedicion

### Manejo de la imagen de firma

```
// Pseudocodigo
if (signatureUrl) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  // Cargar imagen, dibujar en canvas, obtener base64
  // doc.addImage(base64, 'PNG', x, y, width, height);
}
```

### Tabla de beneficios en PDF

Se usara `autoTable` con:
- 2 columnas: descripcion (90%) y SI/NO (10%)
- 5 filas con los mismos textos del HTML
- Bordes completos, fuente 8pt

## Resultado esperado

El PDF descargado sera visualmente identico a la vista previa HTML, con toda la informacion en el mismo orden y formato.
