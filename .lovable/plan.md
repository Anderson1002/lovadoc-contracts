

# Validacion del Flujo Completo: Cuentas de Cobro por Rol

## Estado Actual de la Base de Datos

Solo existe 1 cuenta de cobro:
- **COB-202512-001** - Estado: `borrador` - Creada por: salazar.anderson2@gmail.com (EMPLOYEE)
- No existe un usuario con ROL = TREASURY en el sistema actualmente

## Flujo de Estados

```text
borrador --> pendiente_revision --> aprobada --> causada
                |                      |
                v                      v
            rechazada          pendiente_revision
                |               (devuelta por treasury)
                v
        pendiente_revision
        (reenvio por employee)
```

## Visibilidad por Rol y Pestana

### ROL = EMPLOYEE (salazar.anderson2@gmail.com)

| Pestana | Que ve | Filtro |
|---------|--------|--------|
| Mis Cuentas | Sus propias cuentas en TODOS los estados | RLS: created_by = su perfil |
| Todas las Cuentas | Solo sus propias cuentas | RLS limita a sus cuentas |
| Pendientes Revision | NO visible | Tab oculta para employee |
| Cuentas por Pagar | NO visible | Tab oculta para employee |

**Acciones disponibles:**
- Editar: solo en `borrador` o `rechazada`
- Enviar a revision: solo en `borrador` o `rechazada`
- Eliminar: solo en `borrador`

### ROL = SUPERVISOR (sistemas.ingeniero3@hus.org.co)

| Pestana | Que ve | Filtro |
|---------|--------|--------|
| Mis Cuentas | NO visible | Tab oculta para supervisor |
| Pendientes Revision | Cuentas en `pendiente_revision` de su proceso | query: status = pendiente_revision + RLS: proceso_id |
| Todas las Cuentas | Cuentas de su proceso EXCEPTO borradores | Codigo + RLS: status != borrador AND proceso del supervisor |
| Cuentas por Pagar | NO visible | Tab oculta para supervisor |

**Acciones disponibles:**
- Aprobar: cambia a `aprobada`
- Devolver/Rechazar: cambia a `rechazada` (requiere comentario)

### ROL = TREASURY (no existe usuario aun)

| Pestana | Que ve | Filtro |
|---------|--------|--------|
| Mis Cuentas | NO visible | Tab oculta para treasury |
| Pendientes Revision | NO visible | Tab oculta para treasury |
| Cuentas por Pagar | Solo cuentas en estado `aprobada` | query: status = aprobada |
| Todas las Cuentas | Todas las cuentas EXCEPTO borradores | Codigo + RLS: status != borrador |

**Acciones disponibles:**
- Marcar como Causada: cambia a `causada`
- Devolver al Supervisor: cambia a `pendiente_revision`

### ROL = ADMIN / SUPER_ADMIN

| Pestana | Que ve | Filtro |
|---------|--------|--------|
| Mis Cuentas | Visible, sus propias cuentas | |
| Pendientes Revision | Visible, todas las pendientes | |
| Cuentas por Pagar | Visible, todas las aprobadas | |
| Todas las Cuentas | TODAS las cuentas incluyendo borradores | Sin restriccion |

## Validacion de Seguridad (RLS)

Las politicas RLS en la base de datos refuerzan correctamente la logica:

1. **EMPLOYEE** ve solo sus propias cuentas (todos los estados) - CORRECTO
2. **SUPERVISOR** ve cuentas de su proceso EXCEPTO borradores - CORRECTO
3. **TREASURY** ve todas las cuentas EXCEPTO borradores - CORRECTO
4. **ADMIN/SUPER_ADMIN** ve todo - CORRECTO

Los triggers de transicion de estado (`validate_cuenta_transition`) tambien estan correctos:
- Employee: borrador/rechazada -> pendiente_revision
- Supervisor: pendiente_revision -> aprobada/rechazada
- Treasury: aprobada -> causada o pendiente_revision

## Conclusion

El flujo esta correctamente implementado tanto a nivel de codigo como de RLS. La unica observacion es que **no existe un usuario con ROL = TREASURY** en el sistema. Para probar el flujo completo, se necesita crear uno.

No se requieren cambios de codigo. Todo funciona segun la logica de negocio descrita.

