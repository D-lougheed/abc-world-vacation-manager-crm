
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { UserRole, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  checkUserAccess: (requiredRole: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supaUser, setSupaUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if user is authenticated on mount and set up auth state listener
  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setSession(session);
          setSupaUser(session.user);
          // Use setTimeout to avoid potential deadlock with Supabase auth
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setSession(null);
          setSupaUser(null);
          setUser(null);
        }
      }
    );

    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSession(session);
          setSupaUser(session.user);
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Cleanup listener on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Helper to fetch user profile from profiles table
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        // Convert string role to UserRole enum
        const roleValue = data.role as UserRole;
        
        setUser({
          id: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          role: roleValue,
          isActive: data.is_active
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
      toast({
        title: "Logged out",
        description: "You have been successfully logged out"
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast({
        title: "Password reset email sent",
        description: "Please check your email for password reset instructions."
      });
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        title: "Password reset failed",
        description: error.message || "There was an error sending the reset email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully."
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Update password error:', error);
      toast({
        title: "Password update failed",
        description: error.message || "There was an error updating your password",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkUserAccess = (requiredRole: UserRole): boolean => {
    if (!user) return false;
    
    // For string-based enum, we need to check differently
    switch (user.role) {
      case UserRole.SuperAdmin:
        return true; // SuperAdmin has access to everything
      case UserRole.Admin:
        return requiredRole !== UserRole.SuperAdmin; // Admin has access to Admin and Agent roles
      case UserRole.Agent:
        return requiredRole === UserRole.Agent; // Agent only has access to Agent role
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        isAuthenticated: !!user, 
        login, 
        logout, 
        resetPassword, 
        updatePassword, 
        checkUserAccess 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
