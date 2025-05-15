"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function OldEditorDetailRedirect() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.pageId;
  
  useEffect(() => {
    // Redirige a la nueva ruta preservando el ID
    router.replace(`/admin/editor-admin/${pageId}`);
  }, [router, pageId]);
  
  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg">Redirigiendo al nuevo editor...</p>
    </div>
  );
}
