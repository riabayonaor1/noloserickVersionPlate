'use client';

// Script para crear/asegurar que la página de inicio existe
// Este script se debe ejecutar desde el panel de administración

import { createPage, getPageBySlug, updatePage } from '@/lib/firestoreService';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Contenido formateado para Plate JSON
const homePageContent = JSON.stringify([
  {
    "type": "h1",
    "textAlign": "center",
    "children": [
      { "text": "¡Bienvenido al Universo de Rick!", "bold": true, "color": "#FFD700" }
    ]
  },
  {
    "type": "p",
    "textAlign": "center",
    "children": [
      { "text": "¡Wubba Lubba Dub Dub! Estás a punto de embarcarte en una aventura interdimensional de " },
      { "text": "conocimiento, juegos y pruebas", "bold": true },
      { "text": ". Prepárate para expandir tu mente, poner a prueba tus habilidades y, quizás, solo quizás, entender un poco mejor el multiverso." }
    ]
  },
  {
    "type": "h2",
    "children": [
      { "text": "¿Qué encontrarás aquí?", "bold": true }
    ]
  },
  {
    "type": "p",
    "children": [
      { "text": "Conocimiento Interdimensional: ", "bold": true },
      { "text": "Aprende sobre matemáticas, geometría, estadística y cosas que probablemente no deberías saber .... mmmm o si ? 🤔" }
    ]
  },
  {
    "type": "p",
    "children": [
      { "text": "Juegos Retorcidos: ", "bold": true },
      { "text": "Pon a prueba tu ingenio en desafíos diseñados para volverte completamente loco (en el buen sentido, ¡supongo!). (Ya casi se lanzan)" }
    ]
  },
  {
    "type": "p",
    "children": [
      { "text": "Pruebas de Realidad: ", "bold": true },
      { "text": "Descubre si eres lo suficientemente inteligente como para sobrevivir en el multiverso de Rick. Spoiler alert: Probablemente no." }
    ]
  },
  {
    "type": "p",
    "children": [
      { "text": "Recuerda: La ignorancia es una opción, ¡pero aquí no la promovemos!", "italic": true }
    ]
  },
  {
    "type": "p",
    "children": [
      { "text": "Así que abróchate el cinturón, ajusta tu portal gun y prepárate para una experiencia... eh... \"educativa\".", "italic": true }
    ]
  },
  {
    "type": "p",
    "children": [
      { "text": "Este soy yo, en un viajecito hecho a NYC", "italic": true }
    ]
  },
  {
    "type": "p",
    "children": [
      { "text": "¡Diviértete (o al menos inténtalo)! - Rick😵‍💫" }
    ]
  }
]);

export default function SetupHomePage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [existingPage, setExistingPage] = useState(null);

  useEffect(() => {
    // Verificar si la página de inicio ya existe
    const checkHomePage = async () => {
      const page = await getPageBySlug('inicio');
      setExistingPage(page);
      
      if (page) {
        setStatus('exists');
      } else {
        setStatus('missing');
      }
    };

    checkHomePage();
  }, []);

  const createHomePage = async () => {
    setLoading(true);
    setStatus('creating');

    try {
      const newPageId = await createPage({
        title: 'Inicio',
        slug: 'inicio',
        content: homePageContent,
        isPublished: true,
        color: '#ffffff',
        titleColor: '#000000'
      });

      if (newPageId) {
        toast.success('Página de inicio creada con éxito');
        setStatus('created');
        const page = await getPageBySlug('inicio');
        setExistingPage(page);
      } else {
        toast.error('Error al crear la página de inicio');
        setStatus('error');
      }
    } catch (error) {
      console.error('Error al crear la página de inicio:', error);
      toast.error('Error al crear la página de inicio');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const updateHomePage = async () => {
    if (!existingPage) return;
    
    setLoading(true);
    setStatus('updating');

    try {
      const success = await updatePage(existingPage.id, {
        ...existingPage,
        content: homePageContent
      });

      if (success) {
        toast.success('Página de inicio actualizada con éxito');
        setStatus('updated');
      } else {
        toast.error('Error al actualizar la página de inicio');
        setStatus('error');
      }
    } catch (error) {
      console.error('Error al actualizar la página de inicio:', error);
      toast.error('Error al actualizar la página de inicio');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <h1 className="text-3xl font-bold">Configuración de Página de Inicio</h1>
      
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Estado de la Página de Inicio</h2>
        
        {status === 'idle' && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Verificando estado de la página...</span>
          </div>
        )}
        
        {status === 'exists' && (
          <div className="space-y-4">
            <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900 rounded-md">
              <p className="text-green-800 dark:text-green-300">
                ✅ La página de inicio existe con el ID: <code>{existingPage?.id}</code>
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={updateHomePage} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  'Actualizar Contenido'
                )}
              </Button>
            </div>
          </div>
        )}
        
        {status === 'missing' && (
          <div className="space-y-4">
            <div className="p-4 border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900 rounded-md">
              <p className="text-yellow-800 dark:text-yellow-300">
                ⚠️ La página de inicio no existe. Es necesario crearla para el funcionamiento correcto del sitio.
              </p>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={createHomePage} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Página de Inicio'
                )}
              </Button>
            </div>
          </div>
        )}
        
        {(status === 'created' || status === 'updated') && (
          <div className="p-4 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900 rounded-md">
            <p className="text-green-800 dark:text-green-300">
              ✅ Operación completada con éxito. Ahora puedes ver la página de inicio <a href="/home" className="underline">aquí</a>.
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900 rounded-md">
            <p className="text-red-800 dark:text-red-300">
              ❌ Ocurrió un error durante la operación. Por favor, inténtalo de nuevo o contacta a soporte técnico.
            </p>
          </div>
        )}
      </div>
      
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Vista Previa del Contenido</h2>
        
        <div className="prose dark:prose-invert max-w-none p-4 border rounded-md">
          <h1 style={{ textAlign: 'center', color: '#FFD700' }}>¡Bienvenido al Universo de Rick!</h1>
          <p style={{ textAlign: 'center' }}>¡Wubba Lubba Dub Dub! Estás a punto de embarcarte en una aventura interdimensional de <strong>conocimiento, juegos y pruebas</strong>. Prepárate para expandir tu mente, poner a prueba tus habilidades y, quizás, solo quizás, entender un poco mejor el multiverso.</p>
          
          <h2>¿Qué encontrarás aquí?</h2>
          
          <p><strong>Conocimiento Interdimensional:</strong> Aprende sobre matemáticas, geometría, estadística y cosas que probablemente no deberías saber .... mmmm o si ? 🤔</p>
          
          <p><strong>Juegos Retorcidos:</strong> Pon a prueba tu ingenio en desafíos diseñados para volverte completamente loco (en el buen sentido, ¡supongo!). (Ya casi se lanzan)</p>
          
          <p><strong>Pruebas de Realidad:</strong> Descubre si eres lo suficientemente inteligente como para sobrevivir en el multiverso de Rick. Spoiler alert: Probablemente no.</p>
          
          <p><em>Recuerda: La ignorancia es una opción, ¡pero aquí no la promovemos!</em></p>
          
          <p><em>Así que abróchate el cinturón, ajusta tu portal gun y prepárate para una experiencia... eh... "educativa".</em></p>
          
          <p><em>Este soy yo, en un viajecito hecho a NYC</em></p>
          
          <p>¡Diviértete (o al menos inténtalo)! - Rick😵‍💫</p>
        </div>
      </div>
    </div>
  );
}
