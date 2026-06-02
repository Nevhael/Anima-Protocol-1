import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import { useUser, useClerk } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

// Bridges Clerk's session into the app's existing auth interface. Identity is
// owned by Clerk; the local (base44/localStorage) record holds profile and
// settings data the rest of the app already reads via base44.auth.me().
export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isLoadingPublicSettings] = useState(false);
  const [appPublicSettings] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn && clerkUser) {
      const identity = {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        full_name:
          clerkUser.fullName || clerkUser.username || 'Seeker',
      };
      const merged = base44.auth.syncIdentity(identity);
      if (!merged.display_name) {
        const preferred =
          clerkUser.firstName || clerkUser.fullName || clerkUser.username;
        if (preferred) {
          merged.display_name = preferred;
          base44.auth.syncIdentity({ display_name: preferred });
        }
      }
      setUser(merged);
      setAuthError(null);
    } else {
      base44.auth.clearSession();
      setUser(null);
    }
  }, [isLoaded, isSignedIn, clerkUser?.id]);

  const isAuthenticated = !!isSignedIn;
  const isLoadingAuth = !isLoaded;

  const navigateToLogin = useCallback(() => {
    navigate('/sign-in');
  }, [navigate]);

  // Clerk owns the session and the post-logout redirect. We always land
  // signed-out users on the public landing page ("/"), never the bare
  // sign-in screen.
  const logout = useCallback(
    async () => {
      await base44.auth.logout();
      setUser(null);
      setAuthError(null);
      await signOut({ redirectUrl: '/' });
    },
    [signOut],
  );

  const updateUserData = useCallback(async (data) => {
    const updated = await base44.auth.updateMyUserData(data);
    setUser(updated);
    return updated;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isAuthenticated,
        setIsAuthenticated: () => {},
        isLoadingAuth,
        authChecked: isLoaded,
        checkUserAuth: () => {},
        isLoadingPublicSettings,
        authError,
        setAuthError,
        appPublicSettings,
        navigateToLogin,
        logout,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
