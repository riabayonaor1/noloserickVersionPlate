'use client';

import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plate } from '@udecode/plate/react';
import { getPageById, updatePage, createPage } from '@/lib/firestoreService';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import { Save, X, Eye, Settings } from 'lucide-react';

import { useCreateEditor } from '@/components/editor/use-create-editor';
import { SettingsDialog, SettingsProvider } from '@/components/editor/settings';
import { Editor, EditorContainer } from '@/components/ui/editor';

// Extender la interfaz Window para incluir MathJax
declare global {
  interface Window {
    MathJax?: any;
  }
}

interface PlateEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
}

// Ajustar los tipos de estado y validaciones
export function PlateEditor({ initialContent, onChange }: PlateEditorProps) {
  const [editorInitialContent, setEditorInitialContent] = useState<string>(initialContent || '');
  const [currentContent, setCurrentContent] = useState<string>(initialContent || '');
  const contentHasChanged = useRef<boolean>(false);
  
  // Asegurarse de que initialContent sea JSON válido
  useEffect(() => {
    if (initialContent) {
      try {
        // Intentar parsear para verificar que es JSON válido
        JSON.parse(initialContent);
        setEditorInitialContent(initialContent);
        setCurrentContent(initialContent);
      } catch (error) {
        console.error('El contenido inicial no es JSON válido:', error);
        // Usar un JSON por defecto si el contenido inicial no es válido
        const defaultContent = JSON.stringify([
          {
            type: 'p',
            children: [{ text: 'Edita este contenido...' }],
          }
        ]);
        setEditorInitialContent(defaultContent);
        setCurrentContent(defaultContent);
      }
    }
  }, [initialContent]);
  
  const editor = useCreateEditor({ 
    onChange: (value) => {
      try {
        // Convertir el valor actual del editor a JSON string
        const contentJson = JSON.stringify(value);
        setCurrentContent(contentJson);
        contentHasChanged.current = true;
      } catch (error) {
        console.error('Error al convertir contenido del editor a JSON:', error);
      }
    }
  });
  
  // Inicializar el contenido del editor cuando cambie editorInitialContent
  useEffect(() => {
    if (editor && editorInitialContent) {
      try {
        const content = JSON.parse(editorInitialContent);
        // Establecer el contenido inicial en el editor
        editor.children = content;
      } catch (error) {
        console.error('Error al inicializar el contenido del editor:', error);
      }
    }
  }, [editor, editorInitialContent]);
  
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState<boolean>(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState<boolean>(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState<boolean>(false);
  
  // Estados para formulario de guardado
  const [pageTitle, setPageTitle] = useState<string>('');
  const [pageSlug, setPageSlug] = useState<string>('');
  const [pageIsPublished, setPageIsPublished] = useState<boolean>(true);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [pageColor, setPageColor] = useState<string>('#ffffff');
  const [pageTitleColor, setPageTitleColor] = useState<string>('#000000');
  
  // Al cargar, verificar si hay un ID de página para editar
  useEffect(() => {
    const fetchExistingPage = async () => {
      // Verificar si existe un ID de página en localStorage (establecido al hacer clic en Editar)
      const editingPageId = localStorage.getItem('editingPageId');
      
      if (editingPageId) {
        try {
          const page = await getPageById(editingPageId);
          
          if (page) {
            setCurrentPageId(page.id);
            setPageTitle(page.title);
            setPageSlug(page.slug);
            setPageIsPublished(page.isPublished);
            setPageColor(page.color || '#ffffff');
            setPageTitleColor(page.titleColor || '#000000');
            
            // Si no se proporcionó initialContent, usar el contenido de la página
            if (!initialContent && page.content) {
              try {
                // Intentar parsear el contenido para asegurarse que es JSON válido
                JSON.parse(page.content);
                setEditorInitialContent(page.content);
                setCurrentContent(page.content);
              } catch (error) {
                console.error('El contenido de la página no es JSON válido:', error);
              }
            }
            
            toast.success(`Editando: ${page.title}`);
          }
          
          // Limpiar el ID después de cargarlo
          localStorage.removeItem('editingPageId');
        } catch (error) {
          console.error('Error al cargar la página para editar:', error);
          toast.error('Error al cargar la página para editar');
        }
      }
    };
    
    fetchExistingPage();
  }, [editor, initialContent]);

  // Manejar el guardado de los cambios
  const handleSave = () => {
    if (onChange) {
      // Si se proporcionó una función onChange, usar esa
      try {
        // Validar que hay contenido para guardar
        if (!editor || !editor.children || editor.children.length === 0) {
          console.error('No hay contenido válido para guardar');
          toast.error('Error: No hay contenido válido para guardar');
          return;
        }
        
        // Asegurarse de capturar el contenido más reciente del editor
        console.log('Editor children:', editor.children);
        const content = JSON.stringify(editor.children || []);
        console.log('Contenido JSON a guardar:', content.substring(0, 200));
        
        // Verificar que es JSON válido
        try {
          JSON.parse(content);
        } catch (jsonError) {
          console.error('El contenido no es JSON válido:', jsonError);
          toast.error('Error: El contenido no es JSON válido');
          return;
        }
        
        // Llamar a la función onChange con el contenido
        onChange(content);
        
        // Mostrar mensaje de éxito al guardar
        toast.success('Contenido guardado con éxito');
        
        // Restablecer la bandera de cambios
        contentHasChanged.current = false;
        
        // Actualizar también el estado local para mantener la consistencia
        setCurrentContent(content);
      } catch (error) {
        console.error('Error al guardar el contenido:', error);
        toast.error('Error al guardar los cambios');
      }
    } else {
      // De lo contrario, abrir el diálogo de guardado
      try {
        // Asegurarse de tener el contenido más reciente antes de abrir el diálogo
        const content = JSON.stringify(editor.children || []);
        setCurrentContent(content);
      } catch (error) {
        console.error('Error al preparar el contenido para guardar:', error);
      }
      setIsSaveDialogOpen(true);
    }
  };
  
  // Obtener el contenido HTML del editor para la vista previa
  const getEditorHtml = () => {
    // Aquí obtenemos el HTML del editor de Plate
    const contentElement = document.querySelector('[data-slate-editor="true"]');
    
    if (contentElement) {
      return contentElement.innerHTML;
    }
    
    return '';
  };
  
  // Generar slug automáticamente basado en el título
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[áäàâ]/g, 'a')
      .replace(/[éëèê]/g, 'e')
      .replace(/[íïìî]/g, 'i')
      .replace(/[óöòô]/g, 'o')
      .replace(/[úüùû]/g, 'u')
      .replace(/ñ/g, 'n')
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
  };
  
  // Manejar cambio de título y generar slug automáticamente
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setPageTitle(newTitle);
    
    // Solo generar slug automáticamente si es una página nueva o si el usuario no ha editado manualmente el slug
    if (!currentPageId || pageSlug === generateSlug(pageTitle)) {
      setPageSlug(generateSlug(newTitle));
    }
  };
  
  // Guardar la página
  const handleSavePage = async () => {
    if (!pageTitle.trim() || !pageSlug.trim()) {
      toast.error('El título y el slug son obligatorios');
      return;
    }
    
    try {
      if (currentPageId) {
        // Actualizar página existente
        const success = await updatePage(currentPageId, {
          title: pageTitle.trim(),
          slug: pageSlug.trim(),
          content: currentContent,
          isPublished: pageIsPublished,
          color: pageColor,
          titleColor: pageTitleColor,
        });
        
        if (success) {
          toast.success('Página actualizada con éxito');
          setIsSaveDialogOpen(false);
          contentHasChanged.current = false;
        } else {
          toast.error('Error al actualizar la página');
        }
      } else {
        // Crear página nueva
        const newPageId = await createPage({
          title: pageTitle.trim(),
          slug: pageSlug.trim(),
          content: currentContent,
          isPublished: pageIsPublished,
          color: pageColor,
          titleColor: pageTitleColor,
        });
        
        if (newPageId) {
          toast.success('Página creada con éxito');
          setCurrentPageId(newPageId);
          setIsSaveDialogOpen(false);
          contentHasChanged.current = false;
        } else {
          toast.error('Error al crear la página');
        }
      }
    } catch (error) {
      console.error('Error al guardar la página:', error);
      toast.error('Error al guardar la página');
    }
  };
  
  return (
    <DndProvider backend={HTML5Backend}>
      <Plate editor={editor}>
        <div className="flex flex-col h-screen w-full overflow-hidden">
          {/* Barra de herramientas superior - Botones espaciados */}
          <div className="flex justify-end gap-4 p-3 bg-muted/20 border-b">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsPreviewDialogOpen(true)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" /> Vista previa
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsSettingsDialogOpen(true)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" /> Configuración
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              className="gap-2"
            >
              <Save className="w-4 h-4" /> Guardar
            </Button>
          </div>
          
          {/* Editor - Ancho y alto completo */}
          <div className="flex-1 w-full overflow-auto">
            <EditorContainer className="w-full h-full min-h-[calc(100vh-6rem)]">
              <Editor variant="demo" />
            </EditorContainer>
          </div>
        </div>
        
        {/* Necesitamos envolver SettingsDialog con SettingsProvider para que tenga acceso al contexto */}
        <SettingsProvider>
          <SettingsDialog />
        </SettingsProvider>
        
        {/* Diálogo de guardado */}
        <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentPageId ? 'Actualizar Página' : 'Guardar Nueva Página'}</DialogTitle>
              <DialogDescription>
                {currentPageId ? 'Actualiza los detalles de la página existente' : 'Ingresa los detalles para la nueva página'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={pageTitle}
                  onChange={handleTitleChange}
                  placeholder="Título de la página"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={pageSlug}
                  onChange={(e) => setPageSlug(e.target.value)}
                  placeholder="url-de-la-pagina"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Color de Fondo</Label>
                  <div className="space-y-2">
                    <HexColorPicker 
                      color={pageColor} 
                      onChange={setPageColor} 
                      style={{ width: '100%' }} 
                    />
                    <HexColorInput 
                      color={pageColor} 
                      onChange={setPageColor}
                      prefixed 
                      className="w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background rounded-md"
                    />
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label>Color del Título</Label>
                  <div className="space-y-2">
                    <HexColorPicker 
                      color={pageTitleColor} 
                      onChange={setPageTitleColor} 
                      style={{ width: '100%' }} 
                    />
                    <HexColorInput 
                      color={pageTitleColor} 
                      onChange={setPageTitleColor}
                      prefixed 
                      className="w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background rounded-md"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={pageIsPublished}
                  onChange={(e) => setPageIsPublished(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isPublished">Publicar página</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSavePage}>
                {currentPageId ? 'Actualizar' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Diálogo de vista previa */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vista Previa</DialogTitle>
            </DialogHeader>
            
            <div
              className="p-4 rounded-md border"
              style={{
                backgroundColor: pageColor || '#ffffff',
                color: pageTitleColor || '#000000'
              }}
            >
              <h1 className="text-2xl font-bold mb-4">{pageTitle || 'Título de la Página'}</h1>
              <div 
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: getEditorHtml() }} 
              />
            </div>
            
            <DialogFooter>
              <Button onClick={() => setIsPreviewDialogOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Plate>
    </DndProvider>
  );
}
