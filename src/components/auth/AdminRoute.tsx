import React, { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Componente que protege las rutas administrativas
 * Solo permite acceso a usuarios autenticados y con rol de administrador
 */
export const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  redirectTo = '/' 
}) => {
  const { currentUser, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Si la autenticación ha terminado y el usuario no es admin, redirigir
    if (!loading && (!currentUser || !isAdmin)) {
      router.push(redirectTo);
    }
  }, [currentUser, isAdmin, loading, redirectTo, router]);

  // Mostrar un spinner o mensaje de carga mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Verificando permisos...</p>
      </div>
    );
  }

  // Si no es un administrador, no mostrar nada (será redirigido por useEffect)
  if (!currentUser || !isAdmin) {
    return null;
  }

  // Si es un administrador, mostrar el contenido protegido
  return <>{children}</>;
};
