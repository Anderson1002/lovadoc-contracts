

# Plan: Crear usuario Super Admin

## Datos del usuario
- **Nombre**: Anderson Salazar Acosta
- **Email**: anderson_acosta1602@hotmail.com
- **Rol**: super_admin

## Accion

Llamar la edge function `create-user` existente usando `supabase--curl_edge_functions` con los datos del usuario. La funcion:

1. Envia una invitacion por email al usuario
2. Crea el perfil con rol super_admin
3. El usuario configura su contrasena desde el enlace en el email

## Pasos

1. Obtener el `role_id` del rol `super_admin` de la tabla `roles`
2. Invocar la edge function `create-user` con nombre, email y roleId
3. Verificar que el perfil se creo correctamente en la tabla `profiles`

## Nota importante

El usuario recibira un email de invitacion en anderson_acosta1602@hotmail.com para configurar su contrasena. No es posible copiar la contrasena de otro usuario por seguridad.

