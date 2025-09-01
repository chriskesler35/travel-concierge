import { supabase } from '@/lib/supabase';

class SupabaseAuthService {
  constructor() {
    this.user = null;
    this.session = null;
    this.initialized = false;
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting initial session:', error);
        return;
      }

      this.session = session;
      this.user = session?.user || null;
      this.initialized = true;

      // Listen for auth changes
      supabase.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        this.session = session;
        this.user = session?.user || null;
        
        // Handle auth events
        this.handleAuthEvent(event, session);
      });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    }
  }

  handleAuthEvent(event, session) {
    switch (event) {
      case 'SIGNED_IN':
        console.log('User signed in:', session.user.email);
        break;
      case 'SIGNED_OUT':
        console.log('User signed out');
        break;
      case 'TOKEN_REFRESHED':
        console.log('Token refreshed');
        break;
    }
  }

  // Email/Password Authentication
  async signUp(email, password, options = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: options.metadata || {}
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        user: data.user, 
        needsConfirmation: !data.session 
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message };
    }
  }

  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      this.session = data.session;
      this.user = data.user;

      return { success: true, user: data.user, session: data.session };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  // OAuth Authentication
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
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
      console.error('Google sign in error:', error);
      return { success: false, error: error.message };
    }
  }

  async signInWithProvider(provider, options = {}) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
          ...options
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error(`${provider} sign in error:`, error);
      return { success: false, error: error.message };
    }
  }

  // Sign Out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
      }

      this.session = null;
      this.user = null;

      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  }

  // Password Reset
  async resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Password update error:', error);
      return { success: false, error: error.message };
    }
  }

  // User Profile Management
  async updateProfile(updates) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });

      if (error) {
        return { success: false, error: error.message };
      }

      this.user = data.user;
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Profile update error:', error);
      return { success: false, error: error.message };
    }
  }

  // Utility Methods
  isAuthenticated() {
    return !!this.session && !!this.user;
  }

  getUser() {
    return this.user;
  }

  getSession() {
    return this.session;
  }

  getAccessToken() {
    return this.session?.access_token || null;
  }

  getUserId() {
    return this.user?.id || null;
  }

  getUserEmail() {
    return this.user?.email || null;
  }

  getUserMetadata() {
    return this.user?.user_metadata || {};
  }

  // Wait for auth to initialize
  async waitForAuth() {
    if (this.initialized) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const checkAuth = () => {
        if (this.initialized) {
          resolve();
        } else {
          setTimeout(checkAuth, 100);
        }
      };
      checkAuth();
    });
  }

  // Database helpers
  async query(table) {
    await this.waitForAuth();
    return supabase.from(table);
  }

  async storage(bucket) {
    await this.waitForAuth();
    return supabase.storage.from(bucket);
  }
}

// Export singleton instance
export default new SupabaseAuthService();