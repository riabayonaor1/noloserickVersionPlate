'use client';

import React from 'react';
import { Value } from '@udecode/plate';
import { createPlateEditor } from '@udecode/plate/react';
import { serializeHtml } from '@udecode/plate';

// Importamos los plugins desde la configuración existente
import { basePlugins } from '@/config/plate-plugins';

interface PlateToHtmlProps {
  content: Value;
  className?: string;
}

/**
 * Componente que convierte contenido JSON de Plate a HTML estático
 */
export const PlateToHtml: React.FC<PlateToHtmlProps> = ({ content, className }) => {
  // Verificar que el contenido sea válido
  const validContent = Array.isArray(content) && content.length > 0 ? content : [];
  
  // Crear un editor temporal con los plugins necesarios
  const editor = createPlateEditor({
    plugins: basePlugins,
    value: validContent,
  });

  // Convertir el contenido a HTML
  const htmlContent = serializeHtml(editor, {
    components: {},
  });

  return (
    <div 
      className={`plate-html-content prose max-w-none ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
