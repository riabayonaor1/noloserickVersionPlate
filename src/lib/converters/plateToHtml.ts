/**
 * Conversor de contenido JSON de Plate a HTML
 * 
 * Este módulo transforma el contenido JSON del editor Plate en HTML válido,
 * preservando estilos, formatos y estructuras complejas como tablas.
 */

type Node = {
  type?: string;
  text?: string;
  children?: Node[];
  url?: string;
  [key: string]: any;
};

/**
 * Convierte contenido JSON de Plate a HTML
 * @param jsonContent - Contenido en formato JSON o string JSON
 * @returns HTML generado
 */
export const plateToHtml = (jsonContent: any): string => {
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

  // Generar HTML con un contenedor principal y estilos básicos
  let html = `
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
      max-width: 100%;
      margin: 0 auto;
    }
    .content-wrapper {
      max-width: 100%;
      margin: 0 auto;
      padding: 1rem;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 { font-size: 2.5rem; }
    h2 { font-size: 2rem; }
    h3 { font-size: 1.75rem; }
    h4 { font-size: 1.5rem; }
    h5 { font-size: 1.25rem; }
    h6 { font-size: 1rem; }
    p { margin-bottom: 1rem; }
    ul, ol { 
      margin-bottom: 1rem;
      padding-left: 2rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }
    table th, table td {
      border: 1px solid #ddd;
      padding: 0.5rem;
    }
    table th {
      background-color: rgba(0, 0, 0, 0.05);
    }
    pre {
      background-color: rgba(0, 0, 0, 0.05);
      padding: 1rem;
      border-radius: 0.25rem;
      overflow-x: auto;
    }
    code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      background-color: rgba(0, 0, 0, 0.05);
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
    }
    blockquote {
      border-left: 4px solid rgba(0, 0, 0, 0.1);
      padding-left: 1rem;
      font-style: italic;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-justify { text-align: justify; }
  </style>
</head>
<body>
  <div class="content-wrapper">
`;

  // Procesar cada nodo del contenido
  for (const node of content) {
    html += renderNode(node);
  }

  // Cerrar el HTML
  html += `
  </div>
</body>
</html>
`;

  return html;
};

/**
 * Renderiza un nodo de Plate a HTML
 * @param node - Nodo de Plate
 * @returns HTML para el nodo
 */
const renderNode = (node: Node): string => {
  if (!node) return '';

  // Texto simple
  if (typeof node === 'string') {
    return escapeHtml(node);
  }

  // Nodo de texto con formato
  if (node.text !== undefined) {
    let text = escapeHtml(node.text);
    
    // Aplicar formato al texto
    if (node.bold) text = `<strong>${text}</strong>`;
    if (node.italic) text = `<em>${text}</em>`;
    if (node.underline) text = `<u>${text}</u>`;
    if (node.strikethrough) text = `<del>${text}</del>`;
    if (node.code) text = `<code>${text}</code>`;
    
    // Aplicar color si existe
    if (node.color) {
      text = `<span style="color:${node.color}">${text}</span>`;
    }
    
    return text;
  }

  // Si no tiene tipo, renderizar los hijos
  if (!node.type && node.children) {
    return node.children.map(child => renderNode(child)).join('');
  }

  // Procesar por tipo de nodo
  switch (node.type) {
    case 'h1':
      return renderElement('h1', node);
    case 'h2':
      return renderElement('h2', node);
    case 'h3':
      return renderElement('h3', node);
    case 'h4':
      return renderElement('h4', node);
    case 'h5':
      return renderElement('h5', node);
    case 'h6':
      return renderElement('h6', node);
    case 'p':
      return renderElement('p', node);
    case 'blockquote':
      return renderElement('blockquote', node);
    case 'code_block':
      return renderCodeBlock(node);
    case 'code_line':
      return `${renderChildren(node.children)}\n`;
    case 'ul':
    case 'ol':
      return renderListElement(node);
    case 'li':
      return `<li>${renderChildren(node.children)}</li>`;
    case 'a':
      return `<a href="${node.url || '#'}">${renderChildren(node.children)}</a>`;
    case 'img':
      return `<img src="${node.url || ''}" alt="${node.alt || ''}" ${node.width ? `width="${node.width}"` : ''} ${node.height ? `height="${node.height}"` : ''} />`;
    case 'hr':
      return '<hr />';
    case 'table':
      return renderTable(node);
    case 'tr':
      return `<tr>${renderChildren(node.children)}</tr>`;
    case 'td':
      return `<td>${renderChildren(node.children)}</td>`;
    case 'th':
      return `<th>${renderChildren(node.children)}</th>`;
    case 'callout':
      return renderCallout(node);
    case 'equation':
    case 'inlineEquation':
      return renderEquation(node);
    default:
      // Para cualquier otro tipo, renderizar un div con los hijos
      return renderElement('div', node);
  }
};

/**
 * Renderiza un elemento con sus hijos
 * @param tag - Etiqueta HTML
 * @param node - Nodo de Plate
 * @returns HTML para el elemento
 */
const renderElement = (tag: string, node: Node): string => {
  const attrs: string[] = [];
  let classNames: string[] = [];
  
  // Procesar atributos especiales
  if (node.textAlign) {
    classNames.push(`text-${node.textAlign}`);
  }
  
  if (node.align) {
    classNames.push(`text-${node.align}`);
  }
  
  // Construir atributos de estilo
  const styles: string[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (key === 'color' || key === 'backgroundColor' || key === 'fontSize' || key === 'width' || key === 'height') {
      styles.push(`${toKebabCase(key)}: ${value}`);
    }
  }
  
  if (styles.length > 0) {
    attrs.push(`style="${styles.join('; ')}"`);
  }
  
  if (classNames.length > 0) {
    attrs.push(`class="${classNames.join(' ')}"`);
  }
  
  const attrsString = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  
  return `<${tag}${attrsString}>${renderChildren(node.children)}</${tag}>`;
};

/**
 * Renderiza un bloque de código
 * @param node - Nodo de bloque de código
 * @returns HTML para el bloque de código
 */
const renderCodeBlock = (node: Node): string => {
  const language = node.lang || '';
  return `<pre><code class="language-${language}">${renderChildren(node.children)}</code></pre>`;
};

/**
 * Renderiza una lista (ul/ol)
 * @param node - Nodo de lista
 * @returns HTML para la lista
 */
const renderListElement = (node: Node): string => {
  const tag = node.type === 'ul' ? 'ul' : 'ol';
  const attrs: string[] = [];
  
  // Si tiene start, agregarlo
  if (node.start !== undefined && node.start !== 1) {
    attrs.push(`start="${node.start}"`);
  }
  
  const attrsString = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  
  return `<${tag}${attrsString}>${renderChildren(node.children)}</${tag}>`;
};

/**
 * Renderiza una tabla
 * @param node - Nodo de tabla
 * @returns HTML para la tabla
 */
const renderTable = (node: Node): string => {
  return `<div class="table-container"><table>${renderChildren(node.children)}</table></div>`;
};

/**
 * Renderiza un callout (nota destacada)
 * @param node - Nodo de callout
 * @returns HTML para el callout
 */
const renderCallout = (node: Node): string => {
  const icon = node.icon || '💡';
  const color = node.color || 'blue';
  
  return `
<div class="callout" style="background-color: rgba(var(--${color}-rgb), 0.1); border-left: 4px solid var(--${color}); padding: 1rem; margin: 1rem 0; border-radius: 0.25rem;">
  <div style="display: flex; gap: 0.75rem;">
    <div style="font-size: 1.25rem; line-height: 1;">${icon}</div>
    <div>${renderChildren(node.children)}</div>
  </div>
</div>
  `;
};

/**
 * Renderiza una ecuación matemática
 * @param node - Nodo de ecuación
 * @returns HTML para la ecuación
 */
const renderEquation = (node: Node): string => {
  const isInline = node.type === 'inlineEquation';
  const formula = node.formula || node.texExpression || '';
  
  if (isInline) {
    return `<span class="math inline">\\(${formula}\\)</span>`;
  } else {
    return `<div class="math display">\\[${formula}\\]</div>`;
  }
};

/**
 * Renderiza los hijos de un nodo
 * @param children - Hijos del nodo
 * @returns HTML para los hijos
 */
const renderChildren = (children?: Node[]): string => {
  if (!children || !Array.isArray(children)) return '';
  return children.map(child => renderNode(child)).join('');
};

/**
 * Escapa caracteres especiales HTML
 * @param text - Texto a escapar
 * @returns Texto escapado
 */
const escapeHtml = (text?: string): string => {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Convierte una cadena de camelCase a kebab-case
 * @param str - Cadena en camelCase
 * @returns Cadena en kebab-case
 */
const toKebabCase = (str: string): string => {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
};