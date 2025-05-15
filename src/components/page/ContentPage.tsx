'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Pencil, Settings } from 'lucide-react';
import { PlateEditor } from '@/components/editor/plate-editor';
import { SettingsProvider } from '@/components/editor/settings';
import { useAuth } from '@/contexts/AuthContext';
import { updatePage, getPageById } from '@/lib/firestoreService';
import { toast } from 'sonner';
import { PageRenderer } from '@/components/custom/PageRenderer';
import { PlateExporter } from '@/lib/converters';

interface ContentPageProps {
  pageId?: string | null;
  pageSlug?: string;
  content: string;
  editorContent?: string;
  isPublished?: boolean;
  format?: 'plate' | 'html' | 'markdown'; // Nuevo prop para especificar el formato
}

export const ContentPage: React.FC<ContentPageProps> = ({
  pageId,
  pageSlug,
  content,
  editorContent,
  isPublished = true,
  format = 'html' // Por defecto usa HTML para la visualización
}) => {
  const { currentUser, isAdmin, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [pageContent, setPageContent] = useState(content);
  const [editorInitialContent, setEditorInitialContent] = useState(editorContent);
  const [contentFormat, setContentFormat] = useState<'plate' | 'html' | 'markdown'>(format);
  
  // Procesar el contenido cuando cambia
  useEffect(() => {
    if (pageContent) {
      try {
        // Intentar parsear como JSON para verificar formato
        JSON.parse(pageContent);
        // Es JSON válido, se puede usar con nuestros convertidores
      } catch (error) {
        // No es JSON, asumimos que ya está en formato HTML o Markdown
        // No necesitamos hacer nada, ya que PageRenderer manejará directamente el contenido
      }
    }
  }, [pageContent]);
  
  // Función para usar el editor content si está disponible, de lo contrario usar un placeholder
  const getEditorContent = () => {
    if (editorInitialContent) {
      return editorInitialContent;
    }
    
    // Placeholder JSON para el editor de Plate
    return JSON.stringify([
      {
        type: 'p',
        children: [{ text: 'Edita este contenido...' }],
      }
    ]);
  };

  // Preparar el contenido para el PageRenderer
  const getParsedContent = () => {
    if (!pageContent) return [];
    
    try {
      // Intentar parsear el contenido como JSON
      return JSON.parse(pageContent);
    } catch (error) {
      // Si no es JSON, devolver como está
      return pageContent;
    }
  };

  // Manejar guardado del contenido
  const handleSaveContent = async (updatedContent) => {
    console.log("Guardando contenido actualizado:", updatedContent.substring(0, 100));
    
    if (!pageId) {
      toast.error('No se puede guardar: falta el ID de la página');
      return;
    }

    try {
      const success = await updatePage(pageId, {
        content: updatedContent,
      });
      
      if (success) {
        toast.success('Contenido actualizado con éxito');
        // Actualizar el estado local
        setPageContent(updatedContent);
        setEditorInitialContent(updatedContent);
        setIsEditing(false);
        
        // Recargar la página para asegurarse de que todo se actualiza correctamente
        const updatedPage = await getPageById(pageId);
        if (updatedPage && updatedPage.content) {
          console.log("Página recargada después de guardar:", updatedPage.content.substring(0, 100));
          setPageContent(updatedPage.content);
        }
      } else {
        toast.error('Error al actualizar el contenido');
      }
    } catch (error) {
      console.error('Error al guardar el contenido:', error);
      toast.error('Error al guardar los cambios');
    }
  };

  // Cambiar entre formatos de visualización
  const toggleFormat = () => {
    const formats: ('html' | 'plate' | 'markdown')[] = ['html', 'markdown', 'plate'];
    const currentIndex = formats.indexOf(contentFormat);
    const nextIndex = (currentIndex + 1) % formats.length;
    setContentFormat(formats[nextIndex]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Controls */}
      {!loading && isAdmin && (
        <div className="fixed top-20 right-4 z-40 flex gap-2 flex-col sm:flex-row">
          {isEditing ? (
            <Button onClick={() => setIsEditing(false)} variant="outline">
              Cancelar Edición
            </Button>
          ) : (
            <>
              <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                <Pencil className="w-4 h-4" /> Activar Edición
              </Button>
              
              <Button onClick={toggleFormat} variant="outline">
                Formato: {contentFormat.toUpperCase()}
              </Button>
            </>
          )}
          
          <Link href="/admin/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="w-4 h-4" /> Panel Admin
            </Button>
          </Link>
        </div>
      )}
      
      {/* Content Area */}
      <div className="container mx-auto py-12 px-6">
        {isEditing && isAdmin ? (
          <div className="h-[calc(100vh-200px)]">
            <SettingsProvider>
              <PlateEditor 
                initialContent={getEditorContent()} 
                onChange={handleSaveContent}
              />
            </SettingsProvider>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <PageRenderer 
              content={getParsedContent()} 
              format={contentFormat}
            />
          </div>
        )}
      </div>
    </div>
  );
};
