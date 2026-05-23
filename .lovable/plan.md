# Integrar el logo oficial de KHUBA

El logo que subiste combina "KHUBA" en tipografía serif clara con "Servicios especializados" en script verde encima. Lo incorporamos al diseño actual reemplazando el marcador "K" cuadrado que generé como placeholder.

## Pasos

1. **Guardar el logo en el proyecto**
   - Copiar `user-uploads://image-136.png` a `src/assets/khuba-logo.png` (versión original, fondo transparente/claro — sirve para fondos claros).
   - Generar una variante en blanco/claro con `imagegen--edit_image` para usar sobre el panel oscuro izquierdo del Auth (donde el verde se pierde). Se guarda como `src/assets/khuba-logo-light.png`.
   - Copiar también a `public/khuba-logo.png` para usarlo como `og:image` y `apple-touch-icon`.

2. **Reemplazar el componente `KHUBAMark` en `src/pages/Auth.tsx`**
   - Eliminar el cuadrado con la letra "K".
   - En el panel izquierdo oscuro: mostrar el logo (variante clara) grande y centrado arriba, sin el texto duplicado "KHUBA / Servicios Especializados" debajo (el logo ya lo contiene). Mantener tagline, bullets y footer.
   - En la tarjeta derecha (header del formulario de login): mostrar el logo original a tamaño moderado (~140px ancho) centrado, reemplazando el "K" + título.

3. **Actualizar favicon y metadatos en `index.html`**
   - Cambiar el favicon SVG con la "K" por `<link rel="icon" href="/khuba-logo.png">`.
   - Actualizar `apple-touch-icon` y `og:image` para apuntar al logo real.

## Detalles técnicos

- Import del asset: `import khubaLogo from "@/assets/khuba-logo.png"` (bundling Vite).
- Tamaños responsive: `max-w-[280px]` en panel izquierdo, `max-w-[160px]` en tarjeta derecha.
- `alt="KHUBA - Servicios Especializados"` para accesibilidad y SEO.
- No tocar lógica de auth, rutas, ni otros componentes que ya usan el texto "KHUBA".

## Pregunta opcional

¿Quieres que también reemplace el `KHUBA` textual del navbar interno (`src/components/ui/navbar.tsx` y `professional-nav.tsx`) por el logo, o lo dejo solo en el Auth por ahora?
