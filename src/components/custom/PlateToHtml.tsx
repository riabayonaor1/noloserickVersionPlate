'use client';

import React from 'react';
import { Value } from '@udecode/plate';
import { createPlateEditor } from '@udecode/plate/react';
import { serializeHtml } from '@udecode/plate';
import { 
  type TVideoElement, 
  type TAudioElement, 
  type TFileElement 
} from '@udecode/plate-media';
import { 
  AudioPlugin, 
  VideoPlugin, 
  FilePlugin 
} from '@udecode/plate-media/react';

// Importamos los plugins desde la configuración existente
import { basePlugins } from '@/config/plate-plugins';

interface PlateToHtmlProps {
  content: Value;
  className?: string;
}

/**
 * Componente que convierte contenido JSON de Plate a HTML estático
 * Soporta la renderización de videos, audios y archivos
 */
export const PlateToHtml: React.FC<PlateToHtmlProps> = ({ content, className }) => {
  // Verificar que el contenido sea válido
  const validContent = Array.isArray(content) && content.length > 0 ? content : [];
  
  // Crear un editor temporal con los plugins necesarios
  const editor = createPlateEditor({
    plugins: basePlugins,
    value: validContent,
  });

  // Convertir el contenido a HTML con componentes personalizados para medios
  const htmlContent = serializeHtml(editor, {
    components: {
      // Componente personalizado para videos
      [VideoPlugin.key]: ({ element, children }) => {
        const videoElement = element as TVideoElement;
        return `
          <figure class="group relative m-0 cursor-default">
            <video 
              preload="auto" 
              controls 
              src="${videoElement.url}" 
              style="width: ${videoElement.width || '100%'}; height: 100%;"
              class="w-full max-w-full rounded-sm object-cover px-0"
            ></video>
            ${videoElement.caption ? `<figcaption>${videoElement.caption}</figcaption>` : ''}
            ${children}
          </figure>
        `;
      },
      // Componente personalizado para audios
      [AudioPlugin.key]: ({ element, children }) => {
        const audioElement = element as TAudioElement;
        return `
          <figure class="group relative cursor-default">
            <div class="h-16">
              <audio 
                class="size-full" 
                src="${audioElement.url}" 
                controls
              ></audio>
            </div>
            ${audioElement.caption ? `<figcaption>${audioElement.caption}</figcaption>` : ''}
            ${children}
          </figure>
        `;
      },
      // Componente personalizado para archivos
      [FilePlugin.key]: ({ element, children }) => {
        const fileElement = element as TFileElement;
        return `
          <a 
            class="group relative m-0 flex cursor-pointer items-center rounded px-0.5 py-[3px] hover:bg-muted" 
            contenteditable="false" 
            download="${fileElement.name || ''}" 
            href="${fileElement.url}" 
            rel="noopener noreferrer" 
            role="button" 
            target="_blank"
          >
            <div class="flex items-center gap-1 p-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-up size-5" aria-hidden="true">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                <path d="M12 12v6"></path>
                <path d="m15 15-3-3-3 3"></path>
              </svg>
              <div>${fileElement.name || 'Archivo'}</div>
            </div>
            ${fileElement.caption ? `<figcaption>${fileElement.caption}</figcaption>` : ''}
            ${children}
          </a>
        `;
      },
    },
  });

  return (
    <div 
      className={`plate-html-content prose max-w-none ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
