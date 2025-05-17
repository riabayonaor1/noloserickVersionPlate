'use client';

import React from 'react';
import { PlateContent } from '@udecode/plate/react';
import { cn } from '@/lib/utils';

// Un componente simplificado para visualizar contenido de Plate
// sin las propiedades que pueden causar problemas como onResizeEnd
export const PlateViewerContent: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <PlateContent
      className={cn('prose max-w-none plate-content-readonly', className)}
      readOnly={true}
      disableDefaultStyles={true}
    />
  );
};
