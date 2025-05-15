'use client';

import React, { useState, useEffect } from 'react';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { getFileItems, buildFileTree, FileItem, createFileItem, updateFileItem, deleteFileItem } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Folder, File, Plus, Pencil, Trash2, MoveUp, MoveDown, 
  Upload, Download, FolderOpen, ChevronRight, FolderTree 
} from 'lucide-react';
import { storage } from '@/lib/firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export default function AdminFiles() {
  const { currentUser } = useAuth();
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [fileTree, setFileTree] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFolder, setCurrentFolder] = useState<FileItem | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<FileItem[]>([]);
  
  // Estados para el formulario
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState<boolean>(false);
  const [itemToEdit, setItemToEdit] = useState<FileItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<FileItem | null>(null);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemType, setNewItemType] = useState<'folder' | 'file'>('folder');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Cargar archivos
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar elementos de archivos
        const items = await getFileItems();
        setFileItems(items);
        setFileTree(buildFileTree(items));
        
        setError(null);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('Error al cargar los archivos. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Actualizar breadcrumbs cuando se cambia de carpeta
  useEffect(() => {
    if (!currentFolder) {
      setBreadcrumbs([]);
      return;
    }
    
    const buildBreadcrumbs = () => {
      const breadcrumbItems: FileItem[] = [];
      let currentParent = currentFolder;
      
      breadcrumbItems.unshift(currentParent);
      
      while (currentParent.parentId) {
        const parent = fileItems.find(item => item.id === currentParent.parentId);
        if (parent) {
          breadcrumbItems.unshift(parent);
          currentParent = parent;
        } else {
          break;
        }
      }
      
      return breadcrumbItems;
    };
    
    setBreadcrumbs(buildBreadcrumbs());
  }, [currentFolder, fileItems]);

  // Resetear formulario
  const resetForm = () => {
    setNewItemName('');
    setNewItemType('folder');
    setSelectedFile(null);
    setUploadProgress(0);
  };

  // Preparar edición
  const prepareEditItem = (item: FileItem) => {
    setItemToEdit(item);
    setNewItemName(item.name);
    setNewItemType(item.type);
    setIsEditDialogOpen(true);
  };

  // Preparar eliminación
  const prepareDeleteItem = (item: FileItem) => {
    setItemToDelete(item);
    setIsDeleteDialogOpen(true);
  };

  // Navegar a una carpeta
  const navigateToFolder = (folder: FileItem | null) => {
    setCurrentFolder(folder);
  };

  // Obtener elementos de la carpeta actual
  const getCurrentFolderItems = () => {
    const parentId = currentFolder ? currentFolder.id : null;
    return fileItems
      .filter(item => item.parentId === parentId)
      .sort((a, b) => {
        // Primero carpetas, luego archivos
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        // Luego por orden
        return a.order - b.order;
      });
  };

  // Crear nueva carpeta
  const handleCreateFolder = async () => {
    if (!newItemName.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    
    try {
      const newFolder: Omit<FileItem, 'id' | 'createdAt' | 'updatedAt'> = {
        name: newItemName.trim(),
        type: 'folder',
        parentId: currentFolder ? currentFolder.id : null,
        order: fileItems.filter(item => item.parentId === (currentFolder ? currentFolder.id : null)).length,
      };
      
      const newFolderId = await createFileItem(newFolder);
      
      if (newFolderId) {
        toast.success('Carpeta creada con éxito');
        
        // Actualizar estado local
        const updatedItem: FileItem = {
          ...newFolder,
          id: newFolderId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const updatedItems = [...fileItems, updatedItem];
        setFileItems(updatedItems);
        setFileTree(buildFileTree(updatedItems));
        
        // Cerrar diálogo y resetear formulario
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        toast.error('Error al crear la carpeta');
      }
    } catch (error) {
      console.error('Error al crear carpeta:', error);
      toast.error('Error al crear la carpeta');
    }
  };

  // Subir archivo
  const handleUploadFile = async () => {
    if (!selectedFile || !newItemName.trim()) {
      toast.error('Selecciona un archivo y proporciona un nombre');
      return;
    }
    
    if (!currentUser) {
      toast.error('Debes iniciar sesión para subir archivos');
      return;
    }
    
    try {
      setUploadProgress(0);
      
      // Generar una ruta única para el archivo en Firebase Storage
      const timestamp = Date.now();
      const folderPath = currentFolder ? `${currentFolder.id}/` : '';
      const extension = selectedFile.name.split('.').pop();
      const storagePath = `files/${folderPath}${timestamp}_${selectedFile.name}`;
      
      // Subir archivo a Firebase Storage
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, selectedFile);
      
      // Obtener URL de descarga
      const downloadURL = await getDownloadURL(storageRef);
      
      // Crear elemento de archivo en Firestore
      const newFile: Omit<FileItem, 'id' | 'createdAt' | 'updatedAt'> = {
        name: newItemName.trim(),
        type: 'file',
        parentId: currentFolder ? currentFolder.id : null,
        url: downloadURL,
        contentType: selectedFile.type,
        size: selectedFile.size,
        order: fileItems.filter(item => item.parentId === (currentFolder ? currentFolder.id : null)).length,
      };
      
      const newFileId = await createFileItem(newFile);
      
      if (newFileId) {
        toast.success('Archivo subido con éxito');
        
        // Actualizar estado local
        const updatedItem: FileItem = {
          ...newFile,
          id: newFileId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const updatedItems = [...fileItems, updatedItem];
        setFileItems(updatedItems);
        setFileTree(buildFileTree(updatedItems));
        
        // Cerrar diálogo y resetear formulario
        setIsUploadDialogOpen(false);
        resetForm();
      } else {
        toast.error('Error al registrar el archivo');
      }
    } catch (error) {
      console.error('Error al subir archivo:', error);
      toast.error('Error al subir el archivo');
    }
  };

  // Actualizar elemento
  const handleUpdateItem = async () => {
    if (!itemToEdit || !newItemName.trim()) {
      toast.error('Datos incompletos');
      return;
    }
    
    try {
      const updatedItem: Partial<Omit<FileItem, 'id' | 'createdAt' | 'updatedAt'>> = {
        name: newItemName.trim(),
      };
      
      const success = await updateFileItem(itemToEdit.id, updatedItem);
      
      if (success) {
        toast.success('Elemento actualizado con éxito');
        
        // Actualizar estado local
        const updatedItems = fileItems.map(item => 
          item.id === itemToEdit.id ? {...item, ...updatedItem, updatedAt: new Date()} : item
        );
        setFileItems(updatedItems);
        setFileTree(buildFileTree(updatedItems));
        
        // Cerrar diálogo y resetear formulario
        setIsEditDialogOpen(false);
        setItemToEdit(null);
        resetForm();
      } else {
        toast.error('Error al actualizar el elemento');
      }
    } catch (error) {
      console.error('Error al actualizar elemento:', error);
      toast.error('Error al actualizar el elemento');
    }
  };

  // Eliminar elemento
  const handleDeleteItem = async () => {
    if (!itemToDelete) {
      return;
    }
    
    try {
      // Si es un archivo, eliminar de Firebase Storage
      if (itemToDelete.type === 'file' && itemToDelete.url) {
        try {
          // Extraer la ruta del archivo de la URL
          const urlObj = new URL(itemToDelete.url);
          const pathname = urlObj.pathname;
          const storagePath = pathname.split('/o/')[1];
          
          if (storagePath) {
            // Decodificar la URL y eliminar el archivo
            const decodedPath = decodeURIComponent(storagePath);
            const fileRef = ref(storage, decodedPath);
            await deleteObject(fileRef);
          }
        } catch (storageError) {
          console.error('Error al eliminar archivo de Storage:', storageError);
          // Continuar con la eliminación en Firestore incluso si falla en Storage
        }
      }
      
      const success = await deleteFileItem(itemToDelete.id);
      
      if (success) {
        toast.success(`Elemento "${itemToDelete.name}" eliminado con éxito`);
        
        // Actualizar estado local - eliminar el elemento y sus hijos
        const getChildrenIds = (parentId: string): string[] => {
          const childrenIds = fileItems
            .filter(item => item.parentId === parentId)
            .map(item => item.id);
          
          return [
            ...childrenIds,
            ...childrenIds.flatMap(childId => getChildrenIds(childId))
          ];
        };
        
        const idsToRemove = [itemToDelete.id, ...getChildrenIds(itemToDelete.id)];
        const updatedItems = fileItems.filter(item => !idsToRemove.includes(item.id));
        
        setFileItems(updatedItems);
        setFileTree(buildFileTree(updatedItems));
        
        // Cerrar diálogo
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
      } else {
        toast.error('Error al eliminar el elemento');
      }
    } catch (error) {
      console.error('Error al eliminar elemento:', error);
      toast.error('Error al eliminar el elemento');
    }
  };

  // Mover elemento hacia arriba
  const handleMoveUp = async (item: FileItem) => {
    // Encontrar elementos en el mismo nivel
    const siblingItems = fileItems.filter(i => i.parentId === item.parentId)
      .sort((a, b) => a.order - b.order);
    
    const currentIndex = siblingItems.findIndex(i => i.id === item.id);
    if (currentIndex <= 0) return; // Ya está en la parte superior
    
    const prevItem = siblingItems[currentIndex - 1];
    
    try {
      // Intercambiar el orden con el elemento anterior
      await updateFileItem(item.id, { order: prevItem.order });
      await updateFileItem(prevItem.id, { order: item.order });
      
      // Actualizar estado local
      const updatedItems = fileItems.map(i => {
        if (i.id === item.id) return { ...i, order: prevItem.order, updatedAt: new Date() };
        if (i.id === prevItem.id) return { ...i, order: item.order, updatedAt: new Date() };
        return i;
      });
      
      setFileItems(updatedItems);
      setFileTree(buildFileTree(updatedItems));
      
      toast.success('Elemento movido hacia arriba');
    } catch (error) {
      console.error('Error al mover elemento:', error);
      toast.error('Error al mover el elemento');
    }
  };

  // Mover elemento hacia abajo
  const handleMoveDown = async (item: FileItem) => {
    // Encontrar elementos en el mismo nivel
    const siblingItems = fileItems.filter(i => i.parentId === item.parentId)
      .sort((a, b) => a.order - b.order);
    
    const currentIndex = siblingItems.findIndex(i => i.id === item.id);
    if (currentIndex >= siblingItems.length - 1) return; // Ya está en la parte inferior
    
    const nextItem = siblingItems[currentIndex + 1];
    
    try {
      // Intercambiar el orden con el elemento siguiente
      await updateFileItem(item.id, { order: nextItem.order });
      await updateFileItem(nextItem.id, { order: item.order });
      
      // Actualizar estado local
      const updatedItems = fileItems.map(i => {
        if (i.id === item.id) return { ...i, order: nextItem.order, updatedAt: new Date() };
        if (i.id === nextItem.id) return { ...i, order: item.order, updatedAt: new Date() };
        return i;
      });
      
      setFileItems(updatedItems);
      setFileTree(buildFileTree(updatedItems));
      
      toast.success('Elemento movido hacia abajo');
    } catch (error) {
      console.error('Error al mover elemento:', error);
      toast.error('Error al mover el elemento');
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number | null | undefined) => {
    if (bytes === null || bytes === undefined) return 'Desconocido';
    
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <AdminRoute>
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gestión de Archivos</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                resetForm();
                setIsAddDialogOpen(true);
              }}
            >
              <Folder className="w-4 h-4" /> Nueva Carpeta
            </Button>
            <Button
              className="gap-2"
              onClick={() => {
                resetForm();
                setIsUploadDialogOpen(true);
              }}
            >
              <Upload className="w-4 h-4" /> Subir Archivo
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-primary" /> 
              <span>Archivos y Carpetas</span>
            </CardTitle>
            <CardDescription>
              Organiza tus archivos y medios
            </CardDescription>
            
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 mt-4 text-sm">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2"
                onClick={() => navigateToFolder(null)}
              >
                <FolderOpen className="w-4 h-4 mr-1" /> Raíz
              </Button>
              
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={item.id}>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => navigateToFolder(item)}
                  >
                    {item.name}
                  </Button>
                </React.Fragment>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Cargando archivos...</div>
            ) : error ? (
              <div className="text-center py-4 text-red-500">{error}</div>
            ) : (
              <div className="border rounded-md">
                <div className="grid grid-cols-[1fr_100px_80px] md:grid-cols-[1fr_150px_100px_150px] gap-4 p-3 border-b bg-muted/50 font-medium">
                  <div>Nombre</div>
                  <div className="hidden md:block">Tamaño</div>
                  <div className="hidden md:block">Tipo</div>
                  <div className="text-right">Acciones</div>
                </div>
                
                {getCurrentFolderItems().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay elementos en esta carpeta
                  </div>
                ) : (
                  getCurrentFolderItems().map(item => (
                    <div 
                      key={item.id} 
                      className="grid grid-cols-[1fr_100px_80px] md:grid-cols-[1fr_150px_100px_150px] gap-4 p-3 border-b hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        {item.type === 'folder' ? (
                          <>
                            <Folder className="w-4 h-4 text-primary" />
                            <button 
                              className="font-medium hover:underline"
                              onClick={() => navigateToFolder(item)}
                            >
                              {item.name}
                            </button>
                          </>
                        ) : (
                          <>
                            <File className="w-4 h-4 text-primary" />
                            <div className="font-medium">
                              {item.name}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="hidden md:block">
                        {item.type === 'file' ? formatFileSize(item.size) : '—'}
                      </div>
                      <div className="hidden md:block">
                        {item.type === 'file' ? 
                          (item.contentType ? item.contentType.split('/')[1]?.toUpperCase() : 'Archivo') : 
                          'Carpeta'}
                      </div>
                      <div className="flex justify-end gap-1">
                        {item.type === 'file' && item.url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            asChild
                          >
                            <a href={item.url} target="_blank" rel="noopener noreferrer" title="Descargar">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
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
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diálogo para crear nueva carpeta */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva Carpeta</DialogTitle>
              <DialogDescription>
                Crea una nueva carpeta en la ubicación actual
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="folder-name" className="text-sm font-medium">Nombre de la carpeta</label>
                <Input
                  id="folder-name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Nombre de la carpeta"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateFolder}>
                Crear Carpeta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo para subir archivo */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Archivo</DialogTitle>
              <DialogDescription>
                Sube un archivo a la ubicación actual
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file-name">Nombre del archivo</Label>
                <Input
                  id="file-name"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Nombre que se mostrará"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="file-upload">Archivo</Label>
                <Input
                  id="file-upload"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      // Si no se ha establecido un nombre, usar el nombre del archivo
                      if (!newItemName) {
                        // Eliminar la extensión del nombre del archivo
                        const fileName = file.name.split('.').slice(0, -1).join('.');
                        setNewItemName(fileName);
                      }
                    }
                  }}
                />
              </div>
              
              {uploadProgress > 0 && (
                <div className="mt-2">
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-right mt-1">{uploadProgress}%</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUploadFile} disabled={!selectedFile}>
                Subir Archivo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo para editar */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar {itemToEdit?.type === 'folder' ? 'Carpeta' : 'Archivo'}</DialogTitle>
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

        {/* Diálogo para eliminar */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>¿Estás seguro?</DialogTitle>
              <DialogDescription>
                {itemToDelete?.type === 'folder' ? (
                  <>Esta acción eliminará permanentemente la carpeta &quot;{itemToDelete?.name}&quot; y todo su contenido.</>
                ) : (
                  <>Esta acción eliminará permanentemente el archivo &quot;{itemToDelete?.name}&quot;.</>
                )}
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
