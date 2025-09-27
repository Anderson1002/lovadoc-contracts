import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authorization = req.headers.get('Authorization')
    if (!authorization) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authorization.replace('Bearer ', '')
    )

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if the user has admin permissions
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*, roles!profiles_role_id_fkey(name)')
      .eq('user_id', user.id)
      .single()

    const userRole = (profile?.roles as any)?.name
    if (!['super_admin', 'admin', 'supervisor'].includes(userRole)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { name, email, roleId, procesoId } = await req.json()

    if (!name || !email || !roleId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, roleId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send invitation to user - they will set their own password
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        name
      },
      redirectTo: 'https://3921a400-f82a-4e71-8d23-0b303023b2b9.lovableproject.com/auth'
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update the profile with the correct role and proceso if provided
    const updateData: any = {
      name,
      role_id: roleId
    }

    if (procesoId) {
      updateData.proceso_id = procesoId
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('user_id', newUser.user?.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // Try to clean up the created user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user?.id || '')
      
      return new Response(
        JSON.stringify({ error: 'Failed to create user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: newUser.user,
        message: 'Usuario creado exitosamente' 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in create-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})