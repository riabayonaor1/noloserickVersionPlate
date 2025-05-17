'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { getPageBySlug } from '@/lib/firestoreService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { plateToHtml } from '@/lib/converters/plateToHtml';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TestPageRender() {
  const params = useParams();
  const [pageContent, setPageContent] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams?.get('slug') || 'productos-notables-clase';
  
  // Cargar la página y generar el HTML
  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const pageData = await getPageBySlug(slug);
        if (!pageData) {
          setError(`No se encontró la página con slug: ${slug}`);
          return;
        }
        
        // Guardar el contenido JSON
        try {
          const contentJSON = typeof pageData.content === 'string' 
            ? JSON.parse(pageData.content)
            : pageData.content;
          setPageContent(contentJSON);
          
          // Generar el HTML con plateToHtml
          const html = plateToHtml(contentJSON);
          setHtmlContent(html);
        } catch (err) {
          setError(`Error al procesar el contenido: ${err instanceof Error ? err.message : String(err)}`);
        }
      } catch (err) {
        setError(`Error al cargar la página: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPage();
  }, [slug]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Test de Renderizado</h1>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href={`/${slug}`} target="_blank">
              Ver en ruta /{slug}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/" target="_blank">
              Ver página de inicio
            </Link>
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">
          <p className="text-blue-500">Cargando contenido...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Renderizado con plateToHtml</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                id="plate-content-viewer"
                className="prose dark:prose-invert max-w-none plate-content-view"
                dangerouslySetInnerHTML={{ __html: htmlContent }} 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>JSON de contenido</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto p-2 bg-gray-50 dark:bg-slate-800 rounded">
                {JSON.stringify(pageContent, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
