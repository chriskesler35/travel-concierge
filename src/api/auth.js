import { supabase } from '@/lib/supabase';

class AuthService {
  constructor() {
    this.user = null;
    this.initializeAuth();
  }
  
  async initializeAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        this.setUser(user);
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change in AuthService:', event, session?.user?.email);
        if (event === 'SIGNED_IN' && session?.user) {
          await this.ensureUserProfile(session.user);
          await this.getCurrentUser();
        } else {
          this.setUser(session?.user || null);
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  }

  setUser(user) {
    this.user = user ? {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      role: user.user_metadata?.role || 'user',
      subscription_tier: user.user_metadata?.subscription_tier || 'free'
    } : null;
  }

  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      this.setUser(data.user);
      return { success: true, user: this.user };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Login failed' 
      };
    }
  }

  async loginWithGoogle() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Google login error:', error);
      return { 
        success: false, 
        error: 'Google login failed' 
      };
    }
  }

  async register(userData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.full_name || userData.name,
            role: userData.role || 'user'
          }
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      this.setUser(data.user);
      return { success: true, user: this.user };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: 'Registration failed' 
      };
    }
  }

  async logout() {
    try {
      await supabase.auth.signOut();
      this.user = null;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  async getCurrentUser() {
    try {
      console.log('AuthService: Getting current user...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('AuthService: Found auth user:', user.email);
        
        // Try to fetch user profile from users table
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && userProfile) {
          console.log('AuthService: Found user profile:', userProfile);
          this.user = {
            id: user.id,
            email: user.email,
            full_name: userProfile.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: userProfile.role || 'user',
            subscription_tier: userProfile.subscription_tier || 'free',
            subscription_status: userProfile.subscription_status || 'active',
            avatar_url: userProfile.avatar_url,
            preferences: userProfile.preferences || {},
            onboarding_completed: userProfile.onboarding_completed || false
          };
        } else {
          console.log('AuthService: No user profile found, using auth data. Error:', error?.message);
          // Fallback to auth user data if no profile exists
          this.user = {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            role: 'user', // Default role
            subscription_tier: 'free', // Default tier
            subscription_status: 'active'
          };
        }
      } else {
        console.log('AuthService: No auth user found');
        this.user = null;
      }
      
      console.log('AuthService: Returning user:', this.user);
      return this.user;
    } catch (error) {
      console.error('AuthService: Error fetching current user:', error);
      // Return fallback user data if there's an error
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        this.user = {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          role: 'user',
          subscription_tier: 'free',
          subscription_status: 'active'
        };
      } else {
        this.user = null;
      }
      return this.user;
    }
  }
  
  async me() {
    return await this.getCurrentUser();
  }

  async updateProfile(updates) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      this.setUser(data.user);
      return { success: true, user: this.user };
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        error: 'Update failed' 
      };
    }
  }

  async changePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Password change error:', error);
      return { 
        success: false, 
        error: 'Password change failed' 
      };
    }
  }

  async requestPasswordReset(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Password reset request error:', error);
      return { 
        success: false, 
        error: 'Request failed' 
      };
    }
  }

  async resetPassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { 
        success: false, 
        error: 'Reset failed' 
      };
    }
  }

  isAuthenticated() {
    // Make this synchronous to avoid blocking initial render
    return !!this.user;
  }
  
  async checkAuthenticated() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return !!session;
    } catch (error) {
      console.error('Authentication check error:', error);
      return false;
    }
  }

  async getToken() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Token retrieval error:', error);
      return null;
    }
  }

  getUser() {
    return this.user;
  }

  hasRole(role) {
    return this.user?.role === role || false;
  }

  hasPermission(permission) {
    // For now, admin users have all permissions
    return this.user?.role === 'admin' || false;
  }

  // Ensure user profile exists in users table
  async ensureUserProfile(authUser) {
    try {
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();

      if (!existingProfile) {
        // Create user profile
        const { error } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
            role: 'user',
            subscription_tier: 'free',
            email_verified: !!authUser.email_confirmed_at
          });

        if (error) {
          console.error('Error creating user profile:', error);
        } else {
          console.log('Created user profile for:', authUser.email);
        }
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  }

  // Update user activity
  async updateUserActivity() {
    try {
      if (this.user) {
        const { error } = await supabase.rpc('update_user_activity');
        if (error) {
          console.error('Error updating user activity:', error);
        }
      }
    } catch (error) {
      console.error('Error updating user activity:', error);
    }
  }
}

export default new AuthService();