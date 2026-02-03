import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './useRedux';
import { signIn, signUp, signOut, checkSession } from '../store/authSlice';
import { UserRole } from '../types';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, loading, error, isAuthenticated, initialCheckDone } = useAppSelector((state) => state.auth);
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    if (!hasCheckedSession.current) {
      hasCheckedSession.current = true;
      dispatch(checkSession());
    }
  }, [dispatch]);

  const login = async (email: string, password: string) => {
    return dispatch(signIn({ email, password }));
  };

  const register = async (email: string, password: string, name: string, role?: UserRole) => {
    return dispatch(signUp({ email, password, name, role }));
  };

  const logout = async () => {
    return dispatch(signOut());
  };

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  return {
    user,
    loading,
    error,
    isAuthenticated,
    initialCheckDone,
    login,
    register,
    logout,
    hasRole,
  };
};
