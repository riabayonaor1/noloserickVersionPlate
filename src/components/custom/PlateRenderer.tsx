'use client';

import React, { useEffect } from 'react';
import { Value } from '@udecode/plate';
import {
  Plate,
  PlateContent,
  usePlateEditor
} from '@udecode/plate/react';

// Importamos los plugins desde la configuración existente
import { basePlugins } from '@/config/plate-plugins';

// Estilos para ecuaciones matemáticas
import 'katex/dist/katex.min.css';

interface PlateRendererProps {
  content: Value;
}

/**
 * Componente PlateRenderer que usa los componentes nativos de Plate
 * para mostrar el contenido en modo de solo lectura
 */
export const PlateRenderer: React.FC<PlateRendererProps> = ({ content }) => {
  // Verificamos que el contenido sea un array válido
  const validContent = Array.isArray(content) && content.length > 0 ? content : [];

  // Usamos usePlateEditor para crear un editor con plugins y valor inicial
  const editor = usePlateEditor({
    plugins: basePlugins,
    // Aseguramos que el contenido sea un array válido
    value: validContent,
  });
  
  // Esta función ayuda a inicializar MathJax para las ecuaciones matemáticas
  useEffect(() => {
    // Inicializar MathJax para renderizar ecuaciones si está disponible
    if (typeof window !== 'undefined' && window.MathJax) {
      try {
        setTimeout(() => {
          window.MathJax.typeset();
          console.log('MathJax inicializado correctamente en PlateRenderer');
        }, 100);
      } catch (mathError) {
        console.error('Error al inicializar MathJax en PlateRenderer:', mathError);
      }
    }
  }, [content]);

  // Renderizamos el contenido utilizando Plate en modo solo lectura
  return (
    <div className="plate-content-wrapper">
      <Plate editor={editor}>
        <PlateContent 
          className="prose max-w-none plate-content-readonly" 
          readOnly={true}
          disableDefaultStyles={true}
        />
      </Plate>
    </div>
  );
};
