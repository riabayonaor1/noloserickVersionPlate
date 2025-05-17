'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getFileItems, buildFileTree, FileItem } from '@/lib/firestoreService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, File, Folder, Eye, Download, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function PublicFileViewer() {
  const params = useParams();
  const router = useRouter();
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [folderTree, setFolderTree] = useState<FileItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FileItem | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const folderId = params.folderId ? String(params.folderId) : null;
  
  useEffect(() => {
    const fetchFileItems = async () => {
      try {
        setLoading(true);
        const items = await getFileItems();
        setFileItems(items);
        
        // Construir árbol de carpetas
        const tree = buildFileTree(items);
        setFolderTree(tree);
        
        // Encontrar la carpeta actual
        if (folderId) {
          const folder = items.find(item => item.id === folderId);
          setCurrentFolder(folder || null);
          
          // Construir ruta de breadcrumbs
          const breadcrumbPath: FileItem[] = [];
          let currentFolderId = folder?.parentId;
          
          while (currentFolderId) {
            const parentFolder = items.find(item => item.id === currentFolderId);
            if (parentFolder) {
              breadcrumbPath.unshift(parentFolder);
              currentFolderId = parentFolder.parentId;
            } else {
              currentFolderId = null;
            }
          }
          
          setBreadcrumbs(breadcrumbPath);
        } else {
          setCurrentFolder(null);
          setBreadcrumbs([]);
        }
      } catch (error) {
        console.error('Error al cargar los archivos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFileItems();
  }, [folderId]);
  
  // Obtener los elementos de la carpeta actual
  const getCurrentFolderItems = () => {
    if (folderId) {
      return fileItems.filter(item => item.parentId === folderId);
    } else {
      return fileItems.filter(item => item.parentId === null);
    }
  };
  
  // Formatear tamaño de archivo
  const formatFileSize = (size?: number | null) => {
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
  
  if (loading) {
    return <div className="container mx-auto p-4 flex justify-center">Cargando archivos...</div>;
  }
  
  const folderItems = getCurrentFolderItems();
  const folders = folderItems.filter(item => item.type === 'folder').sort((a, b) => a.name.localeCompare(b.name));
  const files = folderItems.filter(item => item.type === 'file').sort((a, b) => a.name.localeCompare(b.name));
  
  return (
    <div className="container mx-auto p-4">
      <div className="bg-muted p-4 rounded-lg mb-6">
        <h1 className="text-3xl font-bold mb-2">Archivos</h1>
        <p className="text-muted-foreground mb-4">
          Aquí encontrará todos los archivos públicos disponibles para descargar o visualizar organizados por categorías.
        </p>
        
        <div className="bg-background p-3 rounded-md border">
          <div className="flex items-center space-x-2">
            <Link href="/archivos" className="text-sm hover:underline">
              Inicio
            </Link>
            
            {breadcrumbs.map((folder) => (
              <div key={folder.id} className="flex items-center">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <Link href={`/archivos/${folder.id}`} className="text-sm hover:underline ml-1">
                  {folder.name}
                </Link>
              </div>
            ))}
            
            {currentFolder && (
              <div className="flex items-center">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm ml-1 text-muted-foreground font-medium">
                  {currentFolder.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {currentFolder && (
        <Button 
          variant="outline" 
          className="mb-4"
          onClick={() => {
            if (currentFolder.parentId) {
              router.push(`/archivos/${currentFolder.parentId}`);
            } else {
              router.push('/archivos');
            }
          }}
        >
          <ChevronLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {folders.length === 0 && files.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Esta carpeta está vacía.</p>
          </div>
        ) : (
          <>
            {folders.map(folder => (
              <Link key={folder.id} href={`/archivos/${folder.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <Folder className="h-5 w-5 text-orange-500 mr-2" />
                      <CardTitle className="text-base">{folder.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Carpeta</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
            
            {files.map(file => (
              <Card key={file.id} className="hover:bg-muted/50 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <File className="h-5 w-5 text-blue-500 mr-2" />
                    <CardTitle className="text-base">{file.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-2">
                    {formatFileSize(file.size)}
                  </CardDescription>
                  <div className="flex gap-2">
                    {file.url && (
                      <>
                        <Button variant="outline" size="sm" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4 mr-1" /> Ver
                          </a>
                        </Button>
                        <Button variant="default" size="sm" asChild>
                          <a href={file.url} download={file.name}>
                            <Download className="h-4 w-4 mr-1" /> Descargar
                          </a>
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
