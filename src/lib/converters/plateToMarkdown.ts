/**
 * Conversor de contenido JSON de Plate a Markdown
 * 
 * Este módulo transforma el contenido JSON del editor Plate en Markdown estándar,
 * preservando la estructura de encabezados, listas, tablas y otros elementos.
 */

type Node = {
  type?: string;
  text?: string;
  children?: Node[];
  url?: string;
  [key: string]: any;
};

/**
 * Convierte contenido JSON de Plate a Markdown
 * @param jsonContent - Contenido en formato JSON o string JSON
 * @returns Markdown generado
 */
export const plateToMarkdown = (jsonContent: any): string => {
  // Si es una cadena, intentar parsearla como JSON
  let content: Node[];
  if (typeof jsonContent === 'string') {
    try {
      content = JSON.parse(jsonContent);
    } catch (error) {
      console.warn("No se pudo parsear como JSON, devolviendo contenido original", error);
      return jsonContent;
    }
  } else {
    content = Array.isArray(jsonContent) ? jsonContent : [jsonContent];
  }

  // Si no hay contenido válido, devolver cadena vacía
  if (!content || !Array.isArray(content) || content.length === 0) {
    return '';
  }

  // Procesar cada nodo del contenido y unirlos con saltos de línea
  let markdown = content.map(node => renderNodeToMarkdown(node, 0)).join('\n\n');
  
  // Limpiar espacios en blanco excesivos
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  
  return markdown;
};

/**
 * Renderiza un nodo de Plate a Markdown
 * @param node - Nodo de Plate
 * @param listIndent - Nivel de indentación para listas
 * @returns Markdown para el nodo
 */
const renderNodeToMarkdown = (node: Node, listIndent: number = 0): string => {
  if (!node) return '';

  // Texto simple
  if (typeof node === 'string') {
    return node;
  }

  // Nodo de texto con formato
  if (node.text !== undefined) {
    let text = node.text;
    
    // Escapar caracteres especiales de Markdown
    text = text.replace(/([\\`*_{}[\]()#+-.!])/g, '\\$1');
    
    // Aplicar formato al texto
    if (node.bold) text = `**${text}**`;
    if (node.italic) text = `_${text}_`;
    if (node.strikethrough) text = `~~${text}~~`;
    if (node.code) text = `\`${text}\``;
    
    // Para colores y otros estilos, usar HTML en Markdown si es posible
    if (node.color) {
      text = `<span style="color: ${node.color}">${text}</span>`;
    }
    
    return text;
  }

  // Si no tiene tipo, renderizar los hijos
  if (!node.type && node.children) {
    return node.children.map(child => renderNodeToMarkdown(child, listIndent)).join('');
  }

  // Procesar por tipo de nodo
  switch (node.type) {
    case 'h1':
      return `# ${renderChildrenToMarkdown(node.children)}`;
    case 'h2':
      return `## ${renderChildrenToMarkdown(node.children)}`;
    case 'h3':
      return `### ${renderChildrenToMarkdown(node.children)}`;
    case 'h4':
      return `#### ${renderChildrenToMarkdown(node.children)}`;
    case 'h5':
      return `##### ${renderChildrenToMarkdown(node.children)}`;
    case 'h6':
      return `###### ${renderChildrenToMarkdown(node.children)}`;
    case 'p':
      return renderChildrenToMarkdown(node.children);
    case 'blockquote':
      return renderBlockquoteToMarkdown(node);
    case 'code_block':
      return renderCodeBlockToMarkdown(node);
    case 'code_line':
      return `${renderChildrenToMarkdown(node.children)}`;
    case 'ul':
      return renderListToMarkdown(node, '*', listIndent);
    case 'ol':
      return renderListToMarkdown(node, '1.', listIndent);
    case 'li':
      // Este caso será manejado por renderListToMarkdown
      return renderChildrenToMarkdown(node.children);
    case 'a':
      return `[${renderChildrenToMarkdown(node.children)}](${node.url || '#'})`;
    case 'img':
      return `![${node.alt || ''}](${node.url || ''})`;
    case 'hr':
      return '---';
    case 'table':
      return renderTableToMarkdown(node);
    case 'callout':
      return renderCalloutToMarkdown(node);
    default:
      // Para cualquier otro tipo, renderizar los hijos
      return renderChildrenToMarkdown(node.children);
  }
};

/**
 * Renderiza los hijos de un nodo a Markdown
 * @param children - Hijos del nodo
 * @returns Markdown para los hijos
 */
const renderChildrenToMarkdown = (children?: Node[]): string => {
  if (!children || !Array.isArray(children)) return '';
  return children.map(child => renderNodeToMarkdown(child)).join('');
};

/**
 * Renderiza una cita a Markdown
 * @param node - Nodo de blockquote
 * @returns Markdown para la cita
 */
const renderBlockquoteToMarkdown = (node: Node): string => {
  if (!node.children) return '';
  
  // Agregar > al inicio de cada línea
  const content = renderChildrenToMarkdown(node.children);
  return content.split('\n').map(line => `> ${line}`).join('\n');
};

/**
 * Renderiza un bloque de código a Markdown
 * @param node - Nodo de bloque de código
 * @returns Markdown para el bloque de código
 */
const renderCodeBlockToMarkdown = (node: Node): string => {
  if (!node.children) return '';
  
  const language = node.lang || '';
  const content = node.children.map(line => {
    if (line.type === 'code_line') {
      return renderChildrenToMarkdown(line.children);
    }
    return renderNodeToMarkdown(line);
  }).join('\n');
  
  return `\`\`\`${language}\n${content}\n\`\`\``;
};

/**
 * Renderiza una lista a Markdown
 * @param node - Nodo de lista
 * @param marker - Marcador de lista (*, 1., etc.)
 * @param indent - Nivel de indentación
 * @returns Markdown para la lista
 */
const renderListToMarkdown = (node: Node, marker: string, indent: number): string => {
  if (!node.children) return '';
  
  let result = '';
  let itemNumber = (node.start || 1) - 1;
  
  for (const item of node.children) {
    if (item.type === 'li') {
      itemNumber++;
      
      // Calcular el marcador
      const itemMarker = marker === '1.' ? `${itemNumber}.` : marker;
      
      // Indentación
      const indentStr = '  '.repeat(indent);
      
      // Contenido del ítem
      const itemContent = renderChildrenToMarkdown(item.children);
      
      // Primer línea del ítem
      result += `${indentStr}${itemMarker} ${itemContent.split('\n')[0]}\n`;
      
      // Resto de líneas del ítem (con indentación)
      const restLines = itemContent.split('\n').slice(1);
      if (restLines.length > 0) {
        result += restLines.map(line => `${indentStr}  ${line}`).join('\n') + '\n';
      }
      
      // Listas anidadas
      if (item.children) {
        for (const subItem of item.children) {
          if (subItem.type === 'ul') {
            result += renderListToMarkdown(subItem, '*', indent + 1);
          } else if (subItem.type === 'ol') {
            result += renderListToMarkdown(subItem, '1.', indent + 1);
          }
        }
      }
    }
  }
  
  return result;
};

/**
 * Renderiza una tabla a Markdown
 * @param node - Nodo de tabla
 * @returns Markdown para la tabla
 */
const renderTableToMarkdown = (node: Node): string => {
  if (!node.children) return '';
  
  const rows: string[][] = [];
  let headerRow: string[] = [];
  let hasHeader = false;
  
  // Procesar filas
  for (const row of node.children) {
    if (row.type === 'tr') {
      const cells: string[] = [];
      
      // Procesar celdas
      for (const cell of row.children || []) {
        if (cell.type === 'th' || cell.type === 'td') {
          const cellContent = renderChildrenToMarkdown(cell.children).replace(/\n/g, ' ');
          cells.push(cellContent);
          
          // Si hay al menos una celda th, considerar como encabezado
          if (cell.type === 'th') {
            hasHeader = true;
          }
        }
      }
      
      if (cells.length > 0) {
        if (hasHeader && rows.length === 0) {
          headerRow = cells;
        } else {
          rows.push(cells);
        }
      }
    }
  }
  
  // Si no hay encabezado, usar la primera fila como encabezado
  if (!hasHeader && rows.length > 0) {
    headerRow = rows.shift() || [];
  }
  
  // Construir la tabla Markdown
  if (headerRow.length === 0) return '';
  
  // Calcular el ancho máximo de cada columna para alineación
  const columnWidths: number[] = [];
  for (let i = 0; i < headerRow.length; i++) {
    columnWidths[i] = headerRow[i].length;
    for (const row of rows) {
      if (row[i] && row[i].length > columnWidths[i]) {
        columnWidths[i] = row[i].length;
      }
    }
  }
  
  // Construir la tabla
  let result = '| ';
  
  // Encabezado
  for (let i = 0; i < headerRow.length; i++) {
    result += headerRow[i].padEnd(columnWidths[i], ' ') + ' | ';
  }
  result = result.trimEnd() + '\n';
  
  // Separador
  result += '| ';
  for (let i = 0; i < headerRow.length; i++) {
    result += '-'.repeat(columnWidths[i]) + ' | ';
  }
  result = result.trimEnd() + '\n';
  
  // Filas
  for (const row of rows) {
    result += '| ';
    for (let i = 0; i < headerRow.length; i++) {
      result += (row[i] || '').padEnd(columnWidths[i], ' ') + ' | ';
    }
    result = result.trimEnd() + '\n';
  }
  
  return result;
};

/**
 * Renderiza un callout a Markdown
 * @param node - Nodo de callout
 * @returns Markdown para el callout
 */
const renderCalloutToMarkdown = (node: Node): string => {
  if (!node.children) return '';
  
  const icon = node.icon || '💡';
  const content = renderChildrenToMarkdown(node.children);
  
  // Usar blockquote para callouts
  return `> ${icon} **Nota:** ${content.replace(/\n/g, '\n> ')}`;
};