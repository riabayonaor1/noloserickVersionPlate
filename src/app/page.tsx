'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirigir automáticamente a la página /home
    router.replace('/home');
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen flex-col">
      <p className="text-lg">Redirigiendo al inicio...</p>
      
      {/* Agregar un enlace por si la redirección automática falla */}
      <a href="/home" className="mt-4 text-blue-600 hover:underline">
        Haga clic aquí si no es redirigido automáticamente
      </a>
    </div>
  );
}
