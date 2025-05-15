'use client';

import React from 'react';
import Link from 'next/link';
import { signInWithGoogle, logout } from '@/lib/authService';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const AuthButton: React.FC = () => {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
    return <Button variant="outline" disabled>Cargando...</Button>;
  }

  if (currentUser) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">{currentUser.displayName || currentUser.email}</span>
        {isAdmin && (
          <Link href="/admin/dashboard" passHref>
            <Button variant="default" size="sm">Admin</Button>
          </Link>
        )}
        <Button variant="outline" size="sm" onClick={logout}>Cerrar Sesión</Button>
      </div>
    );
  }

  return (
    <Button variant="outline" onClick={signInWithGoogle}>Iniciar Sesión</Button>
  );
};
