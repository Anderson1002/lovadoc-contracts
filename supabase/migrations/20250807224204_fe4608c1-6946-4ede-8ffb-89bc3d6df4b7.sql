-- Actualizar el perfil del usuario para asignarle el rol de supervisor
UPDATE profiles 
SET 
  role_id = (SELECT id FROM roles WHERE name = 'supervisor'),
  name = 'Supervisor',
  updated_at = now()
WHERE email = 'jonathan_rv@outlook.es';