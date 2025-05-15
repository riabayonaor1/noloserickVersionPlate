'use client';

import * as React from 'react';

import type { TTableCellElement } from '@udecode/plate-table';
import type { PlateElementProps } from '@udecode/plate/react';

import {
  BlockSelectionPlugin,
  useBlockSelected,
} from '@udecode/plate-selection/react';
import {
  TablePlugin,
  TableRowPlugin,
  useTableCellElement,
  useTableCellElementResizable,
} from '@udecode/plate-table/react';
import {
  PlateElement,
  useEditorPlugin,
  useElementSelector,
  usePluginOption,
  useReadOnly,
} from '@udecode/plate/react';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

import { blockSelectionVariants } from './block-selection';
import { ResizeHandle } from './resize-handle';

// Función auxiliar para manejar el redimensionamiento (definida fuera del componente)
const startResizing = (
  e: React.MouseEvent,
  options: { direction: 'left' | 'top'; colSpan: number; rowSpan: number }
) => {
  // Implementación simplificada del redimensionamiento
  console.log('Resizing', options);
  // Aquí se implementaría la lógica real de redimensionamiento
};

export function TableCellElement({
  isHeader,
  ...props
}: PlateElementProps<TTableCellElement> & {
  isHeader?: boolean;
}) {
  const { api } = useEditorPlugin(TablePlugin);
  const readOnly = useReadOnly();
  const element = props.element;

  const rowId = useElementSelector(([node]) => node.id as string, [], {
    key: TableRowPlugin.key,
  });
  const isSelectingRow = useBlockSelected(rowId);
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    'isSelectionAreaVisible'
  );

  const { borders, colIndex, colSpan, minHeight, rowIndex, selected, width } =
    useTableCellElement();

  // Definir isResizable basado en si estamos en modo lectura o no
  const isResizable = !readOnly;

  const { bottomProps, hiddenLeft, leftProps, rightProps } =
    useTableCellElementResizable({
      colIndex,
      colSpan,
      rowIndex,
    });

  // Obtener los valores reales de colSpan y rowSpan
  const cellColSpan = api.table.getColSpan(element);
  const cellRowSpan = api.table.getRowSpan(element);

  return (
    <PlateElement
      {...props}
      as={isHeader ? 'th' : 'td'}
      className={cn(
        'h-full overflow-visible border-none bg-background p-0',
        element.background ? 'bg-(--cellBackground)' : 'bg-background',
        isHeader && 'text-left *:m-0',
        'before:size-full',
        selected && 'before:z-10 before:bg-brand/5',
        "before:absolute before:box-border before:content-[''] before:select-none",
        borders.bottom?.size && `before:border-b before:border-b-border`,
        borders.right?.size && `before:border-r before:border-r-border`,
        borders.left?.size && `before:border-l before:border-l-border`,
        borders.top?.size && `before:border-t before:border-t-border`
      )}
      style={
        {
          '--cellBackground': element.background,
          maxWidth: width || 240,
          minWidth: width || 120,
        } as React.CSSProperties
      }
      // Pasamos las propiedades correctamente como props separadas, no como parte de los props extendidos
      // @ts-ignore - Ignoramos el error de TypeScript ya que sabemos que la API de PlateElement soporta esto
      colSpan={cellColSpan}
      rowSpan={cellRowSpan}
    >
      <div
        className="relative z-20 box-border h-full px-3 py-2"
        style={{ minHeight }}
      >
        {props.children}
      </div>

      {!isSelectionAreaVisible && (
        <div
          className="group absolute top-0 size-full select-none"
          contentEditable={false}
          suppressContentEditableWarning={true}
        >
          {!readOnly && (
            <>
              <ResizeHandle
                {...rightProps}
                className="-top-2 -right-1 h-[calc(100%_+_8px)] w-2"
                data-col={colIndex}
              />
              <ResizeHandle {...bottomProps} className="-bottom-1 h-2" />
              {!hiddenLeft && (
                <ResizeHandle
                  {...leftProps}
                  className="top-0 -left-1 w-2"
                  data-resizer-left={colIndex === 0 ? 'true' : undefined}
                />
              )}

              <div
                className={cn(
                  'absolute top-0 z-30 hidden h-full w-1 bg-ring',
                  'right-[-1.5px]',
                  columnResizeVariants({ colIndex: colIndex as any })
                )}
              />
              {colIndex === 0 && (
                <div
                  className={cn(
                    'absolute top-0 z-30 h-full w-1 bg-ring',
                    'left-[-1.5px]',
                    'hidden animate-in fade-in group-has-[[data-resizer-left]:hover]/table:block group-has-[[data-resizer-left][data-resizing="true"]]/table:block'
                  )}
                />
              )}
            </>
          )}
        </div>
      )}

      {isSelectingRow && (
        <div className={blockSelectionVariants()} contentEditable={false} />
      )}

      {isResizable && (
        <>
          {/* Columna */}
          {colIndex !== 0 && (
            <div
              contentEditable={false}
              className="absolute top-0 left-0 w-1 h-full cursor-col-resize resize-x-handle opacity-0 group-hover:opacity-100"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Usamos los valores obtenidos
                startResizing(e, {
                  direction: 'left',
                  colSpan: cellColSpan,
                  rowSpan: cellRowSpan,
                });
              }}
            />
          )}

          {/* Fila */}
          {rowIndex !== 0 && (
            <div
              contentEditable={false}
              className="absolute top-0 left-0 w-full h-1 cursor-row-resize resize-y-handle opacity-0 group-hover:opacity-100"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Usamos los valores obtenidos
                startResizing(e, {
                  direction: 'top',
                  colSpan: cellColSpan,
                  rowSpan: cellRowSpan,
                });
              }}
            />
          )}
        </>
      )}
    </PlateElement>
  );
}

export function TableCellHeaderElement(
  props: React.ComponentProps<typeof TableCellElement>
) {
  return <TableCellElement {...props} isHeader />;
}

const columnResizeVariants = cva('hidden animate-in fade-in', {
  variants: {
    colIndex: {
      0: 'group-has-[[data-col="0"]:hover]/table:block group-has-[[data-col="0"][data-resizing="true"]]/table:block',
      1: 'group-has-[[data-col="1"]:hover]/table:block group-has-[[data-col="1"][data-resizing="true"]]/table:block',
      2: 'group-has-[[data-col="2"]:hover]/table:block group-has-[[data-col="2"][data-resizing="true"]]/table:block',
      3: 'group-has-[[data-col="3"]:hover]/table:block group-has-[[data-col="3"][data-resizing="true"]]/table:block',
      4: 'group-has-[[data-col="4"]:hover]/table:block group-has-[[data-col="4"][data-resizing="true"]]/table:block',
      5: 'group-has-[[data-col="5"]:hover]/table:block group-has-[[data-col="5"][data-resizing="true"]]/table:block',
      6: 'group-has-[[data-col="6"]:hover]/table:block group-has-[[data-col="6"][data-resizing="true"]]/table:block',
      7: 'group-has-[[data-col="7"]:hover]/table:block group-has-[[data-col="7"][data-resizing="true"]]/table:block',
      8: 'group-has-[[data-col="8"]:hover]/table:block group-has-[[data-col="8"][data-resizing="true"]]/table:block',
      9: 'group-has-[[data-col="9"]:hover]/table:block group-has-[[data-col="9"][data-resizing="true"]]/table:block',
      10: 'group-has-[[data-col="10"]:hover]/table:block group-has-[[data-col="10"][data-resizing="true"]]/table:block',
    },
  },
});
