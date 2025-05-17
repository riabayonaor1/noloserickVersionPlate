'use client';

import * as React from 'react';
import { useCallback } from 'react';

import type { TImageElement } from '@udecode/plate-media';
import type { PlateElementProps } from '@udecode/plate/react';

import { useDraggable } from '@udecode/plate-dnd';
import { Image, ImagePlugin, useMediaState } from '@udecode/plate-media/react';
import { ResizableProvider, useResizableValue } from '@udecode/plate-resizable';
import { PlateElement, useEditorRef, withHOC } from '@udecode/plate/react';

import { cn } from '@/lib/utils';

import { Caption, CaptionTextarea } from './caption';
import { MediaPopover } from './media-popover';
import {
  mediaResizeHandleVariants,
  Resizable,
  ResizeHandle,
} from './resize-handle';

export const ImageElement = withHOC(
  ResizableProvider,
  function ImageElement(props: PlateElementProps<TImageElement>) {
    const { align = 'center', focused, readOnly, selected } = useMediaState();
    const width = useResizableValue('width');
    const editor = useEditorRef();

    // Función para actualizar las propiedades de tamaño en el nodo de la imagen
    const updateImageSize = useCallback(() => {
      if (!editor || !props.element.id) return;
      
      const imgElement = document.querySelector(`[data-slate-node="element"][id="${props.element.id}"] img`);
      
      if (imgElement) {
        // Obtener el ancho actual de la imagen
        const currentWidth = imgElement.getBoundingClientRect().width;
        
        // Actualizar las propiedades del nodo
        // Usamos casting para evitar error de tipo
        (editor as any).setNodes(
          { 
            width: `${currentWidth}px`, 
            align,
          },
          { at: (editor as any).findPath(props.element) }
        );
      }
    }, [editor, props.element, align]);

    // Manejar el evento de finalización de redimensionado
    const handleResizeEnd = () => {
      if (!readOnly) {
        updateImageSize();
      }
    };

    const { isDragging, handleRef } = useDraggable({
      element: props.element,
    });

    return (
      <MediaPopover plugin={ImagePlugin}>
        <PlateElement {...props} className="py-2.5">
          <figure className="group relative m-0" contentEditable={false}>
            <Resizable
              align={align}
              options={{
                align,
                readOnly,
              }}
              // @ts-ignore - La propiedad onResizeEnd existe en la implementación real pero falta en las definiciones de tipo
              onResizeEnd={handleResizeEnd}
            >
              <ResizeHandle
                className={mediaResizeHandleVariants({ direction: 'left' })}
                options={{ direction: 'left' }}
              />
              <Image
                ref={handleRef}
                className={cn(
                  'block w-full max-w-full cursor-pointer object-cover px-0',
                  'rounded-sm',
                  focused && selected && 'ring-2 ring-ring ring-offset-2',
                  isDragging && 'opacity-50'
                )}
                alt={(props.attributes as any).alt}
              />
              <ResizeHandle
                className={mediaResizeHandleVariants({
                  direction: 'right',
                })}
                options={{ direction: 'right' }}
              />
            </Resizable>

            <Caption style={{ width }} align={align}>
              <CaptionTextarea
                readOnly={readOnly}
                onFocus={(e) => {
                  e.preventDefault();
                }}
                placeholder="Write a caption..."
                onBlur={(e) => {
                  if (!readOnly && e.target.textContent) {
                    // Usamos casting para evitar error de tipo
                    (editor as any).setNodes(
                      { caption: e.target.textContent },
                      { at: (editor as any).findPath(props.element) }
                    );
                  }
                }}
              />
            </Caption>
          </figure>

          {props.children}
        </PlateElement>
      </MediaPopover>
    );
  }
);
