'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getPageBySlug, getAllPages } from '@/lib/firestoreService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import DebugPlateView from '@/components/custom/DebugPlateView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DebugPage() {
  const [slug, setSlug] = useState<string>('');
  const [allPages, setAllPages] = useState<{ id: string; title: string; slug: string }[]>([]);
  const [pageContent, setPageContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Cargar todas las páginas disponibles
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const pages = await getAllPages();
        setAllPages(pages.map(page => ({
          id: page.id,
          title: page.title,
          slug: page.slug
        })));
      } catch (e) {
        console.error('Error al cargar las páginas:', e);
      }
    };
    
    fetchPages();
    
    // Cargar slug desde query params si existe
    const slugParam = searchParams?.get('slug');
    if (slugParam) {
      setSlug(slugParam);
      fetchPageContent(slugParam);
    }
  }, [searchParams]);
  
  const fetchPageContent = async (pageSlug: string) => {
    if (!pageSlug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const page = await getPageBySlug(pageSlug);
      if (page) {
        setPageContent(page.content);
      } else {
        setError(`No se encontró la página con slug: ${pageSlug}`);
        setPageContent(null);
      }
    } catch (e) {
      console.error('Error al cargar el contenido de la página:', e);
      setError(`Error al cargar la página: ${e instanceof Error ? e.message : 'Error desconocido'}`);
      setPageContent(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectPage = (selectedSlug: string) => {
    setSlug(selectedSlug);
    router.push(`/debug?slug=${selectedSlug}`);
    fetchPageContent(selectedSlug);
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Debug de Renderizado de Plate</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Página</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pageSelect">Páginas disponibles</Label>
                <Select value={slug} onValueChange={handleSelectPage}>
                  <SelectTrigger id="pageSelect">
                    <SelectValue placeholder="Seleccionar una página" />
                  </SelectTrigger>
                  <SelectContent>
                    {allPages.map(page => (
                      <SelectItem key={page.id} value={page.slug}>
                        {page.title} ({page.slug})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                >
                  <Link href={`/${slug}`} target="_blank">
                    Ver en ruta dinámica
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                >
                  <Link href={`/pagina/${slug}`} target="_blank">
                    Ver en /pagina/[slug]
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <div className="text-blue-500">Cargando...</div>}
            {error && <div className="text-red-500">{error}</div>}
            {!loading && !error && slug && (
              <div className="text-green-500">
                Página cargada: {slug}
                <div className="text-xs text-gray-500 mt-1">
                  Tamaño del contenido: {pageContent ? JSON.stringify(pageContent).length : 0} caracteres
                </div>
              </div>
            )}
            {!loading && !error && !slug && (
              <div className="text-gray-500">Selecciona una página para comenzar</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {pageContent && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Visualización del contenido</h2>
          <Tabs defaultValue="preview">
            <TabsList className="mb-4">
              <TabsTrigger value="preview">Vista previa</TabsTrigger>
              <TabsTrigger value="debug">Debug</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview">
              <Card>
                <CardHeader>
                  <CardTitle>Vista previa</CardTitle>
                </CardHeader>
                <CardContent className="prose max-w-none dark:prose-invert">
                  <div className="plate-content-view">
                    <DebugPlateView content={pageContent} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="debug">
              <Card>
                <CardHeader>
                  <CardTitle>Contenido JSON</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs overflow-auto p-4 bg-gray-50 dark:bg-slate-800 rounded">
                    {JSON.stringify(JSON.parse(pageContent), null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
