

## Plan: Nuevo Encabezado Centrado para Cuenta de Cobro

### Objetivo
Modificar el encabezado de la **Cuenta de Cobro** (tanto en la vista previa como en el PDF descargado) para que muestre los datos del contratista de forma **centrada en 6 líneas**:

```text
JUAN PÉREZ GARCÍA                    ← Línea 1: Nombre (sin etiqueta)
CC. 12345678                         ← Línea 2: NIT/CC
Calle 123 #45-67, Barrio Centro      ← Línea 3: Dirección
Tel: 3001234567                      ← Línea 4: Teléfono
correo@ejemplo.com                   ← Línea 5: Email
Régimen Simplificado                 ← Línea 6: Régimen
```

---

### Archivo a Modificar

**`src/components/billing/InvoicePreview.tsx`**

---

### Cambios en la Vista Previa (HTML)

**Ubicación:** Líneas 208-216 (sección "Contractor Info")

**Antes:**
```tsx
{/* Contractor Info */}
<div className="grid grid-cols-2 gap-2 text-xs">
  <p><span className="text-muted-foreground">Nombre:</span> <strong>{userProfile?.name}</strong></p>
  <p><span className="text-muted-foreground">NIT/CC:</span> {userProfile?.nit || userProfile?.document_number}</p>
  <p><span className="text-muted-foreground">Dirección:</span> {userProfile?.address || 'N/A'}</p>
  <p><span className="text-muted-foreground">Teléfono:</span> {userProfile?.phone || 'N/A'}</p>
  <p><span className="text-muted-foreground">Ciudad:</span> {userProfile?.city || invoiceCity || 'N/A'}</p>
  <p><span className="text-muted-foreground">Régimen:</span> {userProfile?.tax_regime || 'N/A'}</p>
</div>
```

**Después:**
```tsx
{/* Contractor Info - Centered 6 lines */}
<div className="text-center text-xs space-y-0.5 py-2">
  <p className="font-bold text-sm">{userProfile?.name}</p>
  <p>{userProfile?.nit ? `NIT: ${userProfile.nit}` : `CC. ${userProfile?.document_number || 'N/A'}`}</p>
  <p>{userProfile?.address || 'N/A'}</p>
  <p>Tel: {userProfile?.phone || 'N/A'}</p>
  <p>{userProfile?.email || 'N/A'}</p>
  <p>{userProfile?.tax_regime || 'N/A'}</p>
</div>
```

---

### Cambios en el PDF (jsPDF)

**Ubicación:** Líneas 64-82 (sección "Contractor Info" en `handleExportPDF`)

**Antes:**
```typescript
// Contractor Info
doc.setFontSize(9);
const contractorInfo = [
  ["NOMBRE:", userProfile?.name || ""],
  ["NIT/CC:", userProfile?.nit || userProfile?.document_number || ""],
  ["DIRECCIÓN:", userProfile?.address || ""],
  ["TELÉFONO:", userProfile?.phone || ""],
  ["CIUDAD:", userProfile?.city || invoiceCity || ""],
  ["RÉGIMEN:", userProfile?.tax_regime || ""],
  ["ACTIVIDAD RUT:", userProfile?.rut_activity_code || ""],
];

autoTable(doc, {
  startY: yPosition,
  body: contractorInfo,
  theme: 'plain',
  styles: { fontSize: 8 },
  columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
});

yPosition = (doc as any).lastAutoTable.finalY + 10;
```

**Después:**
```typescript
// Contractor Info - Centered 6 lines
doc.setFontSize(10);
doc.setFont('helvetica', 'bold');
doc.text(userProfile?.name || "", pageWidth / 2, yPosition, { align: "center" });
yPosition += 5;

doc.setFontSize(9);
doc.setFont('helvetica', 'normal');
const nitOrCc = userProfile?.nit 
  ? `NIT: ${userProfile.nit}` 
  : `CC. ${userProfile?.document_number || ""}`;
doc.text(nitOrCc, pageWidth / 2, yPosition, { align: "center" });
yPosition += 5;

doc.text(userProfile?.address || "", pageWidth / 2, yPosition, { align: "center" });
yPosition += 5;

doc.text(`Tel: ${userProfile?.phone || ""}`, pageWidth / 2, yPosition, { align: "center" });
yPosition += 5;

doc.text(userProfile?.email || "", pageWidth / 2, yPosition, { align: "center" });
yPosition += 5;

doc.text(userProfile?.tax_regime || "", pageWidth / 2, yPosition, { align: "center" });
yPosition += 10;
```

---

### Resumen de Cambios

| Sección | Cambio | Resultado |
|---------|--------|-----------|
| Vista previa HTML | Reemplazar grid 2 columnas por div centrado | 6 líneas centradas sin etiquetas |
| PDF (jsPDF) | Eliminar autoTable y usar `doc.text()` centrado | 6 líneas centradas en el PDF |
| Campo Email | Agregar `userProfile?.email` | Mostrar email del contratista |
| Campo Ciudad | Eliminar | Ya no se muestra en el encabezado |
| Campo Actividad RUT | Eliminar | Ya no se muestra en el encabezado |

---

### Resultado Visual Esperado

**Vista Previa:**
```
┌──────────────────────────────────────┐
│        CUENTA DE COBRO               │
│      DOCUMENTO EQUIVALENTE           │
│           No. 001                    │
├──────────────────────────────────────┤
│         JUAN PÉREZ GARCÍA            │  ← Nombre (bold)
│           CC. 12345678               │  ← NIT/CC
│     Calle 123 #45-67, Centro         │  ← Dirección
│         Tel: 3001234567              │  ← Teléfono
│       correo@ejemplo.com             │  ← Email
│       Régimen Simplificado           │  ← Régimen
├──────────────────────────────────────┤
│        DEBE A: JUAN PÉREZ            │
│        LA SUMA DE: ...               │
└──────────────────────────────────────┘
```

