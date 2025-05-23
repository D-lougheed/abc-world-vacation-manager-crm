
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types'; // User type from useAuth context

export interface AuditLogDetails {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, any> | null;
}

export const addAuditLog = async (currentUser: User | null, logDetails: AuditLogDetails) => {
  if (!currentUser) {
    console.warn("Cannot add audit log: current user is null.");
    // Decide if you want to proceed without a user or just skip logging
    return; 
  }

  const { error } = await supabase.from('audit_logs').insert([
    {
      user_id: currentUser.id,
      user_email: currentUser.email, // This comes from the profiles table via AuthContext
      action: logDetails.action,
      resource_type: logDetails.resourceType,
      resource_id: logDetails.resourceId,
      details: logDetails.details,
    },
  ]);

  if (error) {
    console.error('Error adding audit log:', error.message);
    // Do not throw an error here to prevent breaking the main functionality
    // Consider a toast notification for the admin if logging fails critically
  }
};
