
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Define CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateAgentRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

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
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
    
    // Extract the token
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get the user
    const { data: { user: requestUser }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !requestUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
    
    console.log("Authenticated user:", requestUser.id);
    
    // Check if the user has admin privileges
    const { data: requestUserProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', requestUser.id)
      .single();
    
    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Error fetching user profile', details: profileError.message }),
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
    
    if (!requestUserProfile || (requestUserProfile.role !== 'Admin' && requestUserProfile.role !== 'SuperAdmin')) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { 
          status: 403, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
    
    console.log("User has admin privileges");
    
    // Parse the request body
    const { email, password, firstName, lastName, role } = await req.json() as CreateAgentRequest;
    
    console.log("Creating new user with email:", email);
    
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
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          } 
        }
      );
    }
    
    console.log("User created successfully:", newUser.user?.id);
    
    // Update the role in the profile (the trigger should've created the profile)
    if (newUser.user) {
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ role })
        .eq('id', newUser.user.id);
      
      if (updateError) {
        console.error("Error updating profile:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              ...corsHeaders 
            } 
          }
        );
      }
      
      console.log("User role updated successfully to:", role);
    }
    
    return new Response(
      JSON.stringify({ success: true, user: newUser.user }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    );
  }
});
