'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plate } from '@udecode/plate/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { createPage } from '@/lib/firestoreService';
import { useCreateEditor } from '@/components/editor/use-create-editor';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { HexColorPicker } from '@/components/custom/SimpleColorPicker';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EditorPage() {
  const editor = useCreateEditor();
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [titleColor, setTitleColor] = useState('#000000');
  const [layout, setLayout] = useState('default');
  const [animation, setAnimation] = useState('none');
  const [isSaving, setIsSaving] = useState(false);
  
  // Generar slug a partir del título
  const generateSlug = () => {
    const generatedSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setSlug(generatedSlug);
  };
  
  // Guardar la página
  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('El título no puede estar vacío');
      return;
    }
    
    if (!slug.trim()) {
      toast.error('La URL no puede estar vacía');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const editorValue = editor.children;
      const contentJSON = JSON.stringify(editorValue);
      
      const newPageData = {
        title,
        slug,
        content: contentJSON,
        isPublished,
        color: bgColor,
        titleColor,
        layout,
        animation
      };
      
      const newPageId = await createPage(newPageData);
      
      if (newPageId) {
        toast.success('Página creada correctamente');
        router.push('/admin/pages');
      } else {
        toast.error('Error al crear la página');
      }
    } catch (error) {
      console.error('Error al guardar la página:', error);
      toast.error('Error al guardar la página');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Crear Nueva Página</h1>
      
      <Tabs defaultValue="editor">
        <TabsList className="mb-4">
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>
        
        <TabsContent value="editor">
          <div className="grid grid-cols-1 gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Título de la Página</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={generateSlug}
                  placeholder="Título de la página"
                  className="mb-4"
                />
              </div>
              <div>
                <Label htmlFor="slug">URL de la Página</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="url-de-la-pagina"
                  className="mb-4"
                />
              </div>
            </div>
            
            <DndProvider backend={HTML5Backend}>
              <Plate editor={editor}>
                <EditorContainer>
                  <Editor variant="demo" />
                </EditorContainer>
              </Plate>
            </DndProvider>
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="publish">
                  <AccordionTrigger>Publicación</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox 
                        id="published" 
                        checked={isPublished} 
                        onCheckedChange={setIsPublished} 
                      />
                      <Label htmlFor="published">Publicar página</Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="colors">
                  <AccordionTrigger>Colores</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label className="mb-2 block">Color de Fondo</Label>
                        <HexColorPicker color={bgColor} onChange={setBgColor} />
                        <Input 
                          value={bgColor} 
                          onChange={(e) => setBgColor(e.target.value)} 
                          className="mt-2" 
                        />
                      </div>
                      <div>
                        <Label className="mb-2 block">Color del Título</Label>
                        <HexColorPicker color={titleColor} onChange={setTitleColor} />
                        <Input 
                          value={titleColor} 
                          onChange={(e) => setTitleColor(e.target.value)} 
                          className="mt-2" 
                        />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="layout">
                  <AccordionTrigger>Diseño</AccordionTrigger>
                  <AccordionContent>
                    <div className="mb-4">
                      <Label htmlFor="layout" className="mb-2 block">Diseño de Página</Label>
                      <Select value={layout} onValueChange={setLayout}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar diseño" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Predeterminado</SelectItem>
                          <SelectItem value="full-width">Ancho Completo</SelectItem>
                          <SelectItem value="two-columns">Dos Columnas</SelectItem>
                          <SelectItem value="three-columns">Tres Columnas</SelectItem>
                          <SelectItem value="sidebar-left">Barra Lateral Izquierda</SelectItem>
                          <SelectItem value="sidebar-right">Barra Lateral Derecha</SelectItem>
                          <SelectItem value="text-image-right">Texto e Imagen Derecha</SelectItem>
                          <SelectItem value="text-image-left">Texto e Imagen Izquierda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="animation" className="mb-2 block">Animación</Label>
                      <Select value={animation} onValueChange={setAnimation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar animación" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ninguna</SelectItem>
                          <SelectItem value="fade-in">Desvanecer</SelectItem>
                          <SelectItem value="slide-in-up">Deslizar hacia Arriba</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end mt-6 gap-2">
        <Button variant="outline" onClick={() => router.push('/admin/pages')}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar Página'}
        </Button>
      </div>
    </div>
  );
}
