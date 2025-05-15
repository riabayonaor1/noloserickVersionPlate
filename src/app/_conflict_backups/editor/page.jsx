"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OldEditorRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirige a la nueva ruta
    router.replace('/admin/editor-admin');
  }, [router]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Redirigiendo al nuevo editor...</p>
    </div>
  );
}
