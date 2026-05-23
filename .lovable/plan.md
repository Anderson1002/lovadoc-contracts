# Rediseño visual con paleta Sage & Cream

Aplicar la paleta verde salvia + crema (alineada al logo KHUBA) a todo el sistema reemplazando el azul corporativo actual.

## Tokens nuevos (HSL en `src/index.css`)

- `--background`: `40 33% 96%` (crema claro #f7f3ec)
- `--foreground`: `90 18% 18%` (verde muy oscuro)
- `--primary`: `100 14% 35%` (verde salvia profundo, sage oscuro)
- `--primary-foreground`: `40 33% 96%` (crema)
- `--secondary`: `95 22% 87%` (verde pálido)
- `--accent`: `100 18% 53%` (sage medio del logo)
- `--muted`: `40 20% 92%`
- `--border`: `90 12% 82%`
- `--ring`: igual a `--primary`

Modo oscuro: invertir a base verde-bosque oscuro con acentos sage.

## Cambios

1. **`src/index.css`** — Reemplazar variables HSL `:root` y `.dark` con la paleta sage/cream. Mantener nombres de tokens.
2. **`tailwind.config.ts`** — Verificar que sigan mapeados a las variables (no requiere cambios si ya usa `hsl(var(--...))`).
3. **Auth (`src/pages/Auth.tsx`)** — Ya usa `bg-primary` y `text-primary-foreground`, así que el panel izquierdo cambia automáticamente al verde salvia, contrastando con el logo cream.
4. **Revisar 1 colorcito hardcodeado** si aparece (búsqueda rápida de `bg-blue`, `text-blue`, `#2563`, `bg-indigo`).

## Resultado esperado

- Panel izquierdo del login: verde salvia profundo con logo cream → look editorial/spa profesional.
- Botones, badges, links: sage en lugar de azul.
- Toda la app hereda automáticamente porque usa tokens semánticos.

## No tocar

- PDFs (Helvetica negro sobre blanco se mantiene).
- Lógica de negocio, rutas, auth.

¿Procedo con esta paleta?
