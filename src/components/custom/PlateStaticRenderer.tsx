'use client';

import React from 'react';
import { Value, PlateStatic } from '@udecode/plate';
import type { PlateStaticProps } from '@udecode/plate';
import { cn } from '@/lib/utils';
import { createPlateEditor } from '@udecode/plate/react';

// @ts-ignore - Los comentarios existentes indican que este módulo existe
import { basePlugins } from '@/config/plate-plugins';

interface PlateStaticRendererProps {
  content: Value;
  className?: string;
}

/**
 * Componente optimizado para renderizado estático del contenido de Plate
 * Útil para SSR/RSC (Server Side Rendering / React Server Components)
 */
export const PlateStaticRenderer: React.FC<PlateStaticRendererProps> = ({ 
  content,
  className 
}) => {
  // Verificamos que el contenido sea un array válido
  const validContent = Array.isArray(content) && content.length > 0 ? content : [];
  
  // Crear un editor estático para el contenido
  const editor = createPlateEditor({
    plugins: basePlugins,
    value: validContent
  });

  return (
    <div className={cn("plate-content-wrapper", className)}>
      <PlateStatic 
        editor={editor}
        components={{}}
        className="prose max-w-none plate-content-static"
      />
    </div>
  );
};
