"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminEditorWrapper } from '@/components/custom/AdminEditorWrapper';
import { createPage, Page } from '@/lib/firestoreService';
import { useAuth } from '@/contexts/AuthContext';
import { Value } from '@udecode/plate'; // Changed TValue to Value
import { toast } from 'sonner';

export default function CreatePage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePage = async (content: Value, title: string) => { // Changed TValue to Value
    if (!currentUser || !currentUser.email) {
      toast.error('Debes estar autenticado para crear una página.');
      return;
    }
    if (!title.trim()) {
        toast.error('El título de la página no puede estar vacío.');
        return;
    }

    setIsSaving(true);
    try {
      const pageData: Omit<Page, 'id' | 'createdAt' | 'updatedAt' | 'slug'> = {
        title,
        content: content, // Content is already Value, firestoreService will serialize
        authorId: currentUser.uid,
        authorEmail: currentUser.email,
        isPublic: true, // Default to public
      };
      const pageId = await createPage(pageData);
      if (pageId) {
        toast.success('Página creada con éxito!');
        router.push(`/admin/editor-admin/${pageId}`); // Actualizado para usar la nueva ruta
      } else {
        toast.error('Error al crear la página.');
      }
    } catch (error) {
      console.error('Error creating page:', error);
      toast.error('Error al crear la página.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Crear Nueva Página</h1>
      <AdminEditorWrapper onSave={handleSavePage} isSaving={isSaving} />
    </div>
  );
}
