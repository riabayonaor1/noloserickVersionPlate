'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  getMenuItems, 
  buildMenuTree, 
  createMenuItem, 
  updateMenuItem, 
  deleteMenuItem,
  getPublicPages
} from '@/lib/firestoreService';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { PlusCircle, ChevronRight, ChevronDown, File, Folder, Edit, Trash, GripVertical } from 'lucide-react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { cn } from '@/lib/utils';

// MenuItem component for drag and drop
const DraggableMenuItem = ({ 
  item, 
  level = 0, 
  onOpenModal, 
  onDelete,
  onMove
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isFolder = item.type === 'folder';
  const dragDropRef = useRef(null);
  
  const toggleOpen = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  const handleEdit = (e) => {
    e.stopPropagation();
    onOpenModal('edit', item.parentId, item);
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de eliminar "${item.name}" ${hasChildren ? 'y todos sus sub-elementos' : ''}?`)) {
      onDelete(item.id);
    }
  };
  
  const handleAddChild = (e) => {
    e.stopPropagation();
    onOpenModal('add', item.id);
  };
  
  // Drag and drop with react-dnd
  const [{ isDragging }, drag] = useDrag({
    type: 'MENU_ITEM',
    item: { id: item.id, type: item.type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });
  
  // Drop target for folders
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'MENU_ITEM',
    drop: (droppedItem) => {
      if (droppedItem.id !== item.id && isFolder) {
        onMove(droppedItem.id, item.id);
      }
    },
    canDrop: (droppedItem) => droppedItem.id !== item.id && isFolder,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  });
  
  // Combine refs for items that can be both dragged and dropped (folders)
  // Use useRef and useEffect to handle the refs safely
  useEffect(() => {
    if (isFolder) {
      drop(dragDropRef);
      drag(dragDropRef);
    } else {
      drag(dragDropRef);
    }
  }, [drag, drop, isFolder]);
  
  return (
    <div
      ref={dragDropRef}
      className={cn(
        "mb-1 select-none",
        isDragging && "opacity-50",
        isOver && canDrop && "bg-accent/30"
      )}
    >
      <div 
        className={cn(
          "flex items-center p-2 rounded-md text-sm",
          "hover:bg-accent/50 transition-colors",
          isOver && canDrop && "bg-accent/50"
        )}
        onClick={isFolder ? toggleOpen : undefined}
      >
        <div className="mr-2 cursor-grab">
          <GripVertical size={16} className="text-muted-foreground" />
        </div>
        
        <div style={{ marginLeft: `${level * 12}px` }} className="flex items-center flex-1">
          {isFolder ? (
            <button 
              type="button" 
              onClick={toggleOpen}
              className="mr-1"
            >
              {isOpen ? (
                <ChevronDown size={16} className="text-muted-foreground" />
              ) : (
                <ChevronRight size={16} className="text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-4 mr-1"></div>
          )}
          
          {isFolder ? (
            <Folder size={16} className="mr-2 text-amber-500" />
          ) : (
            <File size={16} className="mr-2 text-blue-500" />
          )}
          
          <span className="flex-1 truncate">{item.name}</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={handleEdit}
          >
            <Edit size={14} />
            <span className="sr-only">Editar</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-destructive"
            onClick={handleDelete}
          >
            <Trash size={14} />
            <span className="sr-only">Eliminar</span>
          </Button>
          
          {isFolder && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={handleAddChild}
            >
              <ChevronDown size={14} />
              <span className="sr-only">Añadir elemento</span>
            </Button>
          )}
        </div>
      </div>
      
      {isFolder && hasChildren && isOpen && (
        <div className="pl-4 ml-6 border-l mt-1">
          {item.children.map((child) => (
            <DraggableMenuItem
              key={child.id}
              item={child}
              level={level + 1}
              onOpenModal={onOpenModal}
              onDelete={onDelete}
              onMove={onMove}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Root drop target for menu items
const RootDropTarget = ({ onMove, children }) => {
  const dropRef = useRef(null);
  const [{ isOver }, drop] = useDrop({
    accept: 'MENU_ITEM',
    drop: (item) => {
      onMove(item.id, null);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });
  
  // Use useEffect to handle the ref safely
  useEffect(() => {
    drop(dropRef);
  }, [drop]);
  
  return (
    <div 
      ref={dropRef} 
      className={`p-4 border rounded-md min-h-[300px] bg-muted/20 ${isOver ? 'bg-accent/30' : ''}`}
    >
      {children}
    </div>
  );
};

export default function AdminMenuGestion() {
  const [menuItems, setMenuItems] = useState([]);
  const [treeData, setTreeData] = useState([]);
  const [allPages, setAllPages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado para modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentItem, setCurrentItem] = useState(null);
  const [parentFolderId, setParentFolderId] = useState(null);
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('folder');
  const [selectedPageId, setSelectedPageId] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Cargar páginas
        const pages = await getPublicPages();
        setAllPages(pages);
        
        // Cargar elementos del menú
        const items = await getMenuItems();
        setMenuItems(items);
        
        // Construir árbol
        const tree = buildMenuTree(items);
        setTreeData(tree);
      } catch (error) {
        console.error('Error al cargar los datos:', error);
        toast.error('Error al cargar los datos');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Función para abrir modal
  const openModal = (mode, parentId = null, itemToEdit = null) => {
    setModalMode(mode);
    setParentFolderId(parentId);
    setCurrentItem(itemToEdit);
    setItemName(itemToEdit?.name || '');
    setItemType(itemToEdit?.type || 'folder');
    setSelectedPageId(itemToEdit?.pageId || '');
    setIsModalOpen(true);
  };

  // Función para manejar envío de formulario
  const handleModalSubmit = async () => {
    if (!itemName.trim() && itemType === 'folder') {
      toast.error('El nombre de la carpeta no puede estar vacío');
      return;
    }
    
    if (itemType === 'page' && !selectedPageId) {
      toast.error('Debes seleccionar una página');
      return;
    }

    setIsSaving(true);
    const selectedPageDetails = allPages.find(p => p.id === selectedPageId);
    
    try {
      if (modalMode === 'add') {
        // Obtener el orden máximo entre los hermanos
        const siblings = menuItems.filter(item => item.parentId === parentFolderId);
        const newOrder = siblings.length > 0 
          ? Math.max(...siblings.map(s => s.order)) + 1 
          : 0;

        const newItemData = {
          name: itemType === 'folder' ? itemName.trim() : selectedPageDetails?.title || 'Sin título',
          type: itemType,
          parentId: parentFolderId,
          order: newOrder,
          pageId: itemType === 'page' ? selectedPageId : null,
          slug: itemType === 'page' ? selectedPageDetails?.slug : null
        };
        
        const newItemId = await createMenuItem(newItemData);
        
        if (newItemId) {
          toast.success('Elemento añadido con éxito');
          
          // Actualizar el estado local
          const newItem = {
            id: newItemId,
            ...newItemData,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          const updatedItems = [...menuItems, newItem];
          setMenuItems(updatedItems);
          setTreeData(buildMenuTree(updatedItems));
        } else {
          toast.error('Error al añadir el elemento');
        }
      } else if (modalMode === 'edit' && currentItem) {
        const updatedData = {
          name: itemType === 'folder' ? itemName.trim() : selectedPageDetails?.title || 'Sin título',
          type: itemType,
          pageId: itemType === 'page' ? selectedPageId : null,
          slug: itemType === 'page' ? selectedPageDetails?.slug : null
        };
        
        const success = await updateMenuItem(currentItem.id, updatedData);
        
        if (success) {
          toast.success('Elemento actualizado con éxito');
          
          // Actualizar el estado local
          const updatedItems = menuItems.map(item => 
            item.id === currentItem.id 
              ? { ...item, ...updatedData, updatedAt: new Date() } 
              : item
          );
          
          setMenuItems(updatedItems);
          setTreeData(buildMenuTree(updatedItems));
        } else {
          toast.error('Error al actualizar el elemento');
        }
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error al guardar el elemento:', error);
      toast.error('Error al guardar. Por favor, intente de nuevo');
    } finally {
      setIsSaving(false);
    }
  };

  // Función para eliminar elemento
  const handleDeleteItem = async (itemId) => {
    try {
      setIsSaving(true);
      const success = await deleteMenuItem(itemId);
      
      if (success) {
        toast.success('Elemento eliminado con éxito');
        
        // Encontrar todos los IDs a eliminar (elemento y sus hijos)
        const findAllChildrenIds = (parentId) => {
          const childrenIds = menuItems
            .filter(item => item.parentId === parentId)
            .map(item => item.id);
          
          return [
            ...childrenIds,
            ...childrenIds.flatMap(childId => findAllChildrenIds(childId))
          ];
        };
        
        const idsToRemove = [itemId, ...findAllChildrenIds(itemId)];
        
        // Actualizar el estado local
        const updatedItems = menuItems.filter(item => !idsToRemove.includes(item.id));
        setMenuItems(updatedItems);
        setTreeData(buildMenuTree(updatedItems));
      } else {
        toast.error('Error al eliminar el elemento');
      }
    } catch (error) {
      console.error('Error al eliminar el elemento:', error);
      toast.error('Error al eliminar. Por favor, intente de nuevo');
    } finally {
      setIsSaving(false);
    }
  };

  // Manejar movimiento de elementos
  const handleMoveItem = async (itemId, newParentId) => {
    try {
      setIsSaving(true);
      
      // Obtener el elemento a mover
      const itemToMove = menuItems.find(item => item.id === itemId);
      if (!itemToMove) return;
      
      // Verificar que no estamos moviendo a un hijo propio (si es una carpeta)
      if (itemToMove.type === 'folder') {
        const getAllChildrenIds = (folderId) => {
          const directChildren = menuItems.filter(item => item.parentId === folderId);
          
          return [
            ...directChildren.map(child => child.id),
            ...directChildren
              .filter(child => child.type === 'folder')
              .flatMap(folder => getAllChildrenIds(folder.id))
          ];
        };
        
        const childrenIds = getAllChildrenIds(itemId);
        if (childrenIds.includes(newParentId)) {
          toast.error('No puedes mover una carpeta a uno de sus hijos');
          setIsSaving(false);
          return;
        }
      }
      
      // Obtener el orden máximo entre los hermanos en la nueva ubicación
      const newSiblings = menuItems.filter(item => item.parentId === newParentId);
      const newOrder = newSiblings.length > 0 
        ? Math.max(...newSiblings.map(s => s.order)) + 1 
        : 0;
      
      const success = await updateMenuItem(itemId, {
        parentId: newParentId,
        order: newOrder
      });
      
      if (success) {
        toast.success('Elemento movido con éxito');
        
        // Actualizar el estado local
        const updatedItems = menuItems.map(item => 
          item.id === itemId 
            ? { ...item, parentId: newParentId, order: newOrder, updatedAt: new Date() } 
            : item
        );
        
        setMenuItems(updatedItems);
        setTreeData(buildMenuTree(updatedItems));
      } else {
        toast.error('Error al mover el elemento');
      }
    } catch (error) {
      console.error('Error al mover el elemento:', error);
      toast.error('Error al mover el elemento');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando gestión de menú...</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <h1 className="text-3xl font-bold mb-6">Gestión del Menú Principal</h1>
        <p className="mb-6 text-muted-foreground">
          Crea carpetas y organiza las páginas en una estructura jerárquica. Arrastra para reordenar.
        </p>
        
        <Button onClick={() => openModal('add', null)} className="mb-4">
          <PlusCircle className="h-4 w-4 mr-2" /> Añadir Elemento Raíz
        </Button>
        
        <RootDropTarget onMove={handleMoveItem}>
          {treeData.length === 0 ? (
            <p className="text-muted-foreground">
              No hay elementos en el menú. Comienza añadiendo un elemento raíz.
            </p>
          ) : (
            treeData.map((item) => (
              <DraggableMenuItem
                key={item.id}
                item={item}
                level={0}
                onOpenModal={openModal}
                onDelete={handleDeleteItem}
                onMove={handleMoveItem}
              />
            ))
          )}
        </RootDropTarget>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {modalMode === 'add' 
                  ? 'Añadir Nuevo Elemento al Menú' 
                  : 'Editar Elemento del Menú'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="itemType" className="text-right">Tipo</Label>
                <Select
                  value={itemType}
                  onValueChange={setItemType}
                  disabled={modalMode === 'edit' && currentItem?.children?.length > 0}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="folder">Carpeta</SelectItem>
                    <SelectItem value="page">Página</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {itemType === 'folder' ? (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="itemName" className="text-right">Nombre Carpeta</Label>
                  <Input
                    id="itemName"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="selectedPageId" className="text-right">Página</Label>
                  <Select
                    value={selectedPageId}
                    onValueChange={setSelectedPageId}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona una página" />
                    </SelectTrigger>
                    <SelectContent>
                      {allPages.map((page) => (
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
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleModalSubmit} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}
