'use client';

import React, { useState, useEffect } from 'react';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { getMenuItems, buildMenuTree, MenuItem, createMenuItem, updateMenuItem, deleteMenuItem, getAllPages, Page } from '@/lib/firestoreService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronRight, Folder, FileText, Plus, Pencil, Trash2, MoveUp, MoveDown, FolderTree, File } from 'lucide-react';

export default function AdminMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuTree, setMenuTree] = useState<MenuItem[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el formulario de nuevo ítem
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [itemToEdit, setItemToEdit] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemType, setNewItemType] = useState<'folder' | 'page'>('folder');
  const [newItemParentId, setNewItemParentId] = useState<string | null>(null);
  const [newItemPageId, setNewItemPageId] = useState<string | null>(null);

  // Cargar menú y páginas
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar elementos del menú
        const items = await getMenuItems();
        setMenuItems(items);
        setMenuTree(buildMenuTree(items));
        
        // Cargar páginas para seleccionar
        const allPages = await getAllPages();
        setPages(allPages);
        
        setError(null);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar el menú. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Resetear el formulario de nuevo ítem
  const resetNewItemForm = () => {
    setNewItemName('');
    setNewItemType('folder');
    setNewItemParentId(null);
    setNewItemPageId(null);
  };

  // Preparar edición de ítem
  const prepareEditItem = (item: MenuItem) => {
    setItemToEdit(item);
    setNewItemName(item.name);
    setNewItemType(item.type);
    setNewItemParentId(item.parentId);
    setNewItemPageId(item.pageId || null);
    setIsEditDialogOpen(true);
  };

  // Preparar eliminación de ítem
  const prepareDeleteItem = (item: MenuItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  // Crear nuevo ítem de menú
  const handleCreateItem = async () => {
    if (!newItemName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    
    try {
      const newItem: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'> = {
        name: newItemName.trim(),
        type: newItemType,
        parentId: newItemParentId,
        order: menuItems.filter(item => item.parentId === newItemParentId).length, // Nueva posición al final de su nivel
        pageId: newItemType === 'page' ? newItemPageId : null,
        slug: newItemType === 'page' ? pages.find(p => p.id === newItemPageId)?.slug || null : null,
      };
      
      const newItemId = await createMenuItem(newItem);
      
      if (newItemId) {
        toast.success('Elemento de menú creado con éxito');
        
        // Actualizar estado local
        const updatedItem: MenuItem = {
          ...newItem,
          id: newItemId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const updatedItems = [...menuItems, updatedItem];
        setMenuItems(updatedItems);
        setMenuTree(buildMenuTree(updatedItems));
        
        // Cerrar el diálogo y resetear formulario
        setIsAddDialogOpen(false);
        resetNewItemForm();
      } else {
        toast.error('Error al crear el elemento de menú');
      }
    } catch (error) {
      console.error('Error al crear elemento de menú:', error);
      toast.error('Error al crear el elemento de menú');
    }
  };

  // Actualizar ítem de menú existente
  const handleUpdateItem = async () => {
    if (!itemToEdit || !newItemName.trim()) {
      toast.error('Datos incompletos');
      return;
    }
    
    try {
      const updatedItem: Partial<Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>> = {
        name: newItemName.trim(),
        type: newItemType,
        parentId: newItemParentId,
        pageId: newItemType === 'page' ? newItemPageId : null,
        slug: newItemType === 'page' ? pages.find(p => p.id === newItemPageId)?.slug || null : null,
      };
      
      const success = await updateMenuItem(itemToEdit.id, updatedItem);
      
      if (success) {
        toast.success('Elemento de menú actualizado con éxito');
        
        // Actualizar estado local
        const updatedItems = menuItems.map(item => 
          item.id === itemToEdit.id ? {...item, ...updatedItem, updatedAt: new Date()} : item
        );
        setMenuItems(updatedItems);
        setMenuTree(buildMenuTree(updatedItems));
        
        // Cerrar el diálogo y resetear formulario
        setIsEditDialogOpen(false);
        setItemToEdit(null);
        resetNewItemForm();
      } else {
        toast.error('Error al actualizar el elemento de menú');
      }
    } catch (error) {
      console.error('Error al actualizar elemento de menú:', error);
      toast.error('Error al actualizar el elemento de menú');
    }
  };

  // Eliminar ítem de menú
  const handleDeleteItem = async () => {
    if (!itemToDelete) {
      return;
    }
    
    try {
      const success = await deleteMenuItem(itemToDelete.id);
      
      if (success) {
        toast.success(`Elemento "${itemToDelete.name}" eliminado con éxito`);
        
        // Actualizar estado local - eliminar el elemento y sus hijos
        const getChildrenIds = (parentId: string): string[] => {
          const childrenIds = menuItems
            .filter(item => item.parentId === parentId)
            .map(item => item.id);
          
          return [
            ...childrenIds,
            ...childrenIds.flatMap(childId => getChildrenIds(childId))
          ];
        };
        
        const idsToRemove = [itemToDelete.id, ...getChildrenIds(itemToDelete.id)];
        const updatedItems = menuItems.filter(item => !idsToRemove.includes(item.id));
        
        setMenuItems(updatedItems);
        setMenuTree(buildMenuTree(updatedItems));
        
        // Cerrar el diálogo
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
      } else {
        toast.error('Error al eliminar el elemento de menú');
      }
    } catch (error) {
      console.error('Error al eliminar elemento de menú:', error);
      toast.error('Error al eliminar el elemento de menú');
    }
  };

  // Mover ítem hacia arriba en el orden
  const handleMoveUp = async (item: MenuItem) => {
    // Encontrar elementos en el mismo nivel
    const siblingItems = menuItems.filter(i => i.parentId === item.parentId)
      .sort((a, b) => a.order - b.order);
    
    const currentIndex = siblingItems.findIndex(i => i.id === item.id);
    if (currentIndex <= 0) return; // Ya está en la parte superior
    
    const prevItem = siblingItems[currentIndex - 1];
    
    try {
      // Intercambiar el orden con el elemento anterior
      await updateMenuItem(item.id, { order: prevItem.order });
      await updateMenuItem(prevItem.id, { order: item.order });
      
      // Actualizar estado local
      const updatedItems = menuItems.map(i => {
        if (i.id === item.id) return { ...i, order: prevItem.order, updatedAt: new Date() };
        if (i.id === prevItem.id) return { ...i, order: item.order, updatedAt: new Date() };
        return i;
      });
      
      setMenuItems(updatedItems);
      setMenuTree(buildMenuTree(updatedItems));
      
      toast.success('Elemento movido hacia arriba');
    } catch (error) {
      console.error('Error al mover elemento:', error);
      toast.error('Error al mover el elemento');
    }
  };

  // Mover ítem hacia abajo en el orden
  const handleMoveDown = async (item: MenuItem) => {
    // Encontrar elementos en el mismo nivel
    const siblingItems = menuItems.filter(i => i.parentId === item.parentId)
      .sort((a, b) => a.order - b.order);
    
    const currentIndex = siblingItems.findIndex(i => i.id === item.id);
    if (currentIndex >= siblingItems.length - 1) return; // Ya está en la parte inferior
    
    const nextItem = siblingItems[currentIndex + 1];
    
    try {
      // Intercambiar el orden con el elemento siguiente
      await updateMenuItem(item.id, { order: nextItem.order });
      await updateMenuItem(nextItem.id, { order: item.order });
      
      // Actualizar estado local
      const updatedItems = menuItems.map(i => {
        if (i.id === item.id) return { ...i, order: nextItem.order, updatedAt: new Date() };
        if (i.id === nextItem.id) return { ...i, order: item.order, updatedAt: new Date() };
        return i;
      });
      
      setMenuItems(updatedItems);
      setMenuTree(buildMenuTree(updatedItems));
      
      toast.success('Elemento movido hacia abajo');
    } catch (error) {
      console.error('Error al mover elemento:', error);
      toast.error('Error al mover el elemento');
    }
  };

  // Renderizar árbol de menú recursivamente
  const renderMenuItems = (items: MenuItem[] = [], level = 0) => {
    return (
      <ul className={`pl-${level > 0 ? '4' : '0'} space-y-1`}>
        {items.map((item) => (
          <li key={item.id} className="py-1">
            <div className="flex items-center gap-2 hover:bg-muted rounded-md p-2">
              <div className="flex-1 flex items-center gap-2">
                {item.type === 'folder' ? (
                  <Folder className="w-4 h-4 text-primary" />
                ) : (
                  <FileText className="w-4 h-4 text-primary" />
                )}
                <span className="font-medium">{item.name}</span>
                {item.type === 'page' && item.slug && (
                  <span className="text-xs text-muted-foreground">/{item.slug}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleMoveUp(item)}
                  title="Mover arriba"
                >
                  <MoveUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleMoveDown(item)}
                  title="Mover abajo"
                >
                  <MoveDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => prepareEditItem(item)}
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  onClick={() => prepareDeleteItem(item)}
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {item.children && item.children.length > 0 && renderMenuItems(item.children, level + 1)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <AdminRoute>
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gestión del Menú</h1>
          <Button 
            className="gap-2" 
            onClick={() => {
              resetNewItemForm();
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="w-4 h-4" /> Nuevo Elemento
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-primary" /> 
              <span>Estructura del Menú</span>
            </CardTitle>
            <CardDescription>
              Organiza la estructura de navegación de tu sitio web
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Cargando estructura del menú...</div>
            ) : error ? (
              <div className="text-center py-4 text-red-500">{error}</div>
            ) : menuTree.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hay elementos en el menú</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    resetNewItemForm();
                    setIsAddDialogOpen(true);
                  }}
                >
                  Crear el primer elemento
                </Button>
              </div>
            ) : (
              <div className="border rounded-md p-4">
                {renderMenuItems(menuTree)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diálogo para crear nuevo elemento */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Elemento de Menú</DialogTitle>
              <DialogDescription>
                Crea un nuevo elemento para la estructura de navegación
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">Nombre</label>
                <Input
                  id="name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Nombre del elemento"
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="type" className="text-sm font-medium">Tipo</label>
                <Select
                  value={newItemType}
                  onValueChange={(value) => setNewItemType(value as 'folder' | 'page')}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="folder">Carpeta</SelectItem>
                    <SelectItem value="page">Página</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="parent" className="text-sm font-medium">Padre</label>
                <Select
                  value={newItemParentId || ''}
                  onValueChange={(value) => setNewItemParentId(value || null)}
                >
                  <SelectTrigger id="parent">
                    <SelectValue placeholder="Selecciona una carpeta padre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Raíz (Nivel Superior)</SelectItem>
                    {menuItems
                      .filter(item => item.type === 'folder')
                      .map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              {newItemType === 'page' && (
                <div className="grid gap-2">
                  <label htmlFor="page" className="text-sm font-medium">Página</label>
                  <Select
                    value={newItemPageId || ''}
                    onValueChange={(value) => setNewItemPageId(value || null)}
                  >
                    <SelectTrigger id="page">
                      <SelectValue placeholder="Selecciona una página" />
                    </SelectTrigger>
                    <SelectContent>
                      {pages.map(page => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateItem}>
                Crear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo para editar elemento */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Elemento de Menú</DialogTitle>
              <DialogDescription>
                Modifica las propiedades del elemento seleccionado
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="edit-name" className="text-sm font-medium">Nombre</label>
                <Input
                  id="edit-name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Nombre del elemento"
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="edit-type" className="text-sm font-medium">Tipo</label>
                <Select
                  value={newItemType}
                  onValueChange={(value) => setNewItemType(value as 'folder' | 'page')}
                >
                  <SelectTrigger id="edit-type">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="folder">Carpeta</SelectItem>
                    <SelectItem value="page">Página</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="edit-parent" className="text-sm font-medium">Padre</label>
                <Select
                  value={newItemParentId || ''}
                  onValueChange={(value) => setNewItemParentId(value || null)}
                >
                  <SelectTrigger id="edit-parent">
                    <SelectValue placeholder="Selecciona una carpeta padre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Raíz (Nivel Superior)</SelectItem>
                    {menuItems
                      .filter(item => item.type === 'folder' && item.id !== itemToEdit?.id)
                      .map(item => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              {newItemType === 'page' && (
                <div className="grid gap-2">
                  <label htmlFor="edit-page" className="text-sm font-medium">Página</label>
                  <Select
                    value={newItemPageId || ''}
                    onValueChange={(value) => setNewItemPageId(value || null)}
                  >
                    <SelectTrigger id="edit-page">
                      <SelectValue placeholder="Selecciona una página" />
                    </SelectTrigger>
                    <SelectContent>
                      {pages.map(page => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateItem}>
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo de confirmación para eliminar */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás seguro?</DialogTitle>
              <DialogDescription>
                Esta acción eliminará permanentemente el elemento &quot;{itemToDelete?.name}&quot; 
                {itemToDelete?.type === 'folder' && ' y todos sus elementos hijos'}.
                Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteItem}
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
