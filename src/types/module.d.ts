// Declaraciones de tipos para módulos personalizados
declare module '@/components/ui/button' {
  export const Button: React.FC<{
    children: React.ReactNode;
    onClick?: () => void;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
    asChild?: boolean;
    [key: string]: any;
  }>;
}

declare module '@/contexts/AuthContext' {
  export const useAuth: () => {
    currentUser: any;
    isAdmin: boolean;
    loading: boolean;
    login?: (email: string, password: string) => Promise<any>;
    logout?: () => Promise<void>;
    register?: (email: string, password: string) => Promise<any>;
  };
  
  export const AuthProvider: React.FC<{ children: React.ReactNode }>;
}

declare module '@/lib/firestoreService' {
  export interface Page {
    id: string;
    title: string;
    content: string;
    color: string;
    titleColor: string;
    layout: string;
    animation: string;
    isPublished: boolean;
    createdAt: any;
    updatedAt: any;
    [key: string]: any;
  }
  
  export const getPageBySlug: (slug: string) => Promise<Page | null>;
  export const getPageById: (id: string) => Promise<Page | null>;
  export const updatePage: (id: string, data: Partial<Page>) => Promise<boolean>;
  export const createPage: (data: Partial<Page>) => Promise<string | null>;
}

declare module '@/components/editor/use-create-editor' {
  import { PlateEditor } from '@udecode/plate';
  export const useCreateEditor: () => PlateEditor;
}

declare module '@/components/ui/editor' {
  export const Editor: React.FC<{
    variant?: string;
    readOnly?: boolean;
    [key: string]: any;
  }>;
  
  export const EditorContainer: React.FC<{
    children: React.ReactNode;
    [key: string]: any;
  }>;
}

declare module '@/components/editor/plate-editor' {
  export const PlateEditor: React.FC<{
    initialValue?: any;
    onChange?: (value: any) => void;
    readOnly?: boolean;
    [key: string]: any;
  }>;
}

declare module '@/components/editor/settings' {
  export const SettingsProvider: React.FC<{
    children: React.ReactNode;
    [key: string]: any;
  }>;
  
  export const useSettings: () => {
    settings: any;
    setSetting: (key: string, value: any) => void;
  };
}

declare module '@/lib/converters' {
  import { Value } from '@udecode/plate';
  
  export const PlateExporter: {
    toHtml: (content: Value) => string;
    toMarkdown: (content: Value) => string;
    toText: (content: Value) => string;
  };
  
  export const PlateImporter: {
    fromHtml: (html: string) => Value;
    fromMarkdown: (markdown: string) => Value;
  };
}

declare module '@/lib/utils' {
  import { ClassValue } from 'clsx';
  export function cn(...inputs: ClassValue[]): string;
}
