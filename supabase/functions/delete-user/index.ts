// supabase/functions/delete-user/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Get allowed origins from environment or use default
const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').filter(Boolean);

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';

  // Check if origin is allowed (or allow all in development)
  const isAllowed = allowedOrigins.length === 0 || allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowedOrigins[0] || '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with SERVICE ROLE key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Verify requester is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Unauthorized')
    }
    const token = authHeader.replace('Bearer ', '')

    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !requester) {
      throw new Error('Unauthorized')
    }

    // Check if requester is admin
    const { data: requesterProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', requester.id)
      .single()

    if (!requesterProfile || !['super_admin', 'admin'].includes(requesterProfile.role)) {
      throw new Error('Forbidden - Admin access required')
    }

    // Get request body
    const { userId } = await req.json()

    if (!userId) {
      throw new Error('User ID is required')
    }

    // Cannot delete yourself
    if (userId === requester.id) {
      throw new Error('Cannot delete your own account')
    }

    // Get target user's profile
    const { data: targetProfile, error: targetError } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', userId)
      .single()

    if (targetError || !targetProfile) {
      throw new Error('User not found')
    }

    // Super admins cannot be deleted
    if (targetProfile.role === 'super_admin') {
      throw new Error('Cannot delete a Super Admin user')
    }

    // Regular admins cannot delete other admins
    if (requesterProfile.role === 'admin' && targetProfile.role === 'admin') {
      throw new Error('Admins cannot delete other Admin users')
    }

    // Nullify references in related tables before deletion
    // This handles foreign key constraints gracefully
    const tablesToUpdate = [
      { table: 'actividades', column: 'created_by' },
      { table: 'cotizaciones', column: 'created_by' },
      { table: 'cotizaciones', column: 'updated_by' },
      { table: 'ventas', column: 'created_by' },
      { table: 'ventas', column: 'updated_by' },
      { table: 'pagos', column: 'created_by' },
      { table: 'receipts', column: 'created_by' },
      { table: 'grupos', column: 'created_by' },
    ];

    for (const { table, column } of tablesToUpdate) {
      const { error } = await supabaseAdmin
        .from(table)
        .update({ [column]: null })
        .eq(column, userId);

      if (error) {
        console.log(`Note: Could not update ${table}.${column}:`, error.message);
        // Continue - column might not exist or have different constraints
      }
    }

    // Delete profile first (before auth.users to avoid FK issues)
    const { error: profileDeleteError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      console.error('Profile delete error:', profileDeleteError);
      throw new Error(`Cannot delete profile: ${profileDeleteError.message}`);
    }

    // Delete from auth.users
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      // Profile already deleted, log but don't fail completely
      console.error('Auth delete error (profile already removed):', authDeleteError);
      // User is effectively deleted since profile is gone
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `User ${targetProfile.full_name || targetProfile.email} deleted successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    const status = error.message === 'Unauthorized' ? 401
      : error.message === 'Forbidden - Admin access required' ? 403
      : error.message.includes('Cannot delete') ? 403
      : 400;

    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
