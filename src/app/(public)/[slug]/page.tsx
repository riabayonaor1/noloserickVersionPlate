import { getAllPages, getPageBySlug } from '@/lib/firestoreService';
import DynamicPageClient from '@/components/page/DynamicPageClient';

// Esta función permanece en el archivo del servidor
export async function generateStaticParams() {
  try {
    // Obtener todas las páginas disponibles
    const pages = await getAllPages();
    
    // Transformar las páginas en un array de parámetros con sus slugs
    return pages.map((page) => ({
      slug: page.slug,
    }));
  } catch (error) {
    console.error('Error al generar parámetros estáticos:', error);
    // Si hay un error, devolver al menos un slug por defecto
    return [{ slug: 'home' }];
  }
}

// Carga los datos iniciales en el servidor si es posible
export default async function DynamicPage({ params }: { params: { slug: string } }) {
  // Extraer el slug de params antes de usarlo
  const slug = params?.slug;
  let initialPageData: any = null;
  let initialError: string | null = null;

  try {
    // Intentamos obtener los datos de la página en el servidor
    initialPageData = await getPageBySlug(slug);
    if (!initialPageData) {
      initialError = 'Página no encontrada';
    }
  } catch (error) {
    console.error('Error al cargar la página en el servidor:', error);
    initialError = 'Error al cargar la página';
  }

  // Renderizamos el componente cliente pasando los datos iniciales
  return (
    <DynamicPageClient 
      slug={slug} 
      initialPageData={initialPageData} 
      initialError={initialError}
    />
  );
}
