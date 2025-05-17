/**
 * Exportación de convertidores para contenido de Plate utilizando las APIs nativas
 */

import type { 
  MyValue
} from '@/components/editor/plate-types';
import { createPlateEditor } from '@udecode/plate/react';

// Importaciones de configuraciones
import { basePlugins } from '@/config/plate-plugins';

// Importaciones necesarias de Plate
import {
  deserializeHtml,
  serializeHtml,
  type TElement
} from '@udecode/plate';

// Importando las funciones markdown desde paquetes específicos
import { deserializeMd, serializeMd } from '@udecode/plate-markdown';

// Importar la función existente de plateToHtml para la exportación
import { plateToHtml } from './plateToHtml';

// Re-exportar la función plateToHtml para que se pueda usar desde este punto central
export { plateToHtml };

/**
 * Objeto que contiene funciones para exportar contenido de Plate a diferentes formatos
 */
export const PlateConverters = {
  /**
   * Convierte contenido de Plate a HTML usando serializeHtml de Plate
   */
  toHtml: async (content: MyValue): Promise<string> => {
    if (!content || !Array.isArray(content)) {
      return '';
    }
    
    const editor = createPlateEditor({
      plugins: basePlugins,
      value: content,
    });
    
    return serializeHtml(editor, {
      components: {},
    });
  },
  
  /**
   * Convierte contenido de Plate a HTML usando plateToHtml personalizado
   */
  toCustomHtml: (content: MyValue | string): string => {
    try {
      // Si content es string, asumimos que es JSON serializado
      if (typeof content === 'string') {
        return plateToHtml(JSON.parse(content));
      }
      return plateToHtml(content);
    } catch (error) {
      console.error('Error al convertir a HTML personalizado:', error);
      return '';
    }
  },
  
  /**
   * Convierte contenido de Plate a Markdown
   */
  toMarkdown: (content: MyValue): string => {
    if (!content || !Array.isArray(content)) {
      return '';
    }
    
    const editor = createPlateEditor({
      plugins: basePlugins,
      value: content,
    });
    
    return serializeMd(editor);
  },
  
  /**
   * Convierte contenido de Plate a texto plano
   */
  toText: (content: MyValue): string => {
    if (!content || !Array.isArray(content)) {
      return '';
    }
    
    // Función recursiva para extraer texto de nodos
    const extractText = (nodes: any[]): string => {
      return nodes.map(node => {
        if (typeof node.text === 'string') {
          return node.text;
        }
        if (Array.isArray(node.children)) {
          return extractText(node.children);
        }
        return '';
      }).join('');
    };
    
    return extractText(content);
  }
};

/**
 * Objeto que contiene funciones para importar contenido a formato Plate
 */
export const PlateImporter = {
  /**
   * Convierte HTML a contenido de Plate
   */
  fromHtml: (html: string): MyValue => {
    if (!html) {
      return [{ type: 'p', children: [{ text: '' }] }];
    }
    
    const editor = createPlateEditor({
      plugins: basePlugins,
    });
    
    return deserializeHtml(editor, {
      element: html,
    }) as MyValue;
  },
  
  /**
   * Convierte Markdown a contenido de Plate
   */
  fromMarkdown: (markdown: string): MyValue => {
    if (!markdown) {
      return [{ type: 'p', children: [{ text: '' }] }];
    }
    
    const editor = createPlateEditor({
      plugins: basePlugins,
    });
    
    return deserializeMd(editor, markdown);
  }
};

// Importación para TipTap - Comentado hasta que se instalen las dependencias necesarias
// import { 
//   Editor, 
//   JSONContent, 
//   generateHTML, 
//   generateJSON, 
//   generateMarkdown 
// } from '@tiptap/core';
// La importación de TiptapTransformer ya no existe en @udecode/plate

/**
 * Tipos de exportación soportados
 */
export type ExportFormat = 'html' | 'markdown' | 'md';

/**
 * Clase utilitaria para exportar e importar contenido del editor Plate
 * utilizando las APIs nativas de Plate
 */
export class PlateExporter {
  // Constantes de tipo de elemento para usar en comparaciones
  static ELEMENT_TYPES = {
    PARAGRAPH: 'p',
    HEADING1: 'h1',
    HEADING2: 'h2',
    HEADING3: 'h3',
    HEADING4: 'h4',
    HEADING5: 'h5',
    HEADING6: 'h6',
    IMAGE: 'img',
    LINK: 'a',
    TABLE: 'table',
    TABLE_ROW: 'tr',
    TABLE_CELL: 'td',
    HORIZONTAL_RULE: 'hr',
    BLOCKQUOTE: 'blockquote',
    CODE_BLOCK: 'code_block'
  };

  // Constantes para marks
  static MARK_TYPES = {
    BOLD: 'bold',
    ITALIC: 'italic',
    UNDERLINE: 'underline'
  };

  /**
   * Crea un editor temporal para conversión
   * @returns Editor de Plate configurado
   */
  private static createTempEditor() {
    return createPlateEditor({
      plugins: basePlugins,
    });
  }

  /**
   * Convierte un elemento en HTML
   * @param element - Elemento a convertir
   * @returns String HTML
   */
  private static elementToHTML(element: TElement): string {
    try {
      // Implementación básica para la conversión a HTML
      switch (element.type) {
        case this.ELEMENT_TYPES.HEADING1:
        case this.ELEMENT_TYPES.HEADING2:
        case this.ELEMENT_TYPES.HEADING3:
        case this.ELEMENT_TYPES.HEADING4:
        case this.ELEMENT_TYPES.HEADING5:
        case this.ELEMENT_TYPES.HEADING6:
        case this.ELEMENT_TYPES.PARAGRAPH:
          return `<${element.type}>${this.convertChildren(element.children)}</${element.type}>`;
        case this.ELEMENT_TYPES.IMAGE:
          return `<img src="${(element as any).url}" alt="${(element as any).alt || ''}" />`;
        case this.ELEMENT_TYPES.LINK:
          return `<a href="${(element as any).url}" target="_blank">${this.convertChildren(element.children)}</a>`;
        case this.ELEMENT_TYPES.TABLE:
          return `<table border="1">${this.convertChildren(element.children)}</table>`;
        case this.ELEMENT_TYPES.TABLE_ROW:
          return `<tr>${this.convertChildren(element.children)}</tr>`;
        case this.ELEMENT_TYPES.TABLE_CELL:
          return `<td>${this.convertChildren(element.children)}</td>`;
        case this.ELEMENT_TYPES.HORIZONTAL_RULE:
          return `<hr />`;
        case this.ELEMENT_TYPES.BLOCKQUOTE:
          return `<blockquote>${this.convertChildren(element.children)}</blockquote>`;
        default:
          // Elemento genérico o desconocido
          return `<div>${this.convertChildren(element.children)}</div>`;
      }
    } catch (error) {
      console.error('Error al convertir elemento a HTML:', error);
      return '';
    }
  }

  /**
   * Convierte los hijos de un elemento a HTML
   * @param children - Hijos del elemento
   * @returns String HTML
   */
  private static convertChildren(children: any[]): string {
    if (!children || !Array.isArray(children)) return '';
    
    return children.map(child => {
      // Si es un nodo de texto
      if ('text' in child) {
        let text = child.text;
        
        // Aplicar formatos básicos si existen
        if (child[this.MARK_TYPES.BOLD]) text = `<strong>${text}</strong>`;
        if (child[this.MARK_TYPES.ITALIC]) text = `<em>${text}</em>`;
        if (child[this.MARK_TYPES.UNDERLINE]) text = `<u>${text}</u>`;
        
        return text;
      } 
      // Si es un elemento
      else if ('type' in child) {
        return this.elementToHTML(child as TElement);
      }
      
      return '';
    }).join('');
  }

  /**
   * Exporta contenido a HTML usando la API nativa de Plate
   * @param content - Contenido del editor
   * @returns Contenido en formato HTML
   */
  static toHTML(content: any): string {
    try {
      // Crear un editor temporal
      const editor = this.createTempEditor();

      // Si el contenido es string, intentar parsearlo
      const jsonContent = typeof content === 'string' ? JSON.parse(content) : content;
      
      // Configurar children en el editor
      editor.children = Array.isArray(jsonContent) ? jsonContent : [jsonContent];
      
      // Usar serializeHtml de Plate para convertir el contenido
      // Usamos un enfoque de tipado más seguro con satisfies para preservar el tipo
      const html = serializeHtml(editor, {
        components: {},
      });
      
      // Añadir el HTML en un documento completo con estilos
      return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.5;
      color: rgba(0, 0, 0, 0.9);
      margin: 0;
      padding: 1rem;
    }
    .content-wrapper {
      max-width: 800px;
      margin: 0 auto;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    h1 { font-size: 2.25rem; }
    h2 { font-size: 1.875rem; }
    h3 { font-size: 1.5rem; }
    h4 { font-size: 1.25rem; }
    h5 { font-size: 1.125rem; }
    h6 { font-size: 1rem; }
    p { margin-bottom: 1rem; }
    ul, ol { 
      margin-bottom: 1rem;
      padding-left: 1.5rem;
    }
    pre {
      background-color: #f5f5f5;
      padding: 0.75rem;
      border-radius: 0.25rem;
      overflow-x: auto;
    }
    code {
      font-family: monospace;
      background-color: #f5f5f5;
      padding: 0.15rem 0.3rem;
      border-radius: 0.25rem;
    }
    blockquote {
      border-left: 3px solid #e2e8f0;
      padding-left: 1rem;
      margin-left: 0;
      color: #4a5568;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }
    table th, table td {
      border: 1px solid #e2e8f0;
      padding: 0.5rem;
    }
    table th {
      background-color: #f7fafc;
    }
  </style>
</head>
<body>
  <div class="content-wrapper">
    ${html}
  </div>
</body>
</html>
      `;
    } catch (error) {
      console.error('Error al convertir a HTML:', error);
      return typeof content === 'string' ? content : JSON.stringify(content);
    }
  }

  /**
   * Exporta contenido a Markdown usando la API nativa de Plate
   * @param content - Contenido del editor
   * @returns Contenido en formato Markdown
   */
  static toMarkdown(content: any): string {
    try {
      // Crear un editor temporal
      const editor = this.createTempEditor();
      
      // Si el contenido es string, intentar parsearlo
      const jsonContent = typeof content === 'string' ? JSON.parse(content) : content;
      
      // Configurar children en el editor
      editor.children = Array.isArray(jsonContent) ? jsonContent : [jsonContent];
      
      // Usar la API nativa para serializar a Markdown
      return serializeMd(editor);
    } catch (error) {
      console.error('Error al convertir a Markdown:', error);
      return typeof content === 'string' ? content : JSON.stringify(content);
    }
  }

  /**
   * Importa contenido HTML a formato JSON de Plate
   * @param htmlContent - Contenido HTML
   * @returns Contenido en formato JSON de Plate
   */
  static fromHTML(htmlContent: string): MyValue {
    try {
      // Crear un editor temporal
      const editor = this.createTempEditor();
      
      // Crear un elemento HTML temporal para parsear el contenido
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      
      // Deserializar el contenido HTML
      const fragment = deserializeHtml(editor, {
        element: doc.body,
      }) as MyValue;
      
      return fragment;
    } catch (error) {
      console.error('Error al importar desde HTML:', error);
      return [{
        type: 'p',
        children: [{ text: htmlContent }],
      }];
    }
  }

  /**
   * Importa contenido Markdown a formato JSON de Plate
   * @param mdContent - Contenido Markdown
   * @returns Contenido en formato JSON de Plate
   */
  static fromMarkdown(mdContent: string): MyValue {
    try {
      // Crear un editor temporal
      const editor = this.createTempEditor();
      
      // Parsear el Markdown
      const fragment = deserializeMd(editor, mdContent);
      
      return fragment;
    } catch (error) {
      console.error('Error al importar desde Markdown:', error);
      return [{
        type: 'p',
        children: [{ text: mdContent }],
      }];
    }
  }

  /**
   * Exporta contenido al formato especificado
   * @param content - Contenido del editor
   * @param format - Formato de exportación
   * @returns Contenido en el formato especificado
   */
  static export(content: any, format: ExportFormat): string {
    switch (format) {
      case 'html':
        return this.toHTML(content);
      case 'markdown':
      case 'md':
        return this.toMarkdown(content);
      default:
        throw new Error(`Formato de exportación no soportado: ${format}`);
    }
  }
}