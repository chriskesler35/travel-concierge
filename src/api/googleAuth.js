import apiClient from './apiClient';
import auth from './auth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

class GoogleAuthService {
  constructor() {
    this.isInitialized = false;
    this.initPromise = null;
  }

  async initialize() {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      // Wait for Google Identity Services to load
      const checkGoogleLoaded = () => {
        if (window.google && window.google.accounts) {
          try {
            window.google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID,
              callback: this.handleCredentialResponse.bind(this),
              auto_select: false,
              cancel_on_tap_outside: true,
            });
            this.isInitialized = true;
            resolve();
          } catch (error) {
            reject(new Error('Failed to initialize Google Identity Services: ' + error.message));
          }
        } else {
          setTimeout(checkGoogleLoaded, 100);
        }
      };
      
      checkGoogleLoaded();
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.isInitialized) {
          reject(new Error('Google Identity Services failed to load'));
        }
      }, 10000);
    });

    return this.initPromise;
  }

  async handleCredentialResponse(response) {
    try {
      // Use the auth service's Google login method
      const result = await auth.loginWithGoogle(response.credential);
      
      if (result.success) {
        // Redirect or update UI as needed
        window.location.reload();
        return result;
      } else {
        console.error('Google login failed:', result.error);
        return result;
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { 
        success: false, 
        error: error.message || 'Google login failed' 
      };
    }
  }

  async signIn(parentElement) {
    try {
      await this.initialize();
      
      if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_oauth_client_id_here') {
        throw new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file');
      }

      // Render the Google Sign-In button
      window.google.accounts.id.renderButton(parentElement, {
        theme: 'outline',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'signin_with',
        logo_alignment: 'left',
        width: '100%'
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to render Google Sign-In button:', error);
      return { success: false, error: error.message };
    }
  }

  async signInWithPopup() {
    try {
      await this.initialize();
      
      if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_oauth_client_id_here') {
        throw new Error('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file');
      }

      return new Promise((resolve, reject) => {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fallback to One Tap if available
            this.showOneTap().then(resolve).catch(reject);
          }
        });
      });
    } catch (error) {
      console.error('Google popup sign-in failed:', error);
      return { success: false, error: error.message };
    }
  }

  async showOneTap() {
    try {
      await this.initialize();
      
      return new Promise((resolve) => {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isDisplayed()) {
            resolve({ success: true, message: 'One Tap displayed' });
          } else {
            resolve({ 
              success: false, 
              message: 'One Tap not displayed: ' + notification.getNotDisplayedReason() 
            });
          }
        });
      });
    } catch (error) {
      console.error('One Tap failed:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      if (window.google && window.google.accounts && window.google.accounts.id) {
        window.google.accounts.id.disableAutoSelect();
      }
      
      // Also sign out from the regular auth service
      await auth.logout();
      
      return { success: true };
    } catch (error) {
      console.error('Google sign out failed:', error);
      return { success: false, error: error.message };
    }
  }

  isConfigured() {
    return GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'your_google_oauth_client_id_here';
  }
}

export default new GoogleAuthService();