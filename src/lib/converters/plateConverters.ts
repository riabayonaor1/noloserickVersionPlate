/**
 * Exportación de convertidores para contenido de Plate utilizando las APIs nativas
 */

import { createPlateEditor } from '@udecode/plate/react';
import { Descendant, TElement, TNode, TText } from '@udecode/plate';

// Definir tipos necesarios
type MyValue = Descendant[];

// Importar la función existente de plateToHtml
import { plateToHtml } from './plateToHtml';

// Re-exportar la función plateToHtml para que se pueda usar desde este punto central
export { plateToHtml };

// Importaciones de remark
import { unified } from 'remark';
import remarkParse from 'remark-parse';
import { Node as RemarkNode, Parent as RemarkParent } from 'unist'; // Tipos de Remark

/**
 * Objeto que contiene funciones para exportar contenido de Plate a diferentes formatos
 */
export const PlateExporter = {
  /**
   * Convierte contenido de Plate a HTML usando plateToHtml personalizado
   */
  toHtml: (content: MyValue | string): string => {
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
   * (Versión simulada ya que no tenemos acceso completo a las APIs)
   */
  toMarkdown: (content: MyValue | string): string => {
    try {
      // Implementación básica para evitar errores
      const jsonContent = typeof content === 'string' ? JSON.parse(content) : content;
      
      // Función recursiva para extraer texto y simular markdown
      const extractText = (nodes: any[]): string => {
        if (!nodes || !Array.isArray(nodes)) return '';
        
        return nodes.map(node => {
          // Si es un nodo de texto
          if (node.text !== undefined) {
            let text = node.text;
            if (node.bold) text = `**${text}**`;
            if (node.italic) text = `*${text}*`;
            if (node.code) text = `\`${text}\``;
            return text;
          }
          
          // Si es un elemento con hijos
          if (node.children) {
            const innerText = extractText(node.children);
            
            switch (node.type) {
              case 'h1': return `# ${innerText}\n\n`;
              case 'h2': return `## ${innerText}\n\n`;
              case 'h3': return `### ${innerText}\n\n`;
              case 'h4': return `#### ${innerText}\n\n`;
              case 'h5': return `##### ${innerText}\n\n`;
              case 'h6': return `###### ${innerText}\n\n`;
              case 'blockquote': return `> ${innerText}\n\n`;
              case 'code_block': return `\`\`\`\n${innerText}\n\`\`\`\n\n`;
              case 'p': default: return `${innerText}\n\n`;
            }
          }
          
          return '';
        }).join('');
      };
      
      return extractText(jsonContent);
    } catch (error) {
      console.error('Error al convertir a Markdown:', error);
      return '';
    }
  }
};

/**
 * Objeto que contiene funciones para importar contenido a formato Plate
 */
export const PlateImporter = {
  /**
   * Convierte HTML a contenido de Plate
   * (Versión simulada ya que no tenemos acceso completo a las APIs)
   */
  fromHtml: (html: string): MyValue => {
    // Implementación básica para evitar errores
    if (!html) {
      return [{ type: 'p', children: [{ text: '' }] }];
    }
    
    // Simplemente devuelve un párrafo con el texto
    return [{ 
      type: 'p', 
      children: [{ 
        text: html.replace(/<[^>]*>/g, '') // Eliminar etiquetas HTML
      }] 
    }];
  },
  
  /**
   * Convierte Markdown a contenido de Plate
   * (Versión simulada ya que no tenemos acceso completo a las APIs)
   */
  fromMarkdown: (markdown: string): MyValue => {
    // Implementación básica para evitar errores
    if (!markdown) {
      return [{ type: 'p', children: [{ text: '' }] }];
    }

    const processor = unified().use(remarkParse);
    const ast = processor.parse(markdown);

    // Función para transformar el AST de Remark a formato Plate
    const transformNode = (node: RemarkNode): Descendant | Descendant[] | null => {
      if (!node) return null;

      // Manejar nodos de texto
      if (node.type === 'text') {
        return { text: (node as any).value || '' };
      }

      // Manejar elementos con hijos
      let children: Descendant[] = [];
      if ((node as RemarkParent).children) {
        children = (node as RemarkParent).children.flatMap(transformNode).filter(Boolean) as Descendant[];
      }

      // Si después de transformar los hijos, el único hijo es un objeto de texto vacío
      // y el tipo actual no es uno que intrínsecamente pueda estar "vacío" (como un párrafo),
      // podríamos querer devolver solo el objeto de texto para evitar anidamientos innecesarios.
      // O, si los hijos están vacíos, devolver un objeto de texto vacío.
      if (children.length === 0 && node.type !== 'paragraph' && node.type !== 'heading' && node.type !== 'code') {
         // Para tipos como strong, emphasis, etc., si no tienen hijos, no deberían renderizar nada.
         // O podrían necesitar un hijo de texto vacío si Plate lo requiere.
         // Por ahora, si no hay hijos, y no es un bloque principal, devolvemos null.
         // Esto podría necesitar ajuste basado en cómo Plate maneja elementos vacíos.
         return null;
      } else if (children.length === 0 && (node.type === 'paragraph' || node.type === 'heading')) {
        // Párrafos y encabezados vacíos deben tener un hijo de texto vacío según la estructura de Plate
        children = [{ text: '' }];
      }


      switch (node.type) {
        case 'root':
          return children.length > 0 ? children : [{ type: 'p', children: [{ text: '' }] }];

        case 'paragraph':
          return { type: 'p', children };

        case 'heading':
          const level = (node as any).depth || 1;
          const type = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
          return { type, children };

        case 'strong': // Negrita
          // Los nodos 'strong' en Remark contienen hijos que deben ser procesados.
          // Esos hijos se convierten en nodos de texto con la propiedad 'bold'.
          return children.map(child => ({ ...child, bold: true }));

        case 'emphasis': // Cursiva
          // Similar a 'strong', aplicamos 'italic' a los hijos procesados.
          return children.map(child => ({ ...child, italic: true }));

        case 'inlineCode': // Código en línea
          // El valor del código en línea está directamente en el nodo.
          // Plate espera un objeto de texto con la propiedad code y el texto.
          return { text: (node as any).value || '', code: true };

        case 'code': // Bloque de código
          // El valor del bloque de código está en el nodo.
          // Plate espera un tipo 'code_block' con un hijo de texto.
          // Los bloques de código en remark tienen un solo hijo de texto con el contenido.
          // Si hay saltos de línea, se preservan en `node.value`.
          const codeContent = (node as any).value || '';
          return { type: 'code_block', children: [{ text: codeContent }] };

        // Caso para manejar otros tipos de nodos no implementados o ignorarlos
        default:
          // Si hay hijos, devolvemos los hijos (para desenvolverlos del nodo actual no manejado)
          // Si no hay hijos, devolvemos null para ignorar este nodo.
          return children.length > 0 ? children : null;
      }
    };

    const plateContent = transformNode(ast);
    
    // Asegurarse de que plateContent es un array
    if (Array.isArray(plateContent)) {
      return plateContent.length > 0 ? plateContent : [{ type: 'p', children: [{ text: '' }] }];
    } else if (plateContent) {
      return [plateContent];
    } else {
      return [{ type: 'p', children: [{ text: '' }] }];
    }
  }
};
