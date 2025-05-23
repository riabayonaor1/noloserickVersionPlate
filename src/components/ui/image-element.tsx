'use client';

import * as React from 'react';
import { useCallback } from 'react';

import type { TImageElement } from '@udecode/plate-media';
import type { PlateElementProps } from '@udecode/plate/react';

import { useDraggable } from '@udecode/plate-dnd';
import { Image, ImagePlugin, useMediaState } from '@udecode/plate-media/react';
import { ResizableProvider, ResizeHandleProvider, useResizableValue, type ResizeEvent } from '@udecode/plate-resizable';
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

    const { isDragging, handleRef } = useDraggable({
      element: props.element,
    });

    // Configuramos un manejador de evento usando ResizeHandleProvider
    const handleResizeContextProvider = (
      <ResizeHandleProvider
        onResize={(event) => {
          if (!readOnly && event.finished) {
            updateImageSize();
          }
        }}
      >
        {null}
      </ResizeHandleProvider>
    );

    return (
      <MediaPopover plugin={ImagePlugin}>
        <PlateElement {...props} className="py-2.5">
          <figure className="group relative m-0" contentEditable={false}>
            {handleResizeContextProvider}
            <Resizable
              align={align}
              options={{
                align,
                readOnly,
              }}
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
                placeholder="Write a caption..."
              />
            </Caption>
          </figure>

          {props.children}
        </PlateElement>
      </MediaPopover>
    );
  }
);
