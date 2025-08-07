-- Insert new users into auth.users table is not possible directly
-- Instead, we'll create the profile records and the users will need to be created through the signup process

-- First, let's get the role IDs we need
INSERT INTO public.profiles (id, user_id, name, email, role_id)
VALUES 
-- These will be temporary IDs until the actual users sign up
(gen_random_uuid(), gen_random_uuid(), 'Supervisor 1', 'jonathan_rv@outlook.es', (SELECT id FROM public.roles WHERE name = 'supervisor' LIMIT 1)),
(gen_random_uuid(), gen_random_uuid(), 'Administrador 1', 'luferosprod@gmail.com', (SELECT id FROM public.roles WHERE name = 'admin' LIMIT 1));