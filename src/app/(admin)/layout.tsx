"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push('/'); // Redirect to home if not logged in
      } else if (!isAdmin) {
        router.push('/'); // Redirect to home if not admin
      }
    }
  }, [currentUser, isAdmin, loading, router]);

  if (loading || !currentUser || !isAdmin) {
    // Show a loading state or a minimal layout while checking auth
    // Or redirect immediately, but useEffect handles redirection after loading
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Cargando o verificando acceso...</p>
      </div>
    );
  }

  // If admin, render the children (admin pages)
  return <>{children}</>;
}

