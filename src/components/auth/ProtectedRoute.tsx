'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAdminRoute?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  isAdminRoute = false 
}) => {
  const { currentUser, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/');
      } else if (isAdminRoute && !isAdmin) {
        router.push('/');
      }
    }
  }, [currentUser, isAdmin, loading, router, isAdminRoute]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Verificando autenticación...</div>;
  }

  if (!currentUser) {
    return null; // Redirect will happen in useEffect
  }

  if (isAdminRoute && !isAdmin) {
    return null; // Redirect will happen in useEffect
  }

  return <>{children}</>;
};

export default ProtectedRoute;
