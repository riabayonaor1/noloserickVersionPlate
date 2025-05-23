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
import AdBanner from '@/components/custom/AdBanner';
// Importamos el conversor de Plate a HTML desde el punto central
import { plateToHtml } from '@/lib/converters/plateToHtml';
// Importamos KaTeX para las ecuaciones matemáticas
import 'katex/dist/katex.min.css';

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
  const [parsedContent, setParsedContent] = useState<any>(null);
  const [displayHtml, setDisplayHtml] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [canShowAds, setCanShowAds] = useState<boolean>(false);

  // Función para verificar si un string es JSON válido
  const isValidJson = useCallback((str: string): boolean => {
    try {
      const parsed = JSON.parse(str);
      return typeof parsed === 'object' && parsed !== null;
    } catch (e) {
      return false;
    }
  }, []);
  
  // Función para parsear contenido JSON validando el formato
  const parseContentJSON = useCallback((content: string): any => {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      console.error('El contenido no es un array JSON válido');
      return [{ type: 'p', children: [{ text: content }] }];
    } catch (e) {
      console.error('Error al parsear JSON:', e);
      return [{ type: 'p', children: [{ text: content }] }];
    }
  }, []);

  // Marcar componente como montado
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Cargar la página por su slug si no se proporcionaron datos iniciales
  // o forzar una recarga desde Firestore incluso con datos iniciales
  useEffect(() => {
    // Siempre cargar datos frescos desde Firestore, incluso con datos iniciales
    // Esto asegura que tengamos la última versión después de editar
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
          
          // Parsear el contenido JSON para convertirlo a HTML
          if (pageData.content) {
            try {
              if (isValidJson(pageData.content)) {
                // Parsear el contenido JSON usando la función mejorada
                const contentJSON = typeof pageData.content === 'string' 
                  ? parseContentJSON(pageData.content) 
                  : pageData.content;
                setParsedContent(contentJSON);
                
                // Convertir el contenido JSON a HTML
                const htmlContent = plateToHtml(contentJSON);
                console.log("Contenido JSON convertido a HTML:", htmlContent.substring(0, 100));
                setDisplayHtml(htmlContent);

                // Logic to determine if ads can be shown
                if (htmlContent) {
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = htmlContent;
                  const textContent = tempDiv.textContent || tempDiv.innerText || "";
                  if (!loading && !error && textContent.trim().length > 200) {
                    setCanShowAds(true);
                  } else {
                    setCanShowAds(false);
                  }
                } else {
                  setCanShowAds(false);
                }
                
                // Inicializar MathJax después de renderizar
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
                setParsedContent(null);
                setDisplayHtml(null);
                setCanShowAds(false);
                console.warn("El contenido no es un JSON válido");
              }
            } catch (err) {
              console.error('Error al parsear contenido JSON:', err);
              setParsedContent(null);
              setDisplayHtml(null);
              setCanShowAds(false);
            }
          }
        }
      } catch (err) {
        console.error('Error al cargar la página:', err);
        setError('Error al cargar la página');
        setCanShowAds(false);
      } finally {
        setLoading(false);
      }
    };

    // Siempre cargar datos frescos desde Firestore
    fetchPage();
  }, [slug, isValidJson, parseContentJSON]);

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

  // Actualizar el contenido parseado para mostrar
  const updateParsedContent = useCallback((content: string) => {
    if (!content) return;

    try {
      if (isValidJson(content)) {
        // Parsear el contenido JSON para convertirlo a HTML
        const contentJSON = typeof content === 'string' 
          ? parseContentJSON(content) 
          : content;
        setParsedContent(contentJSON);
        
        // Convertir el contenido JSON a HTML
        const htmlContent = plateToHtml(contentJSON);
        console.log("Contenido JSON convertido a HTML:", htmlContent.substring(0, 100));
        setDisplayHtml(htmlContent);
        
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
        // Si no es JSON válido, establecemos contenido como nulo
        setParsedContent(null);
        setDisplayHtml(null);
      }
    } catch (err) {
      console.error('Error al actualizar contenido de visualización:', err);
    }
  }, [isValidJson, parseContentJSON]);

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
        updateParsedContent(newContent);
        
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
          {displayHtml ? (
            <div 
              id="plate-content-viewer"
              className="plate-content-full"
              dangerouslySetInnerHTML={{ __html: displayHtml }}
            />
          ) : (
            <div className="text-center py-8 italic text-gray-500">
              No hay contenido disponible para esta página.
            </div>
          )}
        </div>
        {canShowAds && (
           <div className="my-6 text-center"> {/* Added text-center for the ad container */}
            <AdBanner
              dataAdSlot="7857754771" // Changed to the new ID
              className="inline-block" // To allow text-center to work if needed
              shouldShowAd={true} 
            />
          </div>
        )}
      </div>

      {/* Los estilos se han movido a src/styles/plate-content.css */}
    </div>
  );
}
