## Objetivo

1. Reemplazar el favicon por uno propio de **Maktub** (SVG inline, sin archivo externo, igual al patrón del HTML de KHUBA que enviaste).
2. Elevar la página de login (`/auth`) a un look más **profesional/corporativo**, alejándola de la plantilla genérica actual.

---

## 1. Favicon Maktub (SVG inline)

En `index.html`, dentro del `<head>`:

- Eliminar la referencia al favicon actual (Lovable por defecto) y al `public/favicon.ico` (también se borra el archivo para que el navegador no caiga en él).
- Insertar un `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,...">` con un SVG inline:
  - Cuadrado redondeado (rx≈20) con el azul corporativo (`hsl(--primary)` traducido a hex: `#2563EB` aprox., el mismo del botón "Iniciar Sesión").
  - Letra **"M"** centrada en blanco, fuente serif/sans bold.
- Agregar también `<link rel="apple-touch-icon">` con el mismo data-URI para iOS.

Resultado: la pestaña muestra un cuadrado azul con la **M** blanca + el título "Maktub — Gestión Digital de Contratos Hospitalarios". Cero rastro de Lovable.

> Nota: si en el futuro quieres un logo más elaborado (con tipografía custom tipo el KHUBA que enviaste), conviene un PNG/SVG real en `public/`. Para ahora el inline es lo más rápido y limpio.

---

## 2. Rediseño profesional de `/auth`

**Diagnóstico de lo actual** (`src/pages/Auth.tsx` líneas 110–122):
- Tarjeta blanca centrada flotando sobre fondo degradado celeste muy suave.
- Logo = ícono genérico `Building2` de Lucide dentro de un cuadrado azul → se ve "demo de Lovable".
- Tipografía y jerarquía planas (`text-2xl` para "Maktub", sin acento visual).
- No transmite contexto hospitalario / institucional.

**Dirección de rediseño propuesta — "Corporativo institucional"**:

Layout split-screen (dos columnas en desktop, apilado en mobile):

```text
+---------------------------------+------------------------+
|                                 |                        |
|  Panel izquierdo (60%)          |  Formulario (40%)      |
|  - Fondo azul corporativo        |  - Fondo blanco        |
|    con gradiente sutil + patrón |  - Logo Maktub arriba  |
|    geométrico opaco              |  - "Acceso al Sistema" |
|  - Logo Maktub en grande         |  - Email + Contraseña  |
|  - Tagline:                      |  - Botón "Ingresar"    |
|    "Gestión Digital de           |  - Olvidé contraseña   |
|     Contratos Hospitalarios"    |  - Aviso de seguridad  |
|  - 3 bullets de valor:           |    discreto al pie     |
|    · Contratos centralizados     |                        |
|    · Cuentas de cobro digitales |                        |
|    · Trazabilidad y auditoría    |                        |
|  - Footer: v1.0 · año · empresa  |                        |
+---------------------------------+------------------------+
```

**Cambios visuales concretos**:
- Logo: cuadrado redondeado con la **"M"** + wordmark "Maktub" al lado (no el ícono `Building2`).
- Tipografía: heading con `tracking-tight` y peso 700, tamaño mayor (`text-3xl`/`text-4xl`).
- Botón: degradado sutil del primary + sombra más marcada en hover, microanimación.
- Inputs con altura mayor (`h-11`) y foco con anillo del primary.
- Caja "¿No tienes acceso?" → reemplazada por una línea discreta tipo "El acceso es proporcionado por el área administrativa".
- Pie de página: "© 2026 Maktub · Sistema de gestión hospitalaria v1.0".
- Mobile: el panel izquierdo se colapsa a una banda superior corta con solo logo + tagline.

**Sin cambios funcionales**: login, recuperación de contraseña, validaciones y rutas siguen idénticos. Solo presentación.

---

## Archivos afectados

- `index.html` — reemplazar favicon, agregar apple-touch-icon.
- `public/favicon.ico` — eliminar (para evitar fallback al ícono Lovable).
- `src/pages/Auth.tsx` — rediseño completo del JSX de presentación (sin tocar handlers `handleSignIn`, `handlePasswordReset`).

## Fuera de alcance

- No se cambia la lógica de autenticación ni rutas.
- No se modifica el resto de la app (sidebar, dashboard) — solo `/auth`.
- No se sube un logo PNG/SVG externo (queda pendiente para cuando tengas el archivo final del logo Maktub).

## Confirmación opcional

Antes de implementar el rediseño de `/auth`, puedo generarte **3 prototipos visuales** (HTML renderizado) con variaciones de la dirección "Corporativo institucional" para que elijas el que más te guste. Si prefieres, lo construyo directamente con la propuesta descrita arriba.
