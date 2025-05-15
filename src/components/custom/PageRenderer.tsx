'use client';

import React, { useState, useEffect } from 'react';
import type { Value } from '@udecode/plate';
import {
  usePlateEditor,
  Plate,
} from '@udecode/plate/react';
import { basePlugins as editorPlugins } from '@/config/plate-plugins';
import { Editor } from '@/components/ui/editor';
import { PlateExporter } from '@/lib/converters';

interface PageRendererProps {
  content: Value;
  format?: 'plate' | 'html' | 'markdown';
}

export const PageRenderer: React.FC<PageRendererProps> = ({ 
  content,
  format = 'plate' // Por defecto usa el renderizado nativo de Plate
}) => {
  const [processedContent, setProcessedContent] = useState<string | Value>(content);
  
  // Crear el editor con plugins y valor fuera de cualquier condición
  const editor = usePlateEditor({
    plugins: editorPlugins,
    value: content,
  });
  
  useEffect(() => {
    // Convertir el contenido según el formato deseado
    if (format === 'plate') {
      setProcessedContent(content);
    } else if (format === 'html' || format === 'markdown') {
      try {
        // Si el contenido es una cadena JSON, intentar parsearlo
        const contentToProcess = typeof content === 'string' ? content : content;
        const converted = format === 'html' 
          ? PlateExporter.toHTML(contentToProcess) 
          : PlateExporter.toMarkdown(contentToProcess);
        
        setProcessedContent(converted);
      } catch (error) {
        console.error('Error al convertir el contenido:', error);
        setProcessedContent(content);
      }
    }
  }, [content, format]);

  // Si el formato no es 'plate', renderizamos el HTML o Markdown directamente
  if (format !== 'plate') {
    if (format === 'html') {
      return (
        <div 
          className="content-rendered prose max-w-none" 
          dangerouslySetInnerHTML={{ __html: processedContent as string }} 
        />
      );
    } else if (format === 'markdown') {
      // Para markdown, podríamos usar una librería como react-markdown
      // Por ahora, renderizamos el contenido en un pre para preservar el formato
      return (
        <pre className="markdown-content whitespace-pre-wrap break-words text-sm">
          {processedContent as string}
        </pre>
      );
    }
  }

  // Para el formato plate (por defecto)
  
  // Validar contenido vacío
  if (!Array.isArray(content) || content.length === 0) {
    return <p>El contenido de esta página no está disponible o está vacío.</p>;
  }

  // Renderizar en modo sólo lectura
  return (
    <Plate editor={editor} readOnly>
      <Editor className="prose max-w-none" disabled />
    </Plate>
  );
};
