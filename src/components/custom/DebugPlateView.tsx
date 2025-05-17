'use client';

import React from 'react';
import { PageRenderer } from './PageRenderer';
import { PlateRenderer } from './PlateRenderer';
import { PlateToHtml } from './PlateToHtml';
import { Button } from '@/components/ui/button';
import type { Value } from '@udecode/plate';

// Componente para depuración y comparación de las diferentes opciones de renderizado
interface DebugPlateViewProps {
  content: Value | string;
}

const DebugPlateView: React.FC<DebugPlateViewProps> = ({ content }) => {
  const [activeView, setActiveView] = React.useState<'plate' | 'html' | 'markdown' | 'raw'>('plate');
  const [parsedContent, setParsedContent] = React.useState<Value | null>(null);
  
  // Función para parsear contenido según sea necesario
  React.useEffect(() => {
    try {
      if (typeof content === 'string') {
        setParsedContent(JSON.parse(content));
      } else {
        setParsedContent(content);
      }
    } catch (e) {
      console.error('Error al parsear contenido:', e);
      setParsedContent(null);
    }
  }, [content]);
  
  if (!parsedContent) {
    return <div className="p-4 bg-red-50 text-red-500">Error al parsear el contenido</div>;
  }
  
  return (
    <div className="border rounded-md p-4 space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        <Button 
          variant={activeView === 'plate' ? 'default' : 'outline'} 
          onClick={() => setActiveView('plate')}
          size="sm"
        >
          PlateRenderer
        </Button>
        <Button 
          variant={activeView === 'html' ? 'default' : 'outline'} 
          onClick={() => setActiveView('html')}
          size="sm"
        >
          HTML
        </Button>
        <Button 
          variant={activeView === 'markdown' ? 'default' : 'outline'} 
          onClick={() => setActiveView('markdown')}
          size="sm"
        >
          Markdown
        </Button>
        <Button 
          variant={activeView === 'raw' ? 'default' : 'outline'} 
          onClick={() => setActiveView('raw')}
          size="sm"
        >
          JSON
        </Button>
      </div>
      
      <div className="border p-4 rounded-md bg-white dark:bg-slate-900">
        {activeView === 'plate' && (
          <div className="plate-content-view">
            <PageRenderer content={parsedContent} format="plate" />
          </div>
        )}
        
        {activeView === 'html' && (
          <div className="plate-content-view">
            <PageRenderer content={parsedContent} format="html" />
          </div>
        )}
        
        {activeView === 'markdown' && (
          <div className="plate-content-view">
            <PageRenderer content={parsedContent} format="markdown" />
          </div>
        )}
        
        {activeView === 'raw' && (
          <pre className="text-xs overflow-auto p-2 bg-gray-50 dark:bg-slate-800 rounded">
            {JSON.stringify(parsedContent, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default DebugPlateView;
