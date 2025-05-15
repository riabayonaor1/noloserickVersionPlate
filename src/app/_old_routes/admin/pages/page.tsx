'use client';

import React, { useState, useEffect } from 'react';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { getAllPages, deletePage, Page } from '@/lib/firestoreService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, Eye, Search, FileEdit } from 'lucide-react';

export default function AdminPages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
  
  const router = useRouter();

  // Cargar todas las páginas
  useEffect(() => {
    const fetchPages = async () => {
      try {
        setLoading(true);
        const allPages = await getAllPages();
        setPages(allPages);
        setError(null);
      } catch (error) {
        console.error('Error al cargar páginas:', error);
        setError('Error al cargar las páginas. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  // Filtrar páginas según el término de búsqueda
  const filteredPages = pages.filter(page => 
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    page.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manejar la eliminación de una página
  const handleDeletePage = async () => {
    if (!pageToDelete) return;
    
    try {
      const success = await deletePage(pageToDelete.id);
      if (success) {
        setPages(pages.filter(p => p.id !== pageToDelete.id));
        toast.success(`Página "${pageToDelete.title}" eliminada con éxito`);
      } else {
        toast.error('Error al eliminar la página');
      }
    } catch (error) {
      console.error('Error al eliminar página:', error);
      toast.error('Error al eliminar la página');
    } finally {
      setDeleteDialogOpen(false);
      setPageToDelete(null);
    }
  };

  // Manejar la edición de una página
  const handleEditPage = (page: Page) => {
    // Guardar el ID de la página en localStorage para que el editor lo use
    localStorage.setItem('editingPageId', page.id);
    router.push('/plate-editor');
  };

  // Fecha formateada para mostrar
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <AdminRoute>
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gestión de Páginas</h1>
          <Button asChild className="gap-2">
            <Link href="/plate-editor">
              <Plus className="w-4 h-4" /> Nueva Página
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Páginas</CardTitle>
            <CardDescription>
              Administra todas las páginas de tu sitio web
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar páginas..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Cargando páginas...</div>
            ) : error ? (
              <div className="text-center py-4 text-red-500">{error}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Actualizado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No se encontraron páginas
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPages.map((page) => (
                      <TableRow key={page.id}>
                        <TableCell className="font-medium">{page.title}</TableCell>
                        <TableCell>{page.slug}</TableCell>
                        <TableCell>
                          <Badge variant={page.isPublished ? "default" : "outline"}>
                            {page.isPublished ? "Publicada" : "Borrador"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(page.updatedAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="h-8 w-8 p-0"
                              title="Ver página"
                            >
                              <Link href={`/${page.slug}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Editar página"
                              onClick={() => handleEditPage(page)}
                            >
                              <FileEdit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              title="Eliminar página"
                              onClick={() => {
                                setPageToDelete(page);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Diálogo de confirmación para eliminar */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás seguro?</DialogTitle>
              <DialogDescription>
                Esta acción eliminará permanentemente la página &quot;
                {pageToDelete?.title}&quot; y no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePage}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminRoute>
  );
}
