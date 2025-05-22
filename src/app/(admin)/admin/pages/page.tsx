'use client';

import React, { useState, useEffect } from 'react';
import { getAllPages, deletePage, getPageBySlug, createPage, Page } from '@/lib/firestoreService';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import Link from 'next/link';
import { Edit, Trash, Plus, Eye, AlertTriangle, RefreshCw } from 'lucide-react';

// Contenido por defecto para la página de inicio
const defaultHomeContent = JSON.stringify([
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

export default function AdminPages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  const [homepageExists, setHomepageExists] = useState(true);
  const [restoringHomepage, setRestoringHomepage] = useState(false);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        // Cargar todas las páginas
        const allPages = await getAllPages();
        setPages(allPages);
        
        // Verificar si existe la página de inicio
        const homePage = await getPageBySlug('inicio');
        setHomepageExists(!!homePage);
      } catch (error) {
        console.error('Error al cargar las páginas:', error);
        toast.error('Error al cargar las páginas');
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  const handleDeleteClick = (page: Page) => {
    // Impedir eliminar la página de inicio
    if (page.slug === 'inicio') {
      toast.error('La página de inicio no puede ser eliminada', {
        description: 'Esta página es esencial para el funcionamiento del sitio.'
      });
      return;
    }
    
    setPageToDelete(page);
    setOpenDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!pageToDelete) return;
    
    try {
      const success = await deletePage(pageToDelete.id);
      
      if (success) {
        setPages(prevPages => prevPages.filter(p => p.id !== pageToDelete.id));
        toast.success('Página eliminada correctamente');
      } else {
        toast.error('Error al eliminar la página');
      }
    } catch (error) {
      console.error('Error al eliminar la página:', error);
      toast.error('Error al eliminar la página');
    } finally {
      setPageToDelete(null);
      setOpenDeleteDialog(false);
    }
  };

  // Función para recrear la página de inicio si no existe
  const restoreHomepage = async () => {
    try {
      setRestoringHomepage(true);
      
      // Crear la página de inicio con contenido por defecto
      const newPageId = await createPage({
        title: 'Inicio',
        slug: 'inicio',
        content: defaultHomeContent,
        isPublished: true,
        color: '#ffffff',
        titleColor: '#000000'
      });
      
      if (newPageId) {
        toast.success('Página de inicio restaurada con éxito');
        // Recargar las páginas
        const allPages = await getAllPages();
        setPages(allPages);
        setHomepageExists(true);
      } else {
        toast.error('Error al restaurar la página de inicio');
      }
    } catch (error) {
      console.error('Error al restaurar la página de inicio:', error);
      toast.error('Error al restaurar la página de inicio');
    } finally {
      setRestoringHomepage(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando páginas...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Páginas</h1>
        <div className="flex gap-2">
          {!homepageExists && (
            <Button 
              variant="outline" 
              className="mr-2 gap-2"
              onClick={restoreHomepage}
              disabled={restoringHomepage}
            >
              {restoringHomepage ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              Restaurar Página Inicio
            </Button>
          )}
          <Link href="/admin/editor" passHref>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Nueva Página
            </Button>
          </Link>
        </div>
      </div>

      {!homepageExists && (
        <div className="mb-6 p-4 border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 mr-2" />
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-300">Atención: Página de inicio no encontrada</h3>
              <p className="text-yellow-700 dark:text-yellow-400 mt-1">
                La página de inicio es esencial para el funcionamiento del sitio. 
                Por favor, restaure la página usando el botón "Restaurar Página Inicio".
              </p>
            </div>
          </div>
        </div>
      )}

      {pages.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-lg">
          <p className="text-lg mb-4">No hay páginas creadas</p>
          <Link href="/admin/editor" passHref>
            <Button>Crear mi primera página</Button>
          </Link>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Última Actualización</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id} className={page.slug === 'inicio' ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                <TableCell className="font-medium">
                  {page.title} 
                  {page.slug === 'inicio' && (
                    <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Página Principal</Badge>
                  )}
                </TableCell>
                <TableCell>{page.slug}</TableCell>
                <TableCell>
                  {page.isPublished ? (
                    <Badge variant="success">Publicada</Badge>
                  ) : (
                    <Badge variant="secondary">Borrador</Badge>
                  )}
                </TableCell>
                <TableCell>{new Date(page.updatedAt).toLocaleString()}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Link href={`/${page.slug}`} passHref>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteClick(page)}
                    disabled={page.slug === 'inicio'} // Deshabilitar botón para página inicio
                    title={page.slug === 'inicio' ? 'La página de inicio no puede ser eliminada' : ''}
                  >
                    <Trash className="h-4 w-4 mr-1" /> Eliminar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar esta página?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente la página
              <strong> "{pageToDelete?.title}" </strong> y todos sus contenidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
