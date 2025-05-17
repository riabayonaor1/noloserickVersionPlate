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
    
    // Simplemente devuelve un párrafo con el texto
    return [{ 
      type: 'p', 
      children: [{ 
        text: markdown 
      }] 
    }];
  }
};
