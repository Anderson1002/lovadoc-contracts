# Reactivar contratos completados a "En ejecución"

## Situación actual (verificada en el código)

En el menú de acciones de un contrato:

- Con un contrato en **Completado**, solo Super Admin y Admin ven una opción, y esa opción es **"Reactivar (Registrado)"**: devuelve el contrato a *Registrado*, no a *En ejecución*. Por eso hoy hay que reactivar y luego volver a aprobar para dejarlo en ejecución.
- La opción **"Completar"** aparece únicamente cuando el contrato está **En ejecución**, y la ven Super Admin, Admin, Supervisor y Jurídica. Es decir, hoy cualquiera de esos cuatro perfiles puede pasar un contrato a *Completado*.
- El sistema nunca completa contratos solo; siempre es una acción manual de alguno de esos perfiles.

## Cambio propuesto

1. Para contratos en **Completado**, agregar a Super Admin y Admin la opción **"Reactivar (En ejecución)"**, que deja el contrato listo para radicar cuentas de cobro en un solo paso. Se mantiene también "Reactivar (Registrado)" por si se necesita revisarlo de nuevo.
2. Igual para contratos en **Cancelado**: ofrecer las dos opciones de reactivación.
3. Cada cambio sigue quedando registrado en el historial del contrato con el usuario y la fecha, como ya ocurre hoy.

## Qué muestra el historial

Todos los contratos hoy en "Completado" los pasó a ese estado la supervisora Vanessa Quevedo (lidy-456@hotmail.com) el 16 y 17 de septiembre de 2026, desde "En ejecución". Ninguno fue automático; cada cambio quedó registrado en el historial del contrato con usuario y fecha.

## Pendiente de tu decisión

¿Dejamos que Supervisor y Jurídica sigan pudiendo marcar contratos como "Completado", o limitamos esa acción solo a Super Admin y Admin? Dado que fue la supervisora quien completó todos estos contratos, esta decisión es el punto clave. Si no dices nada, se queda como está hoy.

## Detalle técnico

Único archivo a modificar: `src/components/contracts/ContractStateActions.tsx`, en `getAvailableActions()` para los casos `completado` y `cancelado`. La lógica de actualización (`estado`, `state_code`, `contract_state_history`, `activities`) ya soporta cualquier estado destino, no requiere cambios.
