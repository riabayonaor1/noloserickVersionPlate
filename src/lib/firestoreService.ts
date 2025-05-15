import { db } from './firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  orderBy, 
  Timestamp, 
  deleteDoc,
  writeBatch,
  limit
} from 'firebase/firestore';

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  color?: string;
  titleColor?: string;
  layout?: string;
  animation?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Obtener todas las páginas públicas para el menú de navegación
export const getPublicPages = async (): Promise<Page[]> => {
  try {
    const pagesRef = collection(db, 'pages');
    
    // Modificado para evitar error de índice - Elimina el orderBy hasta que el índice esté listo
    // const q = query(pagesRef, where('isPublished', '==', true), orderBy('title'));
    
    // Versión temporal sin ordenación
    const q = query(pagesRef, where('isPublished', '==', true), limit(100));
    
    const querySnapshot = await getDocs(q);
    
    const pages = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        slug: data.slug || '',
        content: data.content || '',
        isPublished: data.isPublished || false,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
        color: data.color || '#ffffff',
        titleColor: data.titleColor || '#000000',
        layout: data.layout || 'default',
        animation: data.animation || 'none'
      };
    });
    
    // Ordenar manualmente por título en lugar de usar orderBy
    return pages.sort((a, b) => a.title.localeCompare(b.title));
  } catch (error) {
    console.error('Error al obtener páginas públicas:', error);
    return [];
  }
};

// Obtener todas las páginas para el administrador
export const getAllPages = async (): Promise<Page[]> => {
  try {
    const pagesRef = collection(db, 'pages');
    
    // Modificado para evitar error de índice
    // const q = query(pagesRef, orderBy('title'));
    
    // Versión temporal sin ordenación
    const q = query(pagesRef, limit(100));
    
    const querySnapshot = await getDocs(q);
    
    const pages = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        slug: data.slug || '',
        content: data.content || '',
        isPublished: data.isPublished || false,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
        color: data.color || '#ffffff',
        titleColor: data.titleColor || '#000000',
        layout: data.layout || 'default',
        animation: data.animation || 'none'
      };
    });
    
    // Ordenar manualmente por título en lugar de usar orderBy
    return pages.sort((a, b) => a.title.localeCompare(b.title));
  } catch (error) {
    console.error('Error al obtener todas las páginas:', error);
    return [];
  }
};

// Resto del archivo se mantiene igual

// Obtener una página por su slug
export const getPageBySlug = async (slug: string): Promise<Page | null> => {
  try {
    const pagesRef = collection(db, 'pages');
    const q = query(pagesRef, where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Registrar que la página no se encontró
      console.warn(`Página con slug '${slug}' no encontrada`);
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      title: data.title || '',
      slug: data.slug || '',
      content: data.content || '',
      isPublished: data.isPublished || false,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      color: data.color || '#ffffff',
      titleColor: data.titleColor || '#000000',
      layout: data.layout || 'default',
      animation: data.animation || 'none'
    };
  } catch (error) {
    console.error('Error al obtener página por slug:', error);
    return null;
  }
};

// Obtener una página por su ID
export const getPageById = async (id: string): Promise<Page | null> => {
  try {
    const docRef = doc(db, 'pages', id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    
    return {
      id: docSnap.id,
      title: data.title || '',
      slug: data.slug || '',
      content: data.content || '',
      isPublished: data.isPublished || false,
      createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      color: data.color || '#ffffff',
      titleColor: data.titleColor || '#000000',
      layout: data.layout || 'default',
      animation: data.animation || 'none'
    };
  } catch (error) {
    console.error('Error al obtener página por ID:', error);
    return null;
  }
};

// Crear una nueva página
export const createPage = async (pageData: Omit<Page, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  try {
    const newPage = {
      ...pageData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'pages'), newPage);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear página:', error);
    return null;
  }
};

// Actualizar una página existente
export const updatePage = async (id: string, pageData: Partial<Omit<Page, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'pages', id);
    await updateDoc(docRef, {
      ...pageData,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error al actualizar página:', error);
    return false;
  }
};

// Eliminar una página
export const deletePage = async (id: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'pages', id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error al eliminar página:', error);
    return false;
  }
};

// Estructuras para menú jerárquico
export interface MenuItem {
  id: string;
  name: string;
  type: 'folder' | 'page';
  parentId: string | null;
  pageId?: string | null;
  slug?: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  children?: MenuItem[];
}

// Obtener todos los elementos del menú
export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const menuItemsRef = collection(db, 'menuItems');
    
    // Modificar para evitar error de índice
    // const q = query(menuItemsRef, orderBy('order'));
    
    // Versión temporal sin ordenación
    const q = query(menuItemsRef, limit(100));
    
    const querySnapshot = await getDocs(q);
    
    const items = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        type: data.type || 'folder',
        parentId: data.parentId || null,
        pageId: data.pageId || null,
        slug: data.slug || null,
        order: data.order || 0,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
      };
    });
    
    // Ordenar manualmente por order en lugar de usar orderBy
    return items.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error al obtener elementos del menú:', error);
    return [];
  }
};

// Resto del archivo no cambia

// Función para construir el árbol de menú
export const buildMenuTree = (items: MenuItem[], parentId: string | null = null): MenuItem[] => {
  return items
    .filter(item => item.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map(item => ({
      ...item,
      children: buildMenuTree(items, item.id)
    }));
};

// Crear un elemento de menú
export const createMenuItem = async (menuItem: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  try {
    const newMenuItem = {
      ...menuItem,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'menuItems'), newMenuItem);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear elemento de menú:', error);
    return null;
  }
};

// Actualizar un elemento de menú
export const updateMenuItem = async (id: string, menuItem: Partial<Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'menuItems', id);
    await updateDoc(docRef, {
      ...menuItem,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error al actualizar elemento de menú:', error);
    return false;
  }
};

// Eliminar un elemento de menú y sus hijos
export const deleteMenuItem = async (id: string): Promise<boolean> => {
  try {
    // Primero obtenemos todos los elementos del menú
    const menuItems = await getMenuItems();
    
    // Función recursiva para encontrar todos los IDs a eliminar
    const findAllChildrenIds = (parentId: string): string[] => {
      const childrenIds = menuItems
        .filter(item => item.parentId === parentId)
        .map(item => item.id);
      
      return [
        ...childrenIds,
        ...childrenIds.flatMap(childId => findAllChildrenIds(childId))
      ];
    };
    
    // Obtenemos todos los IDs a eliminar (incluido el elemento actual)
    const idsToDelete = [id, ...findAllChildrenIds(id)];
    
    // Creamos un batch para eliminar todos los elementos de una vez
    const batch = writeBatch(db);
    idsToDelete.forEach(itemId => {
      batch.delete(doc(db, 'menuItems', itemId));
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error al eliminar elemento de menú:', error);
    return false;
  }
};

// Resto del archivo mantiene la misma implementación
// ...

// Obtener todos los elementos de archivos
export const getFileItems = async (): Promise<FileItem[]> => {
  try {
    const fileItemsRef = collection(db, 'fileItems');
    
    // Modificar para evitar error de índice
    // const q = query(fileItemsRef, orderBy('order'));
    
    // Versión temporal sin ordenación
    const q = query(fileItemsRef, limit(100));
    
    const querySnapshot = await getDocs(q);
    
    const items = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        type: data.type || 'folder',
        parentId: data.parentId || null,
        url: data.url || null,
        contentType: data.contentType || null,
        size: data.size || null,
        order: data.order || 0,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date()
      };
    });
    
    // Ordenar manualmente en lugar de usar orderBy
    return items.sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error al obtener elementos de archivos:', error);
    return [];
  }
};

// Structs del archivo original están intactos

export interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  parentId: string | null;
  url?: string | null;
  contentType?: string | null;
  size?: number | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  children?: FileItem[];
}

// Función para construir el árbol de archivos
export const buildFileTree = (items: FileItem[], parentId: string | null = null): FileItem[] => {
  return items
    .filter(item => item.parentId === parentId)
    .sort((a, b) => a.order - b.order)
    .map(item => ({
      ...item,
      children: buildFileTree(items, item.id)
    }));
};

// Crear un elemento de archivo
export const createFileItem = async (fileItem: Omit<FileItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  try {
    const newFileItem = {
      ...fileItem,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'fileItems'), newFileItem);
    return docRef.id;
  } catch (error) {
    console.error('Error al crear elemento de archivo:', error);
    return null;
  }
};

// Actualizar un elemento de archivo
export const updateFileItem = async (id: string, fileItem: Partial<Omit<FileItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> => {
  try {
    const docRef = doc(db, 'fileItems', id);
    await updateDoc(docRef, {
      ...fileItem,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error al actualizar elemento de archivo:', error);
    return false;
  }
};

// Eliminar un elemento de archivo y sus hijos
export const deleteFileItem = async (id: string): Promise<boolean> => {
  try {
    // Primero obtenemos todos los elementos de archivos
    const fileItems = await getFileItems();
    
    // Función recursiva para encontrar todos los IDs a eliminar
    const findAllChildrenIds = (parentId: string): string[] => {
      const childrenIds = fileItems
        .filter(item => item.parentId === parentId)
        .map(item => item.id);
      
      return [
        ...childrenIds,
        ...childrenIds.flatMap(childId => findAllChildrenIds(childId))
      ];
    };
    
    // Obtenemos todos los IDs a eliminar (incluido el elemento actual)
    const idsToDelete = [id, ...findAllChildrenIds(id)];
    
    // Creamos un batch para eliminar todos los elementos de una vez
    const batch = writeBatch(db);
    idsToDelete.forEach(itemId => {
      batch.delete(doc(db, 'fileItems', itemId));
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error al eliminar elemento de archivo:', error);
    return false;
  }
};
