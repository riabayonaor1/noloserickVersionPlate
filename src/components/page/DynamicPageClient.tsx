'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getPageBySlug, updatePage, Page } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';
import { PlateEditor } from '@/components/editor/plate-editor';
import { SettingsProvider } from '@/components/editor/settings';
import { Button } from '@/components/ui/button';
import { Pencil, X, Home, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { convertPlateJsonToHtml } from '@/lib/utils/plateUtils';

interface DynamicPageClientProps {
  slug: string;
  initialPageData: Page | null;
  initialError: string | null;
}

export default function DynamicPageClient({ 
  slug, 
  initialPageData, 
  initialError 
}: DynamicPageClientProps) {
  const { currentUser, isAdmin } = useAuth();
  const [page, setPage] = useState<Page | null>(initialPageData);
  const [loading, setLoading] = useState<boolean>(!initialPageData && !initialError);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(initialError);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [savedContent, setSavedContent] = useState<string>(initialPageData?.content || '');
  const [displayContent, setDisplayContent] = useState<string>('');

  // Función para verificar si un string es JSON válido
  const isValidJson = useCallback((str: string) => {
    try {
      const parsed = JSON.parse(str);
      return typeof parsed === 'object' && parsed !== null;
    } catch (e) {
      return false;
    }
  }, []);

  // Cargar la página por su slug si no se proporcionaron datos iniciales
  useEffect(() => {
    // Si ya tenemos datos o un error inicial, no necesitamos cargar nada
    if (initialPageData || initialError) {
      if (initialPageData?.content) {
        try {
          if (isValidJson(initialPageData.content)) {
            const htmlContent = convertPlateJsonToHtml(initialPageData.content);
            setDisplayContent(htmlContent);
          } else {
            setDisplayContent(initialPageData.content);
          }
        } catch (err) {
          console.error('Error al convertir contenido a HTML:', err);
          setDisplayContent(initialPageData.content);
        }
      }
      return;
    }

    const fetchPage = async () => {
      if (!slug || typeof slug !== 'string') {
        setError('Slug no válido');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const pageData = await getPageBySlug(slug);
        
        if (!pageData) {
          setError('Página no encontrada');
        } else {
          setPage(pageData);
          setSavedContent(pageData.content);
          
          // Convertir el contenido JSON a HTML para la visualización
          if (pageData.content) {
            try {
              if (isValidJson(pageData.content)) {
                const htmlContent = convertPlateJsonToHtml(pageData.content);
                setDisplayContent(htmlContent);
              } else {
                setDisplayContent(pageData.content);
              }
            } catch (err) {
              console.error('Error al convertir contenido a HTML:', err);
              setDisplayContent(pageData.content);
            }
          }
        }
      } catch (err) {
        console.error('Error al cargar la página:', err);
        setError('Error al cargar la página');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug, initialPageData, initialError, isValidJson]);

  // Manejar activación del modo de edición
  const handleEnableEditing = () => {
    // Guardar el contenido actual antes de activar la edición
    if (page) {
      setSavedContent(page.content);
    }
    setIsEditing(true);
  };

  // Manejar cancelación de la edición
  const handleCancelEditing = () => {
    setIsEditing(false);
    
    // Restaurar el contenido guardado
    if (page) {
      const updatedPage = { ...page, content: savedContent };
      setPage(updatedPage);
    }
  };

  // Actualizar el contenido de la página para mostrar
  const updateDisplayContent = useCallback((content: string) => {
    if (!content) return;

    try {
      if (isValidJson(content)) {
        const htmlContent = convertPlateJsonToHtml(content);
        setDisplayContent(htmlContent);
        
        // Inicializar MathJax para renderizar ecuaciones después de actualizar el contenido
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.MathJax) {
            try {
              window.MathJax.typeset();
              console.log('MathJax inicializado correctamente');
            } catch (mathError) {
              console.error('Error al inicializar MathJax:', mathError);
            }
          }
        }, 500);
      } else {
        setDisplayContent(content);
      }
    } catch (err) {
      console.error('Error al actualizar contenido de visualización:', err);
    }
  }, [isValidJson]);

  // Manejar guardado de la edición
  const handleSaveEditing = async (newContent: string) => {
    if (!page) return;
    
    // Si no hay cambios, no hacer nada
    if (newContent === savedContent) {
      setIsEditing(false);
      return;
    }

    try {
      setSaving(true);

      // Verificar que el contenido es JSON válido
      if (!isValidJson(newContent)) {
        toast.error('El formato del contenido no es válido');
        setSaving(false);
        return;
      }

      // Actualizar la página en Firestore
      const success = await updatePage(page.id, {
        ...page,
        content: newContent
      });
      
      if (success) {
        // Actualizar el contenido guardado
        setSavedContent(newContent);
        
        // Actualizar el objeto de página
        const updatedPage = { ...page, content: newContent };
        setPage(updatedPage);
        
        // Actualizar el contenido de visualización
        updateDisplayContent(newContent);
        
        toast.success('Cambios guardados con éxito');
        setIsEditing(false);
      } else {
        toast.error('Error al guardar los cambios');
      }
    } catch (err) {
      console.error('Error al guardar los cambios:', err);
      toast.error('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  // Estados de carga y error
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Cargando página...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
          <p className="mb-6">{error}</p>
          <Button asChild>
            <Link href="/home" className="flex items-center gap-2">
              <Home className="w-4 h-4" /> Volver al Inicio
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Página no encontrada</h1>
          <p className="mb-6">La página que estás buscando no existe o ha sido eliminada.</p>
          <Button asChild>
            <Link href="/home" className="flex items-center gap-2">
              <Home className="w-4 h-4" /> Volver al Inicio
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isEditing && isAdmin) {
    return (
      <div className="h-screen flex flex-col">
        {/* Barra de herramientas de edición */}
        <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link href="/home">
              <Button variant="secondary" size="sm" className="gap-1">
                <Home size={16} /> Inicio
              </Button>
            </Link>
            <span className="font-bold ml-2">Editando:</span> {page.title}
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={handleCancelEditing} 
              disabled={saving}
              className="gap-1"
            >
              <X size={16} /> Cancelar
            </Button>
          </div>
        </div>
        
        {/* Editor Plate */}
        <div className="flex-grow">
          <SettingsProvider>
            <PlateEditor initialContent={page.content} onChange={handleSaveEditing} />
          </SettingsProvider>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="container mx-auto py-8 px-4"
      style={{
        backgroundColor: page.color || 'transparent',
        color: page.titleColor || 'inherit'
      }}
    >
      <div className="relative">
        {isAdmin && (
          <div className="absolute top-0 right-0 flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleEnableEditing}
              className="gap-1"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Pencil size={16} /> Editar
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-1"
            >
              <Link href="/home">
                <Home size={16} /> Inicio
              </Link>
            </Button>
          </div>
        )}
        
        <h1 className="text-3xl font-bold mb-6 text-center">{page.title}</h1>
        
        <div className="prose dark:prose-invert mx-auto plate-content-view">
          {displayContent ? (
            <div 
              dangerouslySetInnerHTML={{ __html: displayContent }} 
              id="plate-content-viewer"
              className="plate-content-full"
            />
          ) : (
            <div className="text-center py-8 italic text-gray-500">
              No hay contenido disponible para esta página.
            </div>
          )}
        </div>
      </div>

      {/* Estilo adicional para asegurar que todos los elementos se rendericen correctamente */}
      <style jsx global>{`
        /* Estilos para tablas */
        .plate-content-view table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .plate-content-view table th,
        .plate-content-view table td {
          border: 1px solid #ccc;
          padding: 0.5rem;
          text-align: left;
        }
        .plate-content-view table th {
          background-color: #f1f1f1;
          font-weight: bold;
        }
        
        /* Estilos para ecuaciones */
        .equation-container {
          overflow-x: auto;
          padding: 1rem 0;
        }
        .tex-math {
          font-size: 1.2em;
        }
        
        /* Estilos para callouts */
        .callout {
          display: flex;
          border-radius: 0.375rem;
          padding: 1rem;
          margin: 1rem 0;
        }
        .callout-icon {
          margin-right: 0.75rem;
          font-size: 1.25rem;
        }
        
        /* Estilos para toggles */
        details.toggle {
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          margin: 1rem 0;
        }
        details.toggle summary {
          padding: 0.75rem;
          cursor: pointer;
          background-color: #f8fafc;
          border-bottom: 1px solid transparent;
        }
        details.toggle[open] summary {
          border-bottom: 1px solid #e2e8f0;
        }
        details.toggle > div {
          padding: 0.75rem;
        }
        
        /* Estilos para listas de verificación */
        .checklist {
          list-style-type: none;
          padding-left: 0;
        }
        .checklist li {
          display: flex;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }
        .checklist li input[type="checkbox"] {
          margin-right: 0.5rem;
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
}