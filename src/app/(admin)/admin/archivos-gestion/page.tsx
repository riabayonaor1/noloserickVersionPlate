'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
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
import { PlusCircle, UploadCloud, FolderOpen, File, Folder, ChevronRight, ChevronDown, Edit, Trash } from 'lucide-react';
import { 
  getFileItems, 
  buildFileTree, 
  createFileItem, 
  updateFileItem, 
  deleteFileItem, 
  FileItem // Importamos la interfaz desde firestoreService
} from '@/lib/firestoreService';
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Eliminamos la definición duplicada de FileItem

// Interfaces para props de componentes
interface DraggableFileItemProps {
  item: FileItem;
  level?: number;
  onOpenModal: (mode: string, parentId: string | null, item?: FileItem) => void;
  onDelete: (id: string, url?: string) => void;
  onMove: (itemId: string, newParentId: string | null) => void;
}

interface RootDropTargetProps {
  onMove: (itemId: string, newParentId: string | null) => void;
  children: React.ReactNode;
}

// Interfaz para los objetos arrastrados
interface DragItem {
  id: string;
  type: string;
}

// FileItem component for drag and drop
const DraggableFileItem: React.FC<DraggableFileItemProps> = ({ 
  item, 
  level = 0, 
  onOpenModal, 
  onDelete,
  onMove
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isFolder = item.type === 'folder';
  
  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenModal('editItem', item.parentId, item);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de eliminar "${item.name}" ${hasChildren ? 'y todos sus sub-elementos' : ''}?`)) {
      onDelete(item.id, item.url ?? undefined);
    }
  };
  
  const handleOpenFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.url) {
      window.open(item.url, '_blank');
    }
  };
  
  const handleAddFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenModal('addFolder', item.id);
  };
  
  const handleUploadFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenModal('uploadFile', item.id);
  };
  
  // Format file size
  const formatFileSize = (size?: number) => {
    if (!size) return '';
    
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  };
  
  // Drag and drop with react-dnd
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'FILE_ITEM',
    item: { id: item.id, type: item.type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [item.id, item.type]);
  
  // Drop target for folders
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'FILE_ITEM',
    drop: (droppedItem: DragItem) => {
      if (droppedItem.id !== item.id && isFolder) {
        onMove(droppedItem.id, item.id);
      }
    },
    canDrop: (droppedItem: DragItem) => droppedItem.id !== item.id && isFolder,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [item.id, isFolder]);
  
  // Combine refs for items that can be both dragged and dropped (folders)
  const dragDropRef = useRef<HTMLDivElement>(null);
  
  // Apply the drag and drop refs
  React.useEffect(() => {
    if (dragDropRef.current) {
      drag(dragDropRef.current);
      if (isFolder) {
        drop(dragDropRef.current);
      }
    }
    
    return () => {
      drag(null);
      if (isFolder) {
        drop(null);
      }
    };
  }, [drag, drop, isFolder]);
  
  return (
    <div
      ref={dragDropRef}
      className={`mb-1 select-none ${isDragging ? 'opacity-50' : ''} ${isOver && canDrop ? 'bg-accent/30' : ''}`}
    >
      <div 
        className={`flex items-center p-2 rounded-md text-sm hover:bg-accent/50 transition-colors ${isOver && canDrop ? 'bg-accent/50' : ''}`}
        onClick={isFolder ? toggleOpen : undefined}
      >
        <div className="flex items-center flex-1" style={{ marginLeft: `${level * 12}px` }}>
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
            <Folder size={16} className="mr-2 text-orange-500" />
          ) : (
            <File size={16} className="mr-2 text-blue-500" />
          )}
          
          <span className="flex-1 truncate">{item.name}</span>
          
          {!isFolder && item.size && (
            <span className="text-xs text-muted-foreground mr-2">
              {formatFileSize(item.size)}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {!isFolder && item.url && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={handleOpenFile}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link"><path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
              <span className="sr-only">Abrir</span>
            </Button>
          )}
          
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
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={handleAddFolder}
              >
                <Folder size={14} />
                <span className="sr-only">Crear carpeta</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={handleUploadFile}
              >
                <File size={14} />
                <span className="sr-only">Subir archivo</span>
              </Button>
            </>
          )}
        </div>
      </div>
      
      {isFolder && hasChildren && isOpen && (
        <div className="pl-4 ml-6 border-l mt-1">
          {(item.children ?? []).map((child) => (
            <DraggableFileItem
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

// Root drop target for files
const RootDropTarget: React.FC<RootDropTargetProps> = ({ onMove, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'FILE_ITEM',
    drop: (item: DragItem) => {
      onMove(item.id, null);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [onMove]);
  
  const dropRef = useRef<HTMLDivElement>(null);
  
  // Apply the drop ref
  React.useEffect(() => {
    if (dropRef.current) {
      drop(dropRef.current);
    }
    
    return () => {
      drop(null);
    };
  }, [drop]);
  
  return (
    <div 
      ref={dropRef} 
      className={`min-h-[300px] ${isOver ? 'bg-accent/30' : ''}`}
    >
      {children}
    </div>
  );
};

export default function ArchivosGestion() {
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [treeData, setTreeData] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('addFolder');
  const [currentItem, setCurrentItem] = useState<FileItem | null>(null);
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [itemName, setItemName] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  
  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Cargar elementos de archivos
        const items = await getFileItems();
        setFileItems(items);
        
        // Construir árbol
        const tree = buildFileTree(items);
        setTreeData(tree);
      } catch (error) {
        console.error('Error al cargar los datos:', error);
        toast.error('Error al cargar los archivos');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Función para abrir modal
  const openModal = (mode: string, parentId: string | null = null, itemToEdit: FileItem | null = null) => {
    setModalMode(mode);
    setParentFolderId(parentId);
    setCurrentItem(itemToEdit);
    setItemName(itemToEdit?.name || '');
    setIsModalOpen(true);
    setFileToUpload(null);
    setUploadProgress(0);
  };

  // Manejar selección de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  // Manejar subida de archivo
  const handleUploadFile = async () => {
    if (!fileToUpload) {
      toast.error('Por favor, selecciona un archivo');
      return;
    }
    
    if (!itemName.trim()) {
      // Si no se especificó un nombre, usar el nombre del archivo
      setItemName(fileToUpload.name);
    }
    
    setIsSaving(true);
    setUploadProgress(10);
    
    try {
      // Crear referencia al storage
      const fileNameToUse = itemName.trim() || fileToUpload.name;
      const storageRef = ref(storage, `uploads/${Date.now()}_${fileNameToUse}`);
      
      // Subir archivo
      setUploadProgress(30);
      await uploadBytes(storageRef, fileToUpload);
      
      // Obtener URL del archivo subido
      setUploadProgress(70);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Obtener el orden máximo entre los hermanos
      const siblings = fileItems.filter(item => item.parentId === parentFolderId);
      const newOrder = siblings.length > 0 
        ? Math.max(...siblings.map(s => s.order)) + 1 
        : 0;
      
      // Crear registro en Firestore
      const newFileData = {
        name: fileNameToUse,
        type: 'file' as const,
        parentId: parentFolderId,
        url: downloadURL,
        contentType: fileToUpload.type,
        size: fileToUpload.size,
        order: newOrder
      };
      
      setUploadProgress(85);
      const newFileId = await createFileItem(newFileData);
      
      if (newFileId) {
        setUploadProgress(100);
        toast.success('Archivo subido con éxito');
        
        // Actualizar el estado local
        const newFile: FileItem = {
          id: newFileId,
          ...newFileData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const updatedItems = [...fileItems, newFile];
        setFileItems(updatedItems);
        setTreeData(buildFileTree(updatedItems));
        
        setTimeout(() => {
          setIsModalOpen(false);
          setUploadProgress(0);
        }, 500);
      } else {
        toast.error('Error al registrar el archivo');
      }
    } catch (error) {
      console.error('Error al subir el archivo:', error);
      toast.error('Error al subir el archivo');
    } finally {
      setIsSaving(false);
    }
  };

  // Manejar creación de carpeta
  const handleCreateFolder = async () => {
    if (!itemName.trim()) {
      toast.error('El nombre de la carpeta no puede estar vacío');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Obtener el orden máximo entre los hermanos
      const siblings = fileItems.filter(item => item.parentId === parentFolderId);
      const newOrder = siblings.length > 0 
        ? Math.max(...siblings.map(s => s.order)) + 1 
        : 0;
      
      const newFolderData = {
        name: itemName.trim(),
        type: 'folder' as const,
        parentId: parentFolderId,
        order: newOrder
      };
      
      const newFolderId = await createFileItem(newFolderData);
      
      if (newFolderId) {
        toast.success('Carpeta creada con éxito');
        
        // Actualizar el estado local
        const newFolder: FileItem = {
          id: newFolderId,
          ...newFolderData,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const updatedItems = [...fileItems, newFolder];
        setFileItems(updatedItems);
        setTreeData(buildFileTree(updatedItems));
        setIsModalOpen(false);
      } else {
        toast.error('Error al crear la carpeta');
      }
    } catch (error) {
      console.error('Error al crear la carpeta:', error);
      toast.error('Error al crear la carpeta');
    } finally {
      setIsSaving(false);
    }
  };

  // Función para editar carpeta o archivo
  const handleEdit = async () => {
    if (!currentItem) return;
    
    if (!itemName.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const updatedData = {
        name: itemName.trim()
      };
      
      const success = await updateFileItem(currentItem.id, updatedData);
      
      if (success) {
        toast.success('Elemento actualizado con éxito');
        
        // Actualizar el estado local
        const updatedItems = fileItems.map(item => 
          item.id === currentItem.id 
            ? { ...item, ...updatedData, updatedAt: new Date() } 
            : item
        );
        
        setFileItems(updatedItems);
        setTreeData(buildFileTree(updatedItems));
        setIsModalOpen(false);
      } else {
        toast.error('Error al actualizar el elemento');
      }
    } catch (error) {
      console.error('Error al actualizar el elemento:', error);
      toast.error('Error al actualizar el elemento');
    } finally {
      setIsSaving(false);
    }
  };

  // Función para eliminar elemento
  const handleDeleteItem = async (itemId: string, url: string | undefined = undefined) => {
    try {
      setIsSaving(true);
      
      // Si es un archivo, también eliminar del storage
      const item = fileItems.find(item => item.id === itemId);
      if (item?.type === 'file' && item?.url) {
        try {
          // Extraer el path del storage de la URL
          const urlObj = new URL(item.url);
          const pathToDelete = urlObj.pathname.split('/o/')[1];
          if (pathToDelete) {
            const decodedPath = decodeURIComponent(pathToDelete);
            const fileRef = ref(storage, decodedPath);
            await deleteObject(fileRef);
          }
        } catch (storageError) {
          console.error('Error al eliminar archivo del storage:', storageError);
          // Continuar a pesar del error para mantener la consistencia
        }
      }
      
      const success = await deleteFileItem(itemId);
      
      if (success) {
        toast.success('Elemento eliminado con éxito');
        
        // Encontrar todos los IDs a eliminar (elemento y sus hijos)
        const findAllChildrenIds = (parentId: string): string[] => {
          const childrenIds = fileItems
            .filter(item => item.parentId === parentId)
            .map(item => item.id);
          
          return [
            ...childrenIds,
            ...childrenIds.flatMap(childId => findAllChildrenIds(childId))
          ];
        };
        
        const idsToRemove = [itemId, ...findAllChildrenIds(itemId)];
        
        // Actualizar el estado local
        const updatedItems = fileItems.filter(item => !idsToRemove.includes(item.id));
        setFileItems(updatedItems);
        setTreeData(buildFileTree(updatedItems));
      } else {
        toast.error('Error al eliminar el elemento');
      }
    } catch (error) {
      console.error('Error al eliminar el elemento:', error);
      toast.error('Error al eliminar el elemento');
    } finally {
      setIsSaving(false);
    }
  };

  // Manejar movimiento de archivos
  const handleMoveItem = async (itemId: string, newParentId: string | null) => {
    try {
      setIsSaving(true);
      
      // Obtener el elemento a mover
      const itemToMove = fileItems.find(item => item.id === itemId);
      if (!itemToMove) return;
      
      // Verificar que no estamos moviendo a un hijo propio (si es una carpeta)
      if (itemToMove.type === 'folder') {
        const getAllChildrenIds = (folderId: string): string[] => {
          const directChildren = fileItems.filter(item => item.parentId === folderId);
          
          return [
            ...directChildren.map(child => child.id),
            ...directChildren
              .filter(child => child.type === 'folder')
              .flatMap(folder => getAllChildrenIds(folder.id))
          ];
        };
        
        const childrenIds = getAllChildrenIds(itemId);
        if (childrenIds.includes(newParentId as string)) {
          toast.error('No puedes mover una carpeta a uno de sus hijos');
          setIsSaving(false);
          return;
        }
      }
      
      // Obtener el orden máximo entre los hermanos en la nueva ubicación
      const newSiblings = fileItems.filter(item => item.parentId === newParentId);
      const newOrder = newSiblings.length > 0 
        ? Math.max(...newSiblings.map(s => s.order)) + 1 
        : 0;
      
      const success = await updateFileItem(itemId, {
        parentId: newParentId,
        order: newOrder
      });
      
      if (success) {
        toast.success('Elemento movido con éxito');
        
        // Actualizar el estado local
        const updatedItems = fileItems.map(item => 
          item.id === itemId 
            ? { ...item, parentId: newParentId, order: newOrder, updatedAt: new Date() } 
            : item
        );
        
        setFileItems(updatedItems);
        setTreeData(buildFileTree(updatedItems));
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

  // Renderizado del modal según el modo
  const renderModalContent = () => {
    switch (modalMode) {
      case 'addFolder':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Crear Nueva Carpeta</DialogTitle>
              <DialogDescription>
                Introduce el nombre para la nueva carpeta.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="folderName" className="text-right">Nombre</Label>
                <Input
                  id="folderName"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="col-span-3"
                  placeholder="Nueva Carpeta"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateFolder} disabled={isSaving}>
                {isSaving ? 'Creando...' : 'Crear Carpeta'}
              </Button>
            </DialogFooter>
          </>
        );
        
      case 'uploadFile':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Subir Nuevo Archivo</DialogTitle>
              <DialogDescription>
                Selecciona un archivo para subir.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fileName" className="text-right">Nombre</Label>
                <Input
                  id="fileName"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="col-span-3"
                  placeholder="(Opcional) Nombre personalizado"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file" className="text-right">Archivo</Label>
                <div className="col-span-3">
                  <Input
                    id="file"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="col-span-3"
                  />
                  {fileToUpload && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {fileToUpload.name} ({Math.round(fileToUpload.size / 1024)} KB)
                    </p>
                  )}
                </div>
              </div>
              
              {uploadProgress > 0 && (
                <div className="mt-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-center mt-1">{uploadProgress}%</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleUploadFile} disabled={isSaving || !fileToUpload}>
                {isSaving ? 'Subiendo...' : 'Subir Archivo'}
              </Button>
            </DialogFooter>
          </>
        );
        
      case 'editItem':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Editar {currentItem?.type === 'folder' ? 'Carpeta' : 'Archivo'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="itemName" className="text-right">Nombre</Label>
                <Input
                  id="itemName"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleEdit} disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </DialogFooter>
          </>
        );
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Cargando gestión de archivos...</div>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        <h1 className="text-3xl font-bold mb-6">Gestión de Archivos</h1>
        <p className="mb-6 text-muted-foreground">
          Crea carpetas y sube archivos organizados jerárquicamente. Arrastra para reorganizar.
        </p>
        
        <div className="mb-6 flex flex-wrap gap-2">
          <Button onClick={() => openModal('addFolder', null)}>
            <Folder className="h-4 w-4 mr-2" /> Crear Carpeta
          </Button>
          <Button onClick={() => openModal('uploadFile', null)}>
            <UploadCloud className="h-4 w-4 mr-2" /> Subir Archivo
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <RootDropTarget onMove={handleMoveItem}>
              {treeData.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay archivos subidos. Comienza creando una carpeta o subiendo un archivo.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {treeData.map((item) => (
                    <DraggableFileItem
                      key={item.id}
                      item={item}
                      level={0}
                      onOpenModal={openModal}
                      onDelete={handleDeleteItem}
                      onMove={handleMoveItem}
                    />
                  ))}
                </div>
              )}
            </RootDropTarget>
          </CardContent>
        </Card>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            {renderModalContent()}
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}
