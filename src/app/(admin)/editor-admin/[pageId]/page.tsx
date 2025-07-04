"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminEditorWrapper } from '@/components/custom/AdminEditorWrapper';
import { getPageById, updatePage, Page } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';
import { Value } from '@udecode/plate'; // Changed TValue to Value
import { toast } from 'sonner';

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const { currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialPageData, setInitialPageData] = useState<Page | null>(null);

  const pageId = typeof params.pageId === 'string' ? params.pageId : null;

  useEffect(() => {
    if (!pageId) {
      toast.error('ID de página no válido.');
      router.push('/admin/editor-admin'); // Redirect if no ID (path updated)
      return;
    }

    const fetchPageData = async () => {
      setIsLoading(true);
      try {
        const page = await getPageById(pageId);
        if (page) {
          setInitialPageData(page);
        } else {
          toast.error('Página no encontrada.');
          router.push('/admin/editor-admin'); // path updated
        }
      } catch (error) {
        console.error('Error fetching page for editing:', error);
        toast.error('Error al cargar la página para editar.');
        router.push('/admin/editor-admin'); // path updated
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageData();
  }, [pageId, router]);

  const handleUpdatePage = async (content: Value, title: string) => { // Changed TValue to Value
    if (!currentUser || !currentUser.email) {
      toast.error('Debes estar autenticado para actualizar una página.');
      return;
    }
    if (!pageId) {
        toast.error('ID de página no válido para la actualización.');
        return;
    }
    if (!title.trim()) {
        toast.error('El título de la página no puede estar vacío.');
        return;
    }

    setIsSaving(true);
    try {
      const pageDataToUpdate: Partial<Omit<Page, 'id' | 'createdAt'>> = {
        title,
        content: content, // Content is Value, firestoreService will serialize
        authorId: currentUser.uid, // Update author if needed, or keep original
        authorEmail: currentUser.email,
        // slug will be updated by firestoreService if title changes and no slug is provided
      };
      
      const success = await updatePage(pageId, pageDataToUpdate);
      if (success) {
        toast.success('Página actualizada con éxito!');
        // Optionally, refetch or update local state if needed, or rely on navigation
        // router.push(`/pages/${initialPageData?.slug || ''}`); // Navigate to public view or stay
      } else {
        toast.error('Error al actualizar la página.');
      }
    } catch (error) {
      console.error('Error updating page:', error);
      toast.error('Error al actualizar la página.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Cargando editor...</p></div>;
  }

  if (!initialPageData) {
    // This case should ideally be handled by the redirect in useEffect
    return <div className="flex justify-center items-center h-screen"><p>No se pudo cargar la página.</p></div>;
  }

  const emptyPlateValue: Value = [{ type: 'p', children: [{ text: '' }] }];
  let parsedInitialValue: Value;

  try {
    if (initialPageData.content && typeof initialPageData.content === 'string' && initialPageData.content.trim() !== '') {
      parsedInitialValue = JSON.parse(initialPageData.content);
    } else if (initialPageData.content && typeof initialPageData.content === 'object') {
      // Fallback if content is already an object (though typed as string)
      parsedInitialValue = initialPageData.content as Value;
    }
     else {
      parsedInitialValue = emptyPlateValue;
    }
  } catch (error) {
    console.error('Error parsing initialPageData.content for editor:', error);
    toast.error('Error al cargar el contenido previo, se usará un editor vacío.');
    parsedInitialValue = emptyPlateValue;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Editar Página</h1>
      <AdminEditorWrapper 
        initialValue={parsedInitialValue}
        pageTitle={initialPageData.title}
        onSave={handleUpdatePage} 
        isSaving={isSaving}
      />
    </div>
  );
}
