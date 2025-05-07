
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface CreateAgentRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        }
      }
    );

    // Verify that the request is authorized
    // Extract the JWT from the request header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header missing' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract the token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get the user
    const { data: { user: requestUser }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !requestUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if the user has admin privileges
    const { data: requestUserProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', requestUser.id)
      .single();
    
    if (profileError || !requestUserProfile || (requestUserProfile.role !== 'Admin' && requestUserProfile.role !== 'SuperAdmin')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse the request body
    const { email, password, firstName, lastName, role } = await req.json() as CreateAgentRequest;
    
    // Create the new user
    const { data: newUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });
    
    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Update the role in the profile (the trigger should've created the profile)
    if (newUser.user) {
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ role })
        .eq('id', newUser.user.id);
      
      if (updateError) {
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, user: newUser.user }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
