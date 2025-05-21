"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPageBySlug, Page } from '@/lib/firestoreService';
import { PageRenderer } from '@/components/custom/PageRenderer'; // Component to render Plate content
import { Value } from '@udecode/plate'; // Changed TValue to Value

export default function ViewPage() {
  const params = useParams();
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  const slug = typeof params.slug === 'string' ? params.slug : null;

  useEffect(() => {
    if (!slug) {
      // router.push('/'); // Or a 404 page
      setLoading(false);
      return;
    }

    const fetchPage = async () => {
      setLoading(true);
      try {
        const pageData = await getPageBySlug(slug);
        if (pageData) {
          setPage(pageData);
        } else {
          // Handle page not found, e.g., redirect to a 404 page or show a message
          console.log("Page not found for slug:", slug);
          // router.push('/404'); // Example: redirect to a 404 page
        }
      } catch (error) {
        console.error('Error fetching page by slug:', error);
        // Handle error, e.g., show an error message
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug, router]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Cargando página...</p></div>;
  }

  if (!page) {
    return <div className="flex justify-center items-center h-screen"><p>Página no encontrada.</p></div>;
  }

  const emptyPlateValue: Value = [{ type: 'p', children: [{ text: '' }] }];
  let parsedContent: Value;

  try {
    if (page.content && typeof page.content === 'string' && page.content.trim() !== '') {
      parsedContent = JSON.parse(page.content);
    } else if (page.content && typeof page.content === 'object') {
      // Fallback if content is already an object (though typed as string)
      parsedContent = page.content as Value;
    }
     else {
      parsedContent = emptyPlateValue;
    }
  } catch (error) {
    console.error('Error parsing page.content for PageRenderer:', error);
    // Consider adding a toast notification here if context allows
    parsedContent = emptyPlateValue;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-2 text-center">{page.title}</h1>
      {page.authorEmail && page.createdAt && (
        <p className="text-sm text-muted-foreground text-center mb-6">
          Publicado por {page.authorEmail} el {new Date(page.createdAt.seconds * 1000).toLocaleDateString()}
        </p>
      )}
      <div className="max-w-4xl mx-auto">
        <PageRenderer content={parsedContent} />
      </div>
    </div>
  );
}

