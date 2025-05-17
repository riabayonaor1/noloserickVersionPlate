'use client';

import React, { useState, useEffect, Suspense } from 'react';
import type { Value } from '@udecode/plate';
import { serializeMd } from '@udecode/plate-markdown';
import { createPlateEditor } from '@udecode/plate/react';
import { basePlugins } from '@/config/plate-plugins';
import { PlateRenderer } from '@/components/custom/PlateRenderer';
import { PlateToHtml } from '@/components/custom/PlateToHtml';

interface PageRendererProps {
  content: Value | string;
  format?: 'plate' | 'html' | 'markdown';
}

/**
 * Componente para renderizar contenido de Plate en diferentes formatos
 * - plate: Usa PlateRenderer con componentes nativos en modo readOnly
 * - html: Convierte a HTML estático con serializeHtml
 * - markdown: Convierte a Markdown con serializeMd
 */
export const PageRenderer: React.FC<PageRendererProps> = ({ 
  content,
  format = 'plate' // Por defecto usa el renderizado nativo de Plate
}) => {
  const [processedContent, setProcessedContent] = useState<string | Value>('');
  const [parsedContent, setParsedContent] = useState<Value | null>(null);
  
  // Función para parsear el contenido JSON si es necesario
  const parseContent = (content: Value | string): Value => {
    if (typeof content === 'string') {
      try {
        return JSON.parse(content);
      } catch (e) {
        console.error('Error al parsear el contenido JSON:', e);
        // Devolver un array con un nodo de párrafo vacío como fallback
        return [{ type: 'p', children: [{ text: String(content) }] }];
      }
    }
    return content;
  };
  
  useEffect(() => {
    // Parsear el contenido si es necesario
    const validContent = parseContent(content);
    setParsedContent(validContent);
    
    // Procesar según el formato solicitado
    if (format === 'markdown') {
      try {
        // Crear un editor temporal para serializar a markdown
        const editor = createPlateEditor({
          plugins: basePlugins,
          value: validContent
        });
        
        // Usar serializeMd para convertir a markdown
        const markdownContent = serializeMd(editor);
        setProcessedContent(markdownContent);
      } catch (error) {
        console.error('Error al convertir el contenido a Markdown:', error);
        setProcessedContent(String(content));
      }
    } else {
      // Para html o plate, mantenemos el contenido parseado
      setProcessedContent(validContent);
    }
  }, [content, format]);

  // Renderizado para formatos diferentes
  if (!parsedContent) {
    return <div className="p-4 text-gray-500 italic">Cargando contenido...</div>;
  }
  
  // Para markdown, renderizamos como texto preformateado
  if (format === 'markdown') {
    return (
      <pre className="markdown-content whitespace-pre-wrap break-words text-sm p-4 bg-gray-50 rounded-md">
        {processedContent as string}
      </pre>
    );
  }
  
  // Para HTML, utilizamos el componente PlateToHtml que hace la conversión
  if (format === 'html') {
    return <PlateToHtml content={parsedContent} />;
  }
  
  // Por defecto (plate), utilizamos PlateRenderer con los componentes nativos en modo readOnly
  return (
    <Suspense fallback={<div>Cargando editor...</div>}>
      <PlateRenderer content={parsedContent} />
    </Suspense>
  );
};
