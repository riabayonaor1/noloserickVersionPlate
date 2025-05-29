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
  onMove,
  parentId // Added parentId to know the current parent
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isFolder = item.type === 'folder';
  const dragDropRef = useRef(null); // Ref for the main draggable part

  const toggleOpen = (e) => {
    // console.log("toggleOpen called for item:", item.name, e.target); // Removed console.log
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  const handleEdit = (e) => {
    // console.log("handleEdit called for item:", item.name, e.target); // Removed console.log
    e.stopPropagation();
    onOpenModal('edit', item.parentId, item);
  };
  
  const handleDelete = (e) => {
    // console.log("handleDelete called for item:", item.name, e.target); // Removed console.log
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de eliminar "${item.name}" ${hasChildren ? 'y todos sus sub-elementos' : ''}?`)) {
      onDelete(item.id);
    }
  };
  
  const handleAddChild = (e) => {
    // console.log("handleAddChild called for item:", item.name, e.target); // Removed console.log
    e.stopPropagation();
    onOpenModal('add', item.id);
  };
  
  const [{ isDragging }, drag] = useDrag({
    type: 'MENU_ITEM',
    item: { id: item.id, type: item.type, originalParentId: item.parentId, originalOrder: item.order },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  // Drop target for dropping ONTO a folder
  const [{ isOverFolder, canDropOnFolder }, dropOnFolder] = useDrop({
    accept: 'MENU_ITEM',
    drop: (droppedItem) => {
      if (droppedItem.id !== item.id && isFolder) {
        // Move into this folder, order will be last
        onMove(droppedItem.id, item.id, undefined); 
      }
    },
    canDrop: (droppedItem) => droppedItem.id !== item.id && isFolder && droppedItem.id !== item.parentId,
    collect: (monitor) => ({
      isOverFolder: !!monitor.isOver({ shallow: true }) && !!monitor.canDrop(),
      canDropOnFolder: !!monitor.canDrop(),
    }),
  });

  // Drop target for dropping BEFORE an item (reordering)
  const [{ isOverBefore, canDropBefore }, dropBefore] = useDrop({
    accept: 'MENU_ITEM',
    drop: (droppedItem) => {
      if (droppedItem.id !== item.id) {
        // Move before this item, calculate new order
        onMove(droppedItem.id, item.parentId, item.order);
      }
    },
    canDrop: (droppedItem) => droppedItem.id !== item.id,
    collect: (monitor) => ({
      isOverBefore: !!monitor.isOver({ shallow: true }) && !!monitor.canDrop(),
      canDropBefore: !!monitor.canDrop(),
    }),
  });
  
  // Drop target for dropping AFTER an item (reordering)
  // This is effectively the same as dropping before the NEXT item,
  // but can also handle dropping at the end of a list if this is the last item.
  const [{ isOverAfter, canDropAfter }, dropAfter] = useDrop({
    accept: 'MENU_ITEM',
    drop: (droppedItem) => {
      if (droppedItem.id !== item.id) {
        onMove(droppedItem.id, item.parentId, item.order + 1);
      }
    },
    canDrop: (droppedItem) => droppedItem.id !== item.id,
    collect: (monitor) => ({
      isOverAfter: !!monitor.isOver({ shallow: true }) && !!monitor.canDrop(),
      canDropAfter: !!monitor.canDrop(),
    }),
  });

  // Attach refs
  useEffect(() => {
    drag(dragDropRef); // The entire item is draggable
    if (isFolder) {
      dropOnFolder(dragDropRef); // Folders can have items dropped ONTO them
    }
    // These refs are for the visual indicators and small drop zones
    // They don't need to be combined with dragDropRef directly for dnd functionality,
    // but rather positioned correctly in the JSX.
  }, [drag, dropOnFolder, isFolder]);

  return (
    <div className={cn("relative select-none", isDragging && "opacity-30")}>
      {/* Drop zone BEFORE item */}
      <div
        ref={dropBefore}
        className={cn(
          "absolute top-0 left-0 right-0 h-4 z-10",
          isOverBefore && canDropBefore ? "bg-sky-300/50 opacity-100" : "opacity-0", // Conditional visibility restored
          !isOverBefore && "hover:opacity-100" // Optional: show on hover even if not dragging over
        )}
        style={{ marginLeft: `${level * 12 + 20}px` }} // Indent based on level
      >
        {isOverBefore && <div className="h-full w-full border-t-2 border-sky-500"></div>}
      </div>

      <div
        ref={dragDropRef} // Main draggable element
        className={cn(
          "mb-1 relative", // Ensure relative positioning for children drop zones
          isOverFolder && canDropOnFolder && "bg-amber-200/50" // Highlight when dropping ONTO folder
        )}
      >
        <div 
          className={cn(
            "flex items-center p-2 rounded-md text-sm",
            "hover:bg-accent/50 transition-colors"
          )}
          onClick={(e) => {
            // console.log('Main div clicked for folder:', item.name, 'isFolder:', isFolder); // Removed console.log
            if (isFolder) {
              // Check if the click target is the toggle button itself or its child (icon)
              // This is to prevent the main div click from toggling if the button was already clicked
              // (which would stop propagation)
              const target = e.target as HTMLElement;
              const isToggleButton = target.closest('button') === e.currentTarget.querySelector('button.mr-1');

              // Also check if the click is on the item name span, if so, allow toggle
              const isItemNameSpan = target.closest('span') === e.currentTarget.querySelector('span.flex-1.truncate');

              if (isToggleButton || isItemNameSpan || !target.closest('button')) {
                 // If the click is on the toggle button, its direct children (like the icon),
                 // or on the item name, or not on any other button within this div, then toggle.
                 // The specific buttons for edit/delete/add child have their own e.stopPropagation().
                toggleOpen(e);
              }
            }
          }}
        >
          <div className="mr-2 cursor-grab">
            <GripVertical size={16} className="text-muted-foreground" />
          </div>
          
          <div style={{ marginLeft: `${level * 12}px` }} className="flex items-center flex-1">
            {isFolder ? (
              <button 
                type="button" 
                onClick={toggleOpen}
                className="mr-1 relative z-20" // Added relative z-20
              >
                {isOpen ? (
                  <ChevronDown size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronRight size={16} className="text-muted-foreground" />
                )}
              </button>
            ) : (
              <div className="w-4 mr-1"></div> // Placeholder for non-folders
            )}
            
            {isFolder ? (
              <Folder size={16} className="mr-2 text-amber-500" />
            ) : (
              <File size={16} className="mr-2 text-blue-500" />
            )}
            
            <span className="flex-1 truncate relative z-20">{item.name}</span> {/* Added relative z-20 */}
          </div>
          
          <div className="flex items-center gap-1 relative z-20"> {/* Added relative z-20 */}
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
                <PlusCircle size={14} /> 
                <span className="sr-only">Añadir sub-elemento</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Drop zone AFTER item */}
      <div
        ref={dropAfter}
        className={cn(
          "absolute bottom-0 left-0 right-0 h-4 z-10",
          isOverAfter && canDropAfter ? "bg-sky-300/50 opacity-100" : "opacity-0", // Conditional visibility restored
          !isOverAfter && "hover:opacity-100" // Optional: show on hover
        )}
        style={{ marginLeft: `${level * 12 + 20}px` }}
      >
        {isOverAfter && <div className="h-full w-full border-b-2 border-sky-500"></div>}
      </div>
      
      {isFolder && hasChildren && isOpen && (
        <div className="pl-4 ml-6 border-l mt-1 relative">
          {/* Drop zone for empty folder or end of list in folder */}
          <div
            ref={dropOnFolder} // Re-use dropOnFolder ref for the empty space if desired, or a new one
            className={cn(
              "absolute top-0 bottom-0 left-0 right-0 z-0", // Covers the children area
              isOverFolder && canDropOnFolder && !item.children.find(c => c.id === 'temp-hover-id') && "bg-amber-100/30" // Highlight if empty and dropping
            )}
            onDrop={(e) => { // This onDrop is for the container, not react-dnd directly
              e.preventDefault(); // Prevent default to allow drop
            }}
            onDragOver={(e) => e.preventDefault()} // Necessary for onDrop to fire
          />
          {item.children.map((child) => (
            <DraggableMenuItem
              key={child.id}
              item={child}
              level={level + 1}
              onOpenModal={onOpenModal}
              onDelete={onDelete}
              onMove={onMove}
              parentId={item.id} // Pass current folder's ID as parentId
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Root drop target for menu items
const RootDropTarget = ({ onMove, children, menuItems }) => { // Added menuItems
  const dropRef = useRef(null);
  const [{ isOverRoot, canDropOnRoot }, drop] = useDrop({
    accept: 'MENU_ITEM',
    drop: (droppedItem) => {
      // Move to root, order will be last among root items
      onMove(droppedItem.id, null, undefined); 
    },
    canDrop: (droppedItem) => droppedItem.parentId !== null, // Can drop if not already a root item
    collect: (monitor) => ({
      isOverRoot: !!monitor.isOver({ shallow: true }) && !!monitor.canDrop(),
      canDropOnRoot: !!monitor.canDrop(),
    }),
  });
  
  useEffect(() => {
    drop(dropRef);
  }, [drop]);
  
  return (
    <div 
      ref={dropRef} 
      className={cn(
        "p-4 border rounded-md min-h-[300px] bg-muted/20",
        isOverRoot && canDropOnRoot && "bg-emerald-100/50" // Visual cue for dropping on root
      )}
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
  const handleMoveItem = async (itemId, newParentId, targetOrder) => {
    setIsSaving(true);
    const originalMenuItems = JSON.parse(JSON.stringify(menuItems)); 

    try {
      const itemToMoveFromOriginals = originalMenuItems.find(item => item.id === itemId);
      if (!itemToMoveFromOriginals) {
        toast.error("Elemento a mover no encontrado.");
        setIsSaving(false);
        return;
      }

      // Prevent moving a folder into itself or one of its children
      if (itemToMoveFromOriginals.type === 'folder' && newParentId) {
        let currentAncestorId = newParentId;
        while (currentAncestorId) {
          if (currentAncestorId === itemId) {
            toast.error('No puedes mover una carpeta a uno de sus propios hijos.');
            setIsSaving(false);
            return;
          }
          // Check against originalMenuItems to avoid issues with partially modified temp data
          const ancestorItem = originalMenuItems.find(item => item.id === currentAncestorId);
          currentAncestorId = ancestorItem ? ancestorItem.parentId : null;
        }
      }
      
      let workingMenuItems = JSON.parse(JSON.stringify(originalMenuItems));
      
      const movedItemIndex = workingMenuItems.findIndex(i => i.id === itemId);
      const movedItem = { ...workingMenuItems.splice(movedItemIndex, 1)[0] };

      const originalParentId = movedItem.parentId;
      
      // Update moved item's properties
      movedItem.parentId = newParentId;
      movedItem.updatedAt = new Date().toISOString(); // Mark as updated

      // --- Reordering and Normalization Logic ---
      let itemsToUpdateInFirestore = [];

      // Add movedItem to the list temporarily for easy filtering, its order is not final yet
      workingMenuItems.push(movedItem);

      const parentIdsAffected = new Set();
      if (originalParentId !== newParentId) {
        parentIdsAffected.add(originalParentId);
      }
      parentIdsAffected.add(newParentId);

      if (targetOrder !== undefined) { // Item is being reordered or moved to a specific position
        const siblingsInNewParent = workingMenuItems
          .filter(item => item.parentId === newParentId && item.id !== itemId) // Exclude the item being moved for now
          .sort((a, b) => a.order - b.order);

        // Insert the moved item at the targetOrder
        siblingsInNewParent.splice(targetOrder, 0, movedItem);
        
        // Update orders for all items in this group
        siblingsInNewParent.forEach((sibling, index) => {
          if (sibling.order !== index || (sibling.id === itemId && sibling.parentId !== newParentId)) { // If order or parent changed for the moved item
            workingMenuItems.find(i => i.id === sibling.id).order = index;
          }
        });
        movedItem.order = targetOrder; // Ensure movedItem's order is correctly set
      } else { // Item is being appended to the new parent (dropped onto folder or root)
        const siblingsInNewParent = workingMenuItems
          .filter(item => item.parentId === newParentId && item.id !== itemId)
          .sort((a, b) => a.order - b.order);
        
        movedItem.order = siblingsInNewParent.length;
        // Siblings orders don't change relative to each other, but the group will be normalized
      }

      // Normalize orders for all affected parents
      parentIdsAffected.forEach(pId => {
        const childrenOfParent = workingMenuItems
          .filter(item => item.parentId === pId)
          .sort((a, b) => a.order - b.order);

        childrenOfParent.forEach((child, index) => {
          if (child.order !== index) {
            child.order = index; // Update in workingMenuItems
          }
        });
      });
      
      // Determine final list of changes for Firestore
      workingMenuItems.forEach(currentItem => {
        const originalItem = originalMenuItems.find(orig => orig.id === currentItem.id);
        const changes = {};
        let hasChanges = false;

        if (originalItem.parentId !== currentItem.parentId) {
          changes.parentId = currentItem.parentId;
          hasChanges = true;
        }
        if (originalItem.order !== currentItem.order) {
          changes.order = currentItem.order;
          hasChanges = true;
        }

        if (hasChanges) {
          itemsToUpdateInFirestore.push({ id: currentItem.id, changes });
        } else if (currentItem.id === itemId && originalItem.updatedAt !== currentItem.updatedAt) {
          // If only updatedAt changed for the moved item (e.g. moved to same place but triggered self-nesting check)
          // We might want to ensure parentId and order are explicitly part of the update if no other changes.
          // However, the current requirement is to return changes for parentId and/or order.
          // If an item is moved but its parent and final order are the same, it won't be in itemsToUpdateInFirestore
          // unless other items shifted causing its original order to be different from current.
        }
      });
      
      // If the moved item itself didn't have parent/order changes but caused others to shift,
      // it should still be in workingMenuItems with its correct (potentially unchanged) parent/order.
      // We need to ensure the moved item's final state is correctly reflected if it's part of itemsToUpdateInFirestore.
      const movedItemFinalState = workingMenuItems.find(i => i.id === itemId);
      const movedItemUpdateEntry = itemsToUpdateInFirestore.find(u => u.id === itemId);

      if (movedItemFinalState && !movedItemUpdateEntry) {
        // This case can happen if the item was moved, but its final parentId and order are identical to original,
        // and no other items shifted around it. (e.g. dragged and dropped in the exact same spot)
        // The prompt requires returning items whose parentId or order changed.
        // If no changes, itemsToUpdateInFirestore will be empty.
      } else if (movedItemFinalState && movedItemUpdateEntry) {
        // Ensure the update entry for the moved item reflects its final calculated state.
        // This is important if the initial parentId/order in changes was from an intermediate state.
        if (movedItemFinalState.parentId !== movedItemUpdateEntry.changes.parentId) {
            movedItemUpdateEntry.changes.parentId = movedItemFinalState.parentId;
             if (movedItemUpdateEntry.changes.parentId === undefined) delete movedItemUpdateEntry.changes.parentId; // Clean up if it became undefined
        }
        if (movedItemFinalState.order !== movedItemUpdateEntry.changes.order) {
            movedItemUpdateEntry.changes.order = movedItemFinalState.order;
        }
         // Ensure changes object is not empty
        if (Object.keys(movedItemUpdateEntry.changes).length === 0) {
          itemsToUpdateInFirestore = itemsToUpdateInFirestore.filter(u => u.id !== itemId);
        }
      }
      
      // Ensure all entries in itemsToUpdateInFirestore have a non-empty changes object
      itemsToUpdateInFirestore = itemsToUpdateInFirestore.filter(
        u => u.changes && Object.keys(u.changes).length > 0
      );

      // The function will now return the changes and the updated temporary menu.
      // The calling code will handle Firestore updates and state setting.
      return { updates: itemsToUpdateInFirestore, updatedMenuItems: workingMenuItems };

    } catch (error) {
      console.error('Error al calcular el movimiento del elemento:', error);
      // Return null or throw error to indicate failure, caller should handle this.
      // Reverting to originalMenuItems should be handled by the caller if transaction fails.
      throw error; 
    } finally {
      // setIsSaving should be controlled by the caller that performs async operations.
      // setIsSaving(false); 
    }
  };
  
  // Wrapper function to be called by UI components, which then handles Firestore and state.
  const processMoveItem = async (itemId, newParentId, targetOrder) => {
    setIsSaving(true);
    const originalItemsForRevert = JSON.parse(JSON.stringify(menuItems));

    try {
      const result = await handleMoveItem(itemId, newParentId, targetOrder);

      if (result && result.updates.length > 0) {
        const { updates, updatedMenuItems } = result;
        const updatePromises = updates.map(u => updateMenuItem(u.id, u.changes));
        await Promise.all(updatePromises);
        
        setMenuItems(updatedMenuItems);
        setTreeData(buildMenuTree(updatedMenuItems));
        toast.success('Menú reorganizado con éxito.');
      } else {
        // No actual changes to persist, or result was null/undefined
        toast.info('No se realizaron cambios en la estructura del menú.');
        // Ensure UI reflects the original state if no changes were made or if calculation was aborted.
        // If handleMoveItem did calculations but found no effective change, updatedMenuItems would be original state or equivalent.
        if (result && result.updatedMenuItems) {
            setMenuItems(result.updatedMenuItems);
            setTreeData(buildMenuTree(result.updatedMenuItems));
        } else {
            setMenuItems(originalItemsForRevert);
            setTreeData(buildMenuTree(originalItemsForRevert));
        }
      }
    } catch (error) {
      // Error from handleMoveItem or Firestore update
      toast.error(`Error al reorganizar el menú: ${error.message}`);
      setMenuItems(originalItemsForRevert);
      setTreeData(buildMenuTree(originalItemsForRevert));
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
        
        <RootDropTarget onMove={handleMoveItem} menuItems={menuItems}>
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
                onMove={processMoveItem}
                parentId={null} // Root items have null parentId
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
