import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SupabaseGoogleButton from '@/components/auth/SupabaseGoogleButton';
import { User } from '@/api/entities';

export default function SupabaseLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [configError, setConfigError] = useState(null);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    // Check Supabase configuration
    const checkConfig = () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        setConfigError('Supabase configuration is missing. Please check your environment variables.');
        return false;
      }
      return true;
    };

    // Check if user is already logged in
    const checkAuth = async () => {
      if (!checkConfig()) return;
      
      try {
        const user = await User.getCurrentUser();
        if (user) {
          navigate('/');
        }
      } catch (error) {
        console.log('No user logged in or auth error:', error.message);
        // Don't set error here as it might be just that no user is logged in
      }
    };
    checkAuth();
  }, [navigate]);

  const handleInputChange = (formType, field, value) => {
    if (formType === 'login') {
      setLoginData(prev => ({ ...prev, [field]: value }));
    } else {
      setSignUpData(prev => ({ ...prev, [field]: value }));
    }
    setError(null);
    setSuccess(null);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await User.login(loginData.email, loginData.password);
      
      if (result.success) {
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      const result = await User.register({
        email: signUpData.email,
        password: signUpData.password,
        full_name: signUpData.email.split('@')[0]
      });
      
      if (result.success) {
        setSuccess('Account created successfully! Please check your email for verification.');
        // Clear form
        setSignUpData({ email: '', password: '', confirmPassword: '' });
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = (user) => {
    setSuccess('Login successful! Redirecting...');
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const handleGoogleError = (error) => {
    console.error('Google login error:', error);
    setError('Google login failed. Please try again.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Travel Concierge</CardTitle>
          <CardDescription className="text-center">
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {configError && (
            <Alert variant="destructive">
              <AlertDescription>
                {configError}
                <br />
                <span className="text-sm mt-2 block">
                  Please create a .env file with your Supabase credentials. See .env.example for reference.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Google Login */}
          <SupabaseGoogleButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            disabled={loading || configError}
            className="w-full"
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Login/Signup Tabs */}
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginData.email}
                    onChange={(e) => handleInputChange('login', 'email', e.target.value)}
                    required
                    disabled={loading || configError}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => handleInputChange('login', 'password', e.target.value)}
                    required
                    disabled={loading || configError}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || configError}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signUpData.email}
                    onChange={(e) => handleInputChange('signup', 'email', e.target.value)}
                    required
                    disabled={loading || configError}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Create a password"
                    value={signUpData.password}
                    onChange={(e) => handleInputChange('signup', 'password', e.target.value)}
                    required
                    disabled={loading || configError}
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="Confirm your password"
                    value={signUpData.confirmPassword}
                    onChange={(e) => handleInputChange('signup', 'confirmPassword', e.target.value)}
                    required
                    disabled={loading || configError}
                    minLength={6}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || configError}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Creating account...
                    </>
                  ) : (
                    'Sign Up'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}