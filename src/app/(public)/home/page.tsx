'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPageBySlug, updatePage, createPage, getPageById } from '@/lib/firestoreService';
import { convertPlateJsonToHtml } from '@/lib/utils/plateUtils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Pencil, Settings, Home as HomeIcon } from 'lucide-react';
import { PlateEditor } from '@/components/editor/plate-editor';
import { SettingsProvider } from '@/components/editor/settings';
import { toast } from 'sonner';

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  color?: string;
  titleColor?: string;
}

// Contenido por defecto para el editor de Plate (en formato JSON)
const defaultPlateContent = JSON.stringify([
  {
    type: 'h1',
    textAlign: 'center',
    children: [{ text: '¡Bienvenido al Universo de Rick!', color: '#FFD700' }],
  },
  {
    type: 'p',
    textAlign: 'center',
    children: [
      { text: '¡Wubba Lubba Dub Dub! Estás a punto de embarcarte en una aventura interdimensional de ' },
      { text: 'conocimiento, juegos y pruebas', bold: true },
      { text: '. Prepárate para expandir tu mente, poner a prueba tus habilidades y, quizás, solo quizás, entender un poco mejor el multiverso.' }
    ],
  },
  {
    type: 'h2',
    children: [{ text: '¿Qué encontrarás aquí?' }],
  },
  {
    type: 'p',
    children: [{ text: 'Conocimiento Interdimensional:' }, { text: ' Aprende sobre matemáticas, geometría, estadística y cosas que probablemente no deberías saber .... mmmm o si ? 🤔' }],
  },
  {
    type: 'p',
    children: [{ text: 'Juegos Retorcidos:' }, { text: ' Pon a prueba tu ingenio en desafíos diseñados para volverte completamente loco (en el buen sentido, ¡supongo!). (Ya casi se lanzan)' }],
  },
  {
    type: 'p',
    children: [{ text: 'Pruebas de Realidad:' }, { text: ' Descubre si eres lo suficientemente inteligente como para sobrevivir en el multiverso de Rick. Spoiler alert: Probablemente no.' }],
  },
  {
    type: 'p',
    children: [{ text: 'Recuerda: ', italic: true }, { text: 'La ignorancia es una opción', italic: true }, { text: ', ¡pero aquí no la promovemos!', italic: true }],
  },
  {
    type: 'p',
    children: [{ text: 'Así que abróchate el cinturón, ajusta tu portal gun y prepárate para una experiencia... eh... "educativa".', italic: true }],
  },
  {
    type: 'p',
    children: [{ text: 'Este soy yo, en un viajecito hecho a NYC', italic: true }],
  },
  {
    type: 'p',
    children: [{ text: '¡Diviértete (o al menos inténtalo)! - Rick😵‍💫' }],
  }
]);

// Contenido HTML para mostrar cuando no se está editando
const defaultHtmlContent = `
<div class="w-full mx-auto p-6 space-y-8">
  <h1 class="text-4xl font-bold text-center" style="color: #FFD700;">¡Bienvenido al Universo de Rick!</h1>
  <p class="text-center text-xl">¡Wubba Lubba Dub Dub! Estás a punto de embarcarte en una aventura interdimensional de <strong>conocimiento, juegos y pruebas</strong>. Prepárate para expandir tu mente, poner a prueba tus habilidades y, quizás, solo quizás, entender un poco mejor el multiverso.</p>
  
  <h2 class="text-2xl font-bold mt-8">¿Qué encontrarás aquí?</h2>
  
  <div class="space-y-4 mt-6">
    <div class="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
      <h3 class="text-xl font-bold">Conocimiento Interdimensional:</h3>
      <p>Aprende sobre matemáticas, geometría, estadística y cosas que probablemente no deberías saber .... mmmm o si ? 🤔</p>
    </div>
    
    <div class="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
      <h3 class="text-xl font-bold">Juegos Retorcidos:</h3>
      <p>Pon a prueba tu ingenio en desafíos diseñados para volverte completamente loco (en el buen sentido, ¡supongo!). (Ya casi se lanzan)</p>
    </div>
    
    <div class="p-4 border rounded-lg bg-slate-50 dark:bg-slate-800">
      <h3 class="text-xl font-bold">Pruebas de Realidad:</h3>
      <p>Descubre si eres lo suficientemente inteligente como para sobrevivir en el multiverso de Rick. Spoiler alert: Probablemente no.</p>
    </div>
  </div>
  
  <div class="text-center italic mt-8">
    <p>Recuerda: <em>La ignorancia es una opción</em>, ¡pero aquí no la promovemos!</p>
    <p>Así que abróchate el cinturón, ajusta tu portal gun y prepárate para una experiencia... eh... "educativa".</p>
  </div>
  
  <div class="text-center mt-8">
    <p><em>Este soy yo, en un viajecito hecho a NYC</em></p>
  </div>
  
  <div class="text-center mt-6">
    <p>¡Diviértete (o al menos inténtalo)! - Rick😵‍💫</p>
  </div>
</div>
`;

export default function Home() {
  const { currentUser, isAdmin, loading } = useAuth();
  const [homePage, setHomePage] = useState<Page | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string>(defaultPlateContent);
  const [displayContent, setDisplayContent] = useState<string | null>(null);
  const [savingContent, setSavingContent] = useState(false);

  // Función para verificar si un objeto es JSON válido
  const isValidJson = useCallback((str) => {
    try {
      const parsed = JSON.parse(str);
      return typeof parsed === 'object' && parsed !== null;
    } catch (e) {
      return false;
    }
  }, []);

  // Función para manejar específicamente el contenido de la página de inicio
  const fixHomePageContent = useCallback((contentStr) => {
    // Si el contenido parece ser el JSON string crudo mostrado en lugar de renderizado
    if (typeof contentStr === 'string' && contentStr.startsWith('[{') && contentStr.includes('\"type\":\"') && contentStr.includes('\"children\":')) {
      try {
        // Este es el caso donde el contenido ya es un string que representa un JSON
        // pero quizás ha sido escapado más de una vez
        let parsedContent;
        try {
          // Intentar parsearlo como está
          parsedContent = JSON.parse(contentStr);
        } catch (e) {
          // Si falla, probablemente está doblemente escapado
          const unescapedStr = contentStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
          try {
            parsedContent = JSON.parse(unescapedStr);
          } catch (e2) {
            // Si aún falla, intentar quitando las comillas que lo envuelven y reemplazando escapes
            if (contentStr.startsWith('"[') && contentStr.endsWith(']"')) {
              const fixedStr = contentStr.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
              parsedContent = JSON.parse(fixedStr);
            } else {
              throw e2;
            }
          }
        }
        
        // Si logramos parsearlo correctamente, lo convertimos a HTML directamente
        const generatedHtml = convertPlateJsonToHtml(parsedContent);
        console.log("Contenido arreglado correctamente:", generatedHtml.substring(0, 100));
        return generatedHtml;
      } catch (error) {
        console.error("Error al arreglar el contenido:", error);
      }
    }
    return null;
  }, []);

  // Efecto para convertir el contenido a formato HTML para visualizacion
  useEffect(() => {
    if (content) {
      try {
        // Primero intentamos arreglar el contenido si está en el formato problemático
        const fixedContent = fixHomePageContent(content);
        if (fixedContent) {
          console.log("Usando contenido arreglado");
          setDisplayContent(fixedContent);
          
          // Programar la inicialización de MathJax después de renderizar el contenido
          setTimeout(() => {
            if (typeof window !== 'undefined' && window.MathJax) {
              try {
                // Configurar MathJax para ecuaciones con formato LaTeX
                window.MathJax.typesetConfig = {
                  elements: ['plate-content-viewer']
                };
                
                // Si hay una configuración global de MathJax, asegurarnos de que procese correctamente las ecuaciones
                if (!window.MathJax.config) {
                  window.MathJax.config = {
                    tex: {
                      inlineMath: [['\\(', '\\)']],
                      displayMath: [['\\[', '\\]'], ['$$', '$$']]
                    },
                    svg: {
                      fontCache: 'global'
                    }
                  };
                }
                
                // Ejecutar MathJax para renderizar las ecuaciones
                window.MathJax.typeset();
                console.log('MathJax inicializado correctamente');
              } catch (err) {
                console.error('Error al inicializar MathJax:', err);
              }
            } else {
              console.warn('MathJax no está disponible en la página');
              
              // Si MathJax no está cargado, intentamos cargarlo dinámicamente
              const script = document.createElement('script');
              script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
              script.async = true;
              script.onload = () => {
                console.log('MathJax cargado dinámicamente');
                if (window.MathJax) {
                  window.MathJax.typeset();
                }
              };
              document.head.appendChild(script);
            }
          }, 500);
          return;
        }
        
        // Si no se pudo arreglar, seguimos con la lógica normal
        if (isValidJson(content)) {
          // Es JSON, convertirlo a HTML
          const htmlContent = convertPlateJsonToHtml(content);
          console.log("Contenido JSON convertido a HTML:", htmlContent.substring(0, 100));
          setDisplayContent(htmlContent);
          
          // Programar la inicialización de MathJax después de renderizar el contenido
          setTimeout(() => {
            if (typeof window !== 'undefined' && window.MathJax) {
              try {
                // Configurar MathJax para ecuaciones con formato LaTeX
                window.MathJax.typesetConfig = {
                  elements: ['plate-content-viewer']
                };
                
                // Si hay una configuración global de MathJax, asegurarnos de que procese correctamente las ecuaciones
                if (!window.MathJax.config) {
                  window.MathJax.config = {
                    tex: {
                      inlineMath: [['\\(', '\\)']],
                      displayMath: [['\\[', '\\]'], ['$$', '$$']]
                    },
                    svg: {
                      fontCache: 'global'
                    }
                  };
                }
                
                // Ejecutar MathJax para renderizar las ecuaciones
                window.MathJax.typeset();
                console.log('MathJax inicializado correctamente');
              } catch (err) {
                console.error('Error al inicializar MathJax:', err);
              }
            } else {
              console.warn('MathJax no está disponible en la página');
              
              // Si MathJax no está cargado, intentamos cargarlo dinámicamente
              const script = document.createElement('script');
              script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
              script.async = true;
              script.onload = () => {
                console.log('MathJax cargado dinámicamente');
                if (window.MathJax) {
                  window.MathJax.typeset();
                }
              };
              document.head.appendChild(script);
            }
          }, 500);
        } else {
          // No es JSON, asumimos que ya es HTML
          console.log("Contenido no es JSON, usando como HTML:", content.substring(0, 100));
          setDisplayContent(content);
        }
      } catch (error) {
        console.error('Error al procesar el contenido para visualizacion:', error);
        setDisplayContent(content); // Fallback al contenido original
      }
    } else {
      setDisplayContent(null);
    }
  }, [content, isValidJson, fixHomePageContent]);

  // Cargar la página inicial
  useEffect(() => {
    const fetchHomePage = async () => {
      try {
        // Intentar cargar la página de inicio desde Firestore
        const page = await getPageBySlug('inicio');
        if (page) {
          console.log("Página cargada desde Firestore:", page);
          setHomePage(page);
          
          // Si hay contenido en la página, usarlo
          if (page.content) {
            try {
              // Intentar parsear el contenido como JSON para ver si es contenido de Plate
              if (isValidJson(page.content)) {
                console.log("Contenido JSON válido detectado:", JSON.parse(page.content).length, "nodos");
                setEditorContent(page.content);
                setContent(page.content);
              } else {
                console.log("Contenido no es JSON válido, asumiendo HTML:", page.content.substring(0, 100));
                // Si no es JSON válido, asumimos que es HTML
                setContent(page.content);
                setEditorContent(defaultPlateContent); // Usar contenido por defecto para el editor
              }
            } catch (error) {
              console.log("Error al procesar contenido, usando defaults:", error);
              setContent(defaultHtmlContent);
              setEditorContent(defaultPlateContent);
            }
          } else {
            // Si no hay contenido, usar el contenido por defecto
            setContent(defaultHtmlContent);
            setEditorContent(defaultPlateContent);
          }
        } else {
          console.log("No se encontró la página 'inicio' en Firestore");
          toast.error(
            'La página de inicio no existe', 
            { description: 'Vaya al panel de administración para restaurarla.' }
          );
          
          // Si no hay página, usar el contenido por defecto
          setContent(defaultHtmlContent);
          setEditorContent(defaultPlateContent);
          
          // Si es administrador, preguntar si desea crear la página de inicio
          if (isAdmin) {
            const wantsToCreate = window.confirm(
              'La página de inicio no existe. \n\n' + 
              '¿Desea crearla ahora con el contenido predeterminado?'
            );
            
            if (wantsToCreate) {
              try {
                // Crear la página de inicio con contenido por defecto
                const newPageId = await createPage({
                  title: 'Inicio',
                  slug: 'inicio',
                  content: defaultPlateContent,
                  isPublished: true,
                  color: '#ffffff',
                  titleColor: '#000000'
                });
                
                if (newPageId) {
                  toast.success('Página de inicio creada con éxito');
                  // Cargar la nueva página
                  const newPage = await getPageById(newPageId);
                  if (newPage) {
                    setHomePage(newPage);
                    setContent(newPage.content);
                    setEditorContent(newPage.content);
                  }
                } else {
                  toast.error('Error al crear la página de inicio');
                }
              } catch (error) {
                console.error('Error al crear la página de inicio:', error);
                toast.error('Error al crear la página de inicio');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar la página de inicio:', error);
        setContent(defaultHtmlContent); // Usar contenido por defecto en caso de error
        setEditorContent(defaultPlateContent);
      } finally {
        setPageLoading(false);
      }
    };

    fetchHomePage();
  }, [isValidJson, isAdmin]);

  // Función para manejar el guardado del contenido
  const handleSaveContent = async (updatedContent) => {
    console.log("Guardando contenido actualizado:", updatedContent.substring(0, 100));
    
    // Verificar que el contenido es JSON válido antes de guardar
    if (!isValidJson(updatedContent)) {
      console.error('El contenido a guardar no es JSON válido');
      console.log('Contenido recibido:', updatedContent);
      toast.error('Error: formato de contenido inválido');
      return;
    }
    
    // Prueba de convertir el JSON a HTML para verificar que funciona correctamente
    try {
      const htmlTest = convertPlateJsonToHtml(updatedContent);
      console.log("Vista previa de HTML generado:", htmlTest.substring(0, 200));
    } catch (error) {
      console.error("Error al convertir JSON a HTML:", error);
    }
    
    try {
      setSavingContent(true);
      
      if (homePage) {
        // Actualizar la página existente con el nuevo contenido
        const success = await updatePage(homePage.id, {
          ...homePage,
          content: updatedContent
        });
        
        if (success) {
          toast.success('Contenido actualizado con éxito');
          // Actualizar el estado local con el nuevo contenido
          setContent(updatedContent);
          setEditorContent(updatedContent);
          setIsEditing(false);
          
          // Recargar la página para asegurarse de que todo se actualice correctamente
          const updatedPage = await getPageById(homePage.id);
          if (updatedPage) {
            console.log("Página recargada después de guardar:", updatedPage);
            setHomePage(updatedPage);
            
            // Importante: volver a establecer el contenido para forzar un re-renderizado
            if (updatedPage.content) {
              setContent(updatedPage.content);
            }
          }
        } else {
          toast.error('Error al actualizar el contenido');
        }
      } else {
        // Crear una nueva página para el inicio si no existe
        const newPageId = await createPage({
          title: 'Inicio',
          slug: 'inicio',
          content: updatedContent,
          isPublished: true,
          color: '#ffffff',
          titleColor: '#000000'
        });
        
        if (newPageId) {
          toast.success('Página de inicio creada con éxito');
          try {
            // Obtener la página recién creada
            const newPage = await getPageById(newPageId);
            console.log("Nueva página creada:", newPage);
            setHomePage(newPage);
            setContent(updatedContent);
            setEditorContent(updatedContent);
          } catch (error) {
            console.error('Error al obtener la página creada:', error);
          }
          setIsEditing(false);
        } else {
          toast.error('Error al crear la página de inicio');
        }
      }
    } catch (error) {
      console.error('Error al guardar el contenido:', error);
      toast.error('Error al guardar los cambios');
    } finally {
      setSavingContent(false);
    }
  };

  // Función para activar edición
  const handleEnableEditing = () => {
    setIsEditing(true);
  };

  // Función para cancelar edición
  const handleCancelEditing = () => {
    setIsEditing(false);
    // Recargar la página para descartar cambios
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Edit Button - Adjusted positioning */}
      {!loading && isAdmin && (
        <div className="fixed top-20 right-4 z-40 flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleCancelEditing} variant="outline">
                Cancelar Edición
              </Button>
            </>
          ) : (
            <Button onClick={handleEnableEditing} className="flex items-center gap-2">
              <Pencil className="w-4 h-4" /> Activar Edición
            </Button>
          )}
          
          <Link href="/admin/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="w-4 h-4" /> Panel Admin
            </Button>
          </Link>
        </div>
      )}
      
      {/* Content Area */}
      <div className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-12">
        {pageLoading ? (
          // Estado de carga
          <div className="flex flex-col items-center justify-center w-full py-12">
            <div className="w-12 h-12 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-lg">Cargando página...</p>
          </div>
        ) : savingContent ? (
          // Estado de guardado
          <div className="flex flex-col items-center justify-center w-full py-12">
            <div className="w-12 h-12 border-t-2 border-b-2 border-green-500 rounded-full animate-spin"></div>
            <p className="mt-4 text-lg">Guardando cambios...</p>
          </div>
        ) : isEditing ? (
          <div className="h-[calc(100vh-200px)] w-full">
            <SettingsProvider>
              <PlateEditor 
                initialContent={editorContent} 
                onChange={handleSaveContent}
              />
            </SettingsProvider>
          </div>
        ) : (
          <div className="w-full mx-auto prose-lg dark:prose-invert max-w-none">
            {displayContent ? (
              <div 
                dangerouslySetInnerHTML={{ __html: displayContent }} 
                className="plate-content-view"
                id="plate-content-viewer"
              />
            ) : (
              // Fallback por si no hay contenido
              <div dangerouslySetInnerHTML={{ __html: defaultHtmlContent }} />
            )}
          </div>
        )}
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
