import { useContext } from 'react';
import { AuthContext } from './AuthContext';

// Custom hook with error boundary for misuse
// Why: Ensures the hook is only used within the AuthProvider tree
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Wrap your component tree with <AuthProvider>.'
    );
  }
  
  return context;
}