// filepath: /Volumes/DOCSSD/PROGRAMAS/Claude/app-plate-firebase/src/lib/converters/plateToHtml.ts
/**
 * Conversor de contenido JSON de Plate a HTML
 * 
 * Este módulo transforma el contenido JSON del editor Plate en HTML válido,
 * preservando estilos, formatos y estructuras complejas como tablas, ecuaciones, callouts, etc.
 * 
 * Versión mejorada con soporte para todos los tipos de nodos de Plate y sus estilos.
 */

interface PlateNode {
  type?: string;
  text?: string;
  children?: PlateNode[];
  url?: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  backgroundColor?: string;
  textAlign?: string;
  align?: string;
  start?: number;
  icon?: string;
  date?: string;
  formula?: string;
  texExpression?: string;
  lang?: string;
  checked?: boolean;
  indent?: number;
  listStyleType?: string;
  id?: string;
  background?: string;
  borders?: any;
  kbd?: boolean;
  heading?: string;
  [key: string]: any;
}

/**
 * Extrae el texto plano de un nodo de Plate
 * @param node - Nodo de Plate
 * @returns Texto contenido en el nodo
 */
const extractTextFromNode = (node: PlateNode): string => {
  if (!node) return '';
  
  if (typeof node === 'string') {
    return node;
  }
  
  if (node.text !== undefined) {
    return node.text;
  }
  
  if (node.children && Array.isArray(node.children)) {
    return node.children.map(child => extractTextFromNode(child)).join('');
  }
  
  return '';
};

/**
 * Genera un ID a partir del texto de un encabezado
 * @param text - Texto del encabezado
 * @returns ID para el encabezado
 */
const generateIdFromText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-'); // Evitar guiones duplicados
};

/**
 * Convierte contenido JSON de Plate a HTML
 * @param jsonContent - Contenido en formato JSON o string JSON
 * @param standalone - Si es true, genera un documento HTML completo con head y body. Si es false, solo el contenido HTML.
 * @returns HTML generado
 */
/**
 * Extrae el número de un elemento de lista a partir del texto
 * @param node - Nodo de Plate
 * @returns Número extraído o null si no se encontró
 */
const extractListItemNumber = (node: PlateNode): number | null => {
  if (!node || !node.children || !Array.isArray(node.children)) return null;
  
  // Obtener el texto del primer hijo
  const text = extractTextFromNode(node.children[0] || {});
  
  // Buscar un patrón de número seguido de punto y espacio al inicio
  const match = text.match(/^\s*(\d+)\.\s+/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  
  return null;
};

/**
 * Preprocesa el contenido para transformar párrafos con estilo de lista
 * en estructuras de listas adecuadas.
 * @param content - Array de nodos de Plate
 * @returns Array de nodos procesados
 */
const preprocessContent = (content: PlateNode[]): PlateNode[] => {
  if (!content || !Array.isArray(content)) return content;
  
  const result: PlateNode[] = [];
  let currentList: PlateNode | null = null;
  let currentListType: string | null = null;
  
  for (const node of content) {
    // Si es un párrafo con estilo de lista
    if (node.type === 'p' && node.listStyleType) {
      const listType = node.listStyleType;
      
      // Determinar qué tipo de lista necesitamos
      let newListType: string;
      if (listType === 'decimal') {
        newListType = 'ol';
      } else if (listType === 'disc') {
        newListType = 'ul';
      } else if (listType === 'todo') {
        newListType = 'ul-todo';
      } else {
        // Tipo no soportado, tratar como párrafo normal
        result.push(node);
        currentList = null;
        currentListType = null;
        continue;
      }
      
      // Detectar si debemos comenzar una nueva lista
      const shouldStartNewList = !currentList || 
                               currentListType !== newListType ||
                               // Si hay un atributo start, indica que el usuario quiere reiniciar la numeración
                               (listType === 'decimal' && node.start !== undefined);
      
      if (shouldStartNewList) {
        if (newListType === 'ol') {
          currentList = {
            type: 'ol',
            listStyleType: 'decimal',
            children: [],
            // Preservar el atributo start si existe
            ...(node.start !== undefined && { start: node.start })
          };
        } else if (newListType === 'ul') {
          currentList = {
            type: 'ul',
            listStyleType: 'disc',
            children: []
          };
        } else if (newListType === 'ul-todo') {
          currentList = {
            type: 'ul',
            listStyleType: 'todo',
            children: []
          };
        }
        
        currentListType = newListType;
        // Asegurarse de que currentList no sea null antes de agregarlo
        if (currentList) {
          result.push(currentList);
        }
      }
      
      // Convertir el párrafo en un elemento de lista
      const liNode: PlateNode = {
        type: 'li',
        listStyleType: node.listStyleType,
        children: node.children || []
      };
      
      // Si es lista numérica, extraer el número original si está presente
      if (listType === 'decimal') {
        const n = extractListItemNumber(node);
        if (n !== null) {
          liNode.originalNumber = n;
        }
      }
      
      // Si es checklist, preservar el estado 'checked'
      if (listType === 'todo' && node.checked !== undefined) {
        liNode.checked = node.checked;
      }
      
      // Agregar el elemento a la lista actual
      if (currentList && currentList.children) {
        currentList.children.push(liNode);
      }
    }
    // Cualquier otro contenido rompe la lista actual
    else {
      result.push(node);
      currentList = null;
      currentListType = null;
    }
  }
  
  return result;
};

export const plateToHtml = (jsonContent: any, standalone: boolean = false): string => {
  // Si es una cadena, intentar parsearla como JSON
  let content: PlateNode[];
  if (typeof jsonContent === 'string') {
    try {
      content = JSON.parse(jsonContent);
    } catch (error) {
      console.warn("No se pudo parsear como JSON, devolviendo contenido original", error);
      return String(jsonContent);
    }
  } else {
    content = Array.isArray(jsonContent) ? jsonContent : [jsonContent];
  }

  // Si no hay contenido válido, devolver cadena vacía
  if (!content || !Array.isArray(content) || content.length === 0) {
    return '';
  }
  
  // Preprocesar el contenido para manejar listas correctamente
  content = preprocessContent(content);

  let html = '';
  
  // Si queremos un documento HTML completo
  if (standalone) {
    html = `
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
    /* Estilos mejorados para encabezados */
    h1, h2, h3, h4, h5, h6 {
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-weight: 600;
      line-height: 1.25;
      color: #111827;
    }
    h1 { font-size: 2.25rem; letter-spacing: -0.025em; }
    h2 { font-size: 1.875rem; letter-spacing: -0.025em; }
    h3 { font-size: 1.5rem; }
    h4 { font-size: 1.25rem; }
    h5 { font-size: 1.125rem; }
    h6 { font-size: 1rem; }
    
    p { margin-bottom: 1rem; }
    ul, ol { 
      margin-bottom: 1rem;
      padding-left: 2rem;
    }
    
    /* Estilos mejorados para tablas */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }
    table th, table td {
      border: 1px solid #e5e7eb;
      padding: 0.75rem;
    }
    table th {
      background-color: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    
    /* Estilos mejorados para bloques de código */
    pre {
      background-color: #f9fafb;
      padding: 1rem;
      border-radius: 0.375rem;
      overflow-x: auto;
      border: 1px solid #e5e7eb;
      margin: 1.5rem 0;
      position: relative;
    }
    pre::before {
      content: attr(data-language);
      position: absolute;
      top: 0.25rem;
      right: 0.75rem;
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 
        'Liberation Mono', 'Courier New', monospace;
      font-size: 0.875em;
      background-color: rgba(0, 0, 0, 0.05);
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
    }
    pre code {
      background-color: transparent;
      padding: 0;
      font-size: 0.875rem;
      color: #334155;
      tab-size: 2;
    }
    
    /* Estilos mejorados para blockquote */
    blockquote {
      border-left: 4px solid #3b82f6;
      padding: 0.5rem 0 0.5rem 1rem;
      margin: 1.5rem 0;
      font-style: italic;
      color: #4b5563;
      background-color: #f3f4f6;
      border-radius: 0 0.25rem 0.25rem 0;
    }
    
    img {
      max-width: 100%;
      height: auto;
      border-radius: 0.375rem;
    }
    
    /* Alineación de texto */
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-justify { text-align: justify; }
    .text-left { text-align: left; }
    
    /* Estilos mejorados para callout */
    .callout {
      border-radius: 0.5rem;
      padding: 1rem;
      margin: 1.5rem 0;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background-color: #f3f4f6;
      border-left: 4px solid #9ca3af;
    }
    .callout-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .callout-content {
      flex-grow: 1;
    }
    
    /* Estilos mejorados para columnas */
    .column-group {
      display: flex;
      gap: 1.5rem;
      margin: 1.5rem 0;
      flex-wrap: wrap;
    }
    @media (max-width: 640px) {
      .column-group {
        flex-direction: column;
      }
    }
    .column {
      flex: 1 1 0%;
      min-width: 200px;
      border: 1px dashed #ddd;
      padding: 0.75rem;
      border-radius: 0.25rem;
      background-color: #fcfcfc;
    }
    
    /* Estilos para kbd */
    kbd {
      background-color: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 0.25rem;
      box-shadow: 0 1px 0 rgba(0,0,0,0.05);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 
        'Liberation Mono', 'Courier New', monospace;
      font-size: 0.875rem;
      font-weight: 500;
      padding: 0.125rem 0.375rem;
      color: #374151;
    }
    
    /* Estilos mejorados para toggles */
    details.toggle {
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      margin: 1.5rem 0;
      overflow: hidden;
      background-color: #fff;
    }
    details.toggle summary {
      cursor: pointer;
      padding: 0.75rem 1rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      border-bottom: 1px solid transparent;
      position: relative;
    }
    details.toggle summary::before {
      content: "▶";
      font-size: 0.75rem;
      margin-right: 0.75rem;
      color: #6b7280;
      transition: transform 0.2s;
    }
    details.toggle[open] summary::before {
      transform: rotate(90deg);
    }
    details.toggle[open] summary {
      border-bottom: 1px solid #e5e7eb;
    }
    details.toggle > div {
      padding: 1rem;
    }
    
    /* Indentación */
    .indent-1 { padding-left: 2rem; }
    .indent-2 { padding-left: 4rem; }
    .indent-3 { padding-left: 6rem; }
    
    /* Estilos para listas */
    .list-disc { list-style-type: disc !important; }
    .list-decimal { list-style-type: decimal !important; }
    .list-todo { list-style-type: none !important; padding-left: 0 !important; }
    
    /* Estilos mejorados para listas de tareas */
    .plate-checklist-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 0.5rem;
      position: relative;
      padding-left: 1.75rem;
    }
    .plate-checklist-item input[type="checkbox"] {
      position: absolute;
      left: 0;
      top: 0.375rem;
      margin-right: 0.75rem;
      width: 1rem;
      height: 1rem;
      flex-shrink: 0;
      cursor: pointer;
      appearance: auto;
      -webkit-appearance: auto;
    }
    
    /* Estilos específicos para los tipos de lista */
    ul.list-disc, ul.plate-ul { 
      list-style-type: disc !important; 
      padding-left: 1.5rem !important;
      margin-left: 0.5rem !important;
      display: block !important;
    }
    ol.list-decimal, ol.plate-ol { 
      list-style-type: decimal !important; 
      padding-left: 1.5rem !important;
      margin-left: 0.5rem !important;
      display: block !important;
    }
    ul.list-todo { 
      list-style-type: none !important; 
      padding-left: 0 !important; 
      display: block !important;
    }
    
    /* Garantizar que los marcadores de lista sean visibles */
    li::marker {
      display: inline-block !important;
      content: inherit !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    
    li.plate-li {
      display: list-item !important;
      list-style-position: outside !important;
    }
    
    /* Asegurar que los elementos de lista con viñetas se muestren correctamente */
    ul.plate-ul > li, 
    ul.list-disc > li {
      display: list-item !important;
      list-style-type: disc !important;
      list-style-position: outside !important;
    }
    
    /* Asegurar que los elementos de lista numerada se muestren correctamente */
    ol.plate-ol > li,
    ol.list-decimal > li {
      display: list-item !important;
      list-style-type: decimal !important;
      list-style-position: outside !important;
    }
    
    /* Estilos adicionales para forzar la visualización de viñetas y números */
    .plate-ul li::before,
    .list-disc li::before {
      content: "•";
      position: absolute;
      left: -1.2em;
      font-size: 1em;
      display: inline-block !important;
      visibility: visible !important;
    }
    
    .plate-ol li,
    .list-decimal li {
      counter-increment: item;
    }
    
    .plate-ol li::before,
    .list-decimal li::before {
      content: counter(item) ". ";
      position: absolute;
      left: -1.5em;
      display: inline-block !important;
      visibility: visible !important;
      width: 1.5em;
      text-align: right;
    }
    
    /* Estilos mejorados para listas de tareas */
    .plate-checklist-item {
      display: flex !important;
      align-items: flex-start !important;
      margin-bottom: 0.5rem !important;
      position: relative !important;
      padding-left: 24px !important;
    }
    .plate-checklist-item input[type="checkbox"] {
      margin-right: 0.75rem !important;
      margin-top: 0.375rem !important;
      width: 16px !important;
      height: 16px !important;
      flex-shrink: 0 !important;
      appearance: auto !important;
      -webkit-appearance: auto !important;
      border: 1px solid #ddd !important;
      position: relative !important;
    }
    /* Asegurarse de que el checkbox sea visible */
    ul.list-todo li input[type="checkbox"] {
      position: absolute !important;
      left: 0 !important;
      top: 4px !important;
      width: 16px !important;
      height: 16px !important;
      appearance: checkbox !important;
      -webkit-appearance: checkbox !important;
      visibility: visible !important;
      display: inline-block !important;
      opacity: 1 !important;
      border: 1px solid #ddd !important;
    }
    
    /* Asegurar que los checkboxes siempre sean visibles */
    input[type="checkbox"] {
      appearance: checkbox !important;
      -webkit-appearance: checkbox !important;
      -moz-appearance: checkbox !important;
      width: 16px !important;
      height: 16px !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: relative !important;
      display: inline-block !important;
      margin: 0 8px 0 0 !important;
    }
    
    /* Estilos para ecuaciones */
    .math-inline {
      font-style: normal;
      padding: 0 0.1em;
    }
    .math-display {
      display: block;
      margin: 1rem 0;
      padding: 1rem;
      text-align: center;
      overflow-x: auto;
    }
    
    /* Estilos para tabla de contenidos */
    .table-of-contents {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      padding: 1rem;
      margin: 1.5rem 0;
    }
    .table-of-contents h2 {
      font-size: 1.25rem;
      margin-top: 0;
      margin-bottom: 0.75rem;
      color: #374151;
    }
    .table-of-contents ul {
      padding-left: 1.5rem;
      margin: 0;
    }
    .table-of-contents li {
      margin-bottom: 0.25rem;
    }
    .table-of-contents a {
      color: #2563eb;
      text-decoration: none;
    }
    .table-of-contents a:hover {
      text-decoration: underline;
    }
    
    /* Estilos para fechas */
    time {
      white-space: nowrap;
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    /* Estilos específicos para encabezados de Plate */
    .plate-h1, .plate-h2, .plate-h3, .plate-h4, .plate-h5, .plate-h6 {
      margin-top: 2rem;
      margin-bottom: 1rem;
      font-weight: 600;
      line-height: 1.25;
      color: #111827;
    }
    .plate-h1 { font-size: 2.25rem; letter-spacing: -0.025em; }
    .plate-h2 { font-size: 1.875rem; letter-spacing: -0.025em; }
    .plate-h3 { font-size: 1.5rem; }
    .plate-h4 { font-size: 1.25rem; }
    .plate-h5 { font-size: 1.125rem; }
    .plate-h6 { font-size: 1rem; }
    
    /* Estilos para blockquote de Plate */
    .plate-blockquote {
      border-left: 4px solid #3b82f6;
      padding: 0.5rem 0 0.5rem 1rem;
      margin: 1.5rem 0;
      font-style: italic;
      color: #4b5563;
      background-color: #f3f4f6;
      border-radius: 0 0.25rem 0.25rem 0;
    }
    
    /* Estilos para código de Plate */
    .plate-code-block {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      margin: 1.5rem 0;
      overflow: hidden;
    }
    .plate-code-header {
      padding: 0.5rem 1rem;
      background-color: #f3f4f6;
      border-bottom: 1px solid #e5e7eb;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 
        'Liberation Mono', 'Courier New', monospace;
      font-size: 0.75rem;
      color: #6b7280;
      text-align: right;
    }
    .plate-code-content {
      padding: 1rem;
      overflow-x: auto;
    }
    .plate-code-content code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
    }
    
    /* Estilos para elementos multimedia */
    /* Video */
    .plate-video-figure {
      margin: 1.5rem 0;
      position: relative;
      display: inline-block;
    }
    .plate-video {
      max-width: 100%;
      border-radius: 0.375rem;
    }
    
    /* Audio */
    .plate-audio-figure {
      margin: 1.5rem 0;
      width: 100%;
    }
    .plate-audio {
      width: 100%;
      height: 54px;
      border-radius: 0.375rem;
    }
    
    /* Archivo */
    .plate-file {
      margin: 1rem 0;
    }
    .plate-file a {
      display: inline-flex;
      align-items: center;
      padding: 0.625rem 1rem;
      background-color: #f3f4f6;
      border-radius: 0.375rem;
      text-decoration: none;
      color: #374151;
      transition: background-color 0.2s;
      border: 1px solid #e5e7eb;
    }
    .plate-file a:hover {
      background-color: #e5e7eb;
    }
    .plate-file svg {
      margin-right: 0.5rem;
      flex-shrink: 0;
    }
  </style>
  <script>
    MathJax = {
      tex: {
        inlineMath: [['\\\\(', '\\\\)']],
        displayMath: [['\\\\[', '\\\\]']]
      },
      svg: {
        fontCache: 'global'
      }
    };
  </script>
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
</head>
<body>
  <div class="content-wrapper">
`;
  } else {
    html = '<div class="plate-content-view">';
  }

  // Procesar cada nodo del contenido
  for (const node of content) {
    html += renderNode(node);
  }

  // Cerrar el HTML
  if (standalone) {
    html += `
  </div>
</body>
</html>
`;
  } else {
    html += '</div>';
  }

  return html;
};

/**
 * Renderiza un nodo de Plate a HTML
 * @param node - Nodo de Plate
 * @returns HTML para el nodo
 */
const renderNode = (node: PlateNode): string => {
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
    if (node.kbd) text = `<kbd>${text}</kbd>`;
    
    // Aplicar color, fondo y tamaño de fuente si existen
    if (node.color || node.backgroundColor || node.fontSize) {
      const styles: string[] = [];
      if (node.color) styles.push(`color: ${node.color}`);
      if (node.backgroundColor) styles.push(`background-color: ${node.backgroundColor}`);
      if (node.fontSize) styles.push(`font-size: ${node.fontSize}`);
      text = `<span style="${styles.join('; ')}">${text}</span>`;
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
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      // Aplicar alineación si existe
      const headingClasses = [`plate-${node.type}`];
      if (node.textAlign) {
        headingClasses.push(`text-${node.textAlign}`);
      } else if (node.align) {
        headingClasses.push(`text-${node.align}`);
      }
      
      // Generar un ID para anclar desde la tabla de contenidos
      const headingText = extractTextFromNode(node);
      const headingId = node.id || generateIdFromText(headingText);
      
      // Añadir estilos si existen (especialmente fontSize)
      let styleAttribute = '';
      if (node.fontSize) {
        styleAttribute = ` style="font-size: ${node.fontSize}"`;
      }
      
      return `<${node.type} id="${headingId}" class="${headingClasses.join(' ')}"${styleAttribute}>${renderChildren(node.children)}</${node.type}>`;
    case 'p':
      return renderElement('p', node);
    case 'blockquote':
      return `<blockquote class="plate-blockquote">${renderChildren(node.children)}</blockquote>`;
    case 'code_block':
      return renderCodeBlock(node);
    case 'code_line':
      return `${renderChildren(node.children)}\n`;
    case 'ul':
    case 'ol':
      return renderListElement(node);
    case 'li':
      return renderListItem(node);
    case 'a':
      return `<a href="${node.url || '#'}" class="plate-link">${renderChildren(node.children)}</a>`;
    case 'img':
      return `<img src="${node.url || ''}" alt="${node.alt || ''}" ${node.width ? `width="${node.width}"` : ''} ${node.height ? `height="${node.height}"` : ''} class="plate-image" />`;
    case 'hr':
      return '<hr class="plate-hr" />';
    case 'table':
      return renderTable(node);
    case 'tr':
      return renderTableRow(node);
    case 'td':
      return renderTableCell('td', node);
    case 'th':
      return renderTableCell('th', node);
    case 'toggle':
      return renderToggle(node);
    case 'callout':
      return renderCallout(node);
    case 'equation':
      return renderEquation(node, false);
    case 'inline_equation':
      return renderEquation(node, true);
    case 'toc':
      return renderTableOfContents(node);
    case 'column_group':
      return renderColumnGroup(node);
    case 'column':
      return renderColumn(node);
    case 'date':
      return renderDate(node);
    case 'video':
      return renderVideo(node);
    case 'audio':
      return renderAudio(node);
    case 'file':
      return renderFile(node);
    default:
      // Para cualquier otro tipo, renderizar un div con los hijos
      return renderElement('div', node);
  }
};

/**
 * Renderiza un elemento de lista, manejando listas de verificación
 * @param node - Nodo de elemento de lista
 * @returns HTML del elemento de lista
 */
const renderListItem = (node: PlateNode): string => {
  // Verificar si es un elemento de lista de tareas (checklist)
  const isChecklist = node.checked !== undefined;
  
  if (isChecklist) {
    const checked = node.checked ? 'checked' : '';
    // Mejorar la estructura de los elementos de lista de tareas para que el checkbox sea visible
    return `<li class="plate-checklist-item list-todo" style="display: flex !important; align-items: flex-start !important; position: relative !important; padding-left: 24px !important;">
      <input type="checkbox" ${checked} disabled style="position: absolute !important; left: 0 !important; top: 4px !important; margin-right: 8px !important; width: 16px !important; height: 16px !important; flex-shrink: 0 !important; appearance: checkbox !important; -webkit-appearance: checkbox !important; border: 1px solid #ddd !important; visibility: visible !important; display: inline-block !important; opacity: 1 !important;" />
      <span style="margin-left: 4px !important;">${renderChildren(node.children)}</span>
    </li>`;
  }
  
  // Manejar elementos de lista normales (con viñetas o numeradas)
  const listTypeClass = node.listStyleType ? `list-${node.listStyleType}` : '';
  const classes = ['plate-li'];
  
  if (listTypeClass) {
    classes.push(listTypeClass);
  }
  
  const classAttr = ` class="${classes.join(' ')}"`;
  
  // Aplicar estilos inline detallados para garantizar que se muestre correctamente
  const styles = [
    'display: list-item !important', 
    'position: relative !important',
    'list-style-position: outside !important'
  ];

  // Si es una lista con viñetas, añadir estilos específicos
  if (node.listStyleType === 'disc' || (!node.listStyleType && node.parentType === 'ul')) {
    styles.push('list-style-type: disc !important');
  }
  
  // Si es una lista numerada, añadir estilos específicos
  if (node.listStyleType === 'decimal' || (!node.listStyleType && node.parentType === 'ol')) {
    styles.push('list-style-type: decimal !important');
  }
  
  // Aplicar estilos inline
  const inlineStyle = ` style="${styles.join('; ')}"`;

  // Añadir atributo value si hay un número original definido (extraído del texto)
  const valueAttr = node.originalNumber ? ` value="${node.originalNumber}"` : '';
  
  // Asegurarse de que el contenido del elemento sea visible y que las viñetas/números aparezcan
  return `<li${classAttr}${inlineStyle}${valueAttr}>${renderChildren(node.children)}</li>`;
};

/**
 * Renderiza una tabla de contenidos interactiva
 * @param node - Nodo de tabla de contenidos
 * @returns HTML de la tabla de contenidos
 */
const renderTableOfContents = (node: PlateNode): string => {
  // Esta función ahora generará enlaces basados en los IDs de los encabezados
  // o utilizará el texto del contenido para generar IDs en caso de que no existan

  /**
   * Genera un ID a partir de un texto para usar como ancla
   * @param text - Texto del encabezado
   * @returns ID para ancla
   */
  const generateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '') // Eliminar caracteres especiales
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-'); // Evitar guiones múltiples
  };

  // Si se proporcionan enlaces personalizados en el nodo, usarlos
  if (node.links && Array.isArray(node.links) && node.links.length > 0) {
    const linksList = node.links.map(link => {
      const indent = link.depth ? `style="padding-left: ${link.depth * 1.5}rem;"` : '';
      return `<li ${indent}><a href="#${link.id || generateSlug(link.text)}">${link.text}</a></li>`;
    }).join('\n');

    return `
<div class="table-of-contents">
  <h2>Tabla de contenidos</h2>
  <ul class="plate-toc-list">
    ${linksList}
  </ul>
</div>
    `;
  }

  // En caso de que no haya enlaces definidos, devolver una tabla de contenidos básica
  return `
<div class="table-of-contents">
  <h2>Tabla de contenidos</h2>
  <ul class="plate-toc-list">
    <li><a href="#section-1">Sección 1</a></li>
    <li><a href="#section-2">Sección 2</a>
      <ul>
        <li><a href="#section-2-1">Sección 2.1</a></li>
      </ul>
    </li>
    <li><a href="#section-3">Sección 3</a></li>
  </ul>
</div>
  `;
};

/**
 * Renderiza una fecha con formato amigable
 * @param node - Nodo de fecha
 * @returns HTML de la fecha formateada
 */
const renderDate = (node: PlateNode): string => {
  if (!node.date) return '';
  
  const date = new Date(node.date);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  const formattedDate = date.toLocaleDateString('es-ES', options);
  
  return `<time datetime="${node.date}" class="plate-date">${formattedDate}</time>`;
};

/**
 * Renderiza un elemento con sus hijos
 * @param tag - Etiqueta HTML
 * @param node - Nodo de Plate
 * @returns HTML para el elemento
 */
const renderElement = (tag: string, node: PlateNode): string => {
  const attrs: string[] = [];
  let classNames: string[] = [];

  // Añadir clase base para el tipo de elemento
  classNames.push(`plate-${tag}`);
  
  // Procesar atributos especiales
  if (node.textAlign) {
    classNames.push(`text-${node.textAlign}`);
  }
  
  if (node.align) {
    classNames.push(`text-${node.align}`);
  }

  // Manejar indentación
  if (node.indent) {
    classNames.push(`indent-${node.indent}`);
  }

  // Manejar tipos de lista
  if (node.listStyleType) {
    classNames.push(`list-${node.listStyleType}`);
  }
  
  // Construir atributos de estilo
  const styles: string[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (['color', 'backgroundColor', 'fontSize', 'width', 'height', 'background'].includes(key)) {
      styles.push(`${toKebabCase(key)}: ${value}`);
    }
  }
  
  if (styles.length > 0) {
    attrs.push(`style="${styles.join('; ')}"`);
  }
  
  if (classNames.length > 0) {
    attrs.push(`class="${classNames.join(' ')}"`);
  }

  // Agregar ID si existe
  if (node.id) {
    attrs.push(`id="${node.id}"`);
  }
  
  const attrsString = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
  
  return `<${tag}${attrsString}>${renderChildren(node.children)}</${tag}>`;
};

/**
 * Renderiza un bloque de código con resaltado y etiqueta de idioma
 * @param node - Nodo de bloque de código
 * @returns HTML para el bloque de código
 */
const renderCodeBlock = (node: PlateNode): string => {
  const language = node.lang || 'text';
  
  return `
<div class="plate-code-block">
  <div class="plate-code-header">${language}</div>
  <div class="plate-code-content">
    <pre><code class="language-${language}">${renderChildren(node.children)}</code></pre>
  </div>
</div>
  `;
};

/**
 * Renderiza una lista (ul/ol)
 * @param node - Nodo de lista
 * @returns HTML para la lista
 */
const renderListElement = (node: PlateNode): string => {
  const tag = node.type === 'ul' ? 'ul' : 'ol';
  const attrs: string[] = [];
  
  // Clase base
  let classNames = [`plate-${tag}`];
  
  // Si tiene start, agregarlo
  if (node.start !== undefined && node.start !== 1) {
    attrs.push(`start="${node.start}"`);
  }

  // Verificar si es una lista de tareas
  const hasTodoItems = node.children && Array.isArray(node.children) && 
                       node.children.some(child => child.checked !== undefined);
  
  // Agregar tipo de lista si existe
  if (node.listStyleType) {
    classNames.push(`list-${node.listStyleType}`);
  } else {
    // Asignar clase predeterminada según el tipo de lista
    if (tag === 'ul' && !hasTodoItems) {
      classNames.push('list-disc');
    } else if (tag === 'ol') {
      classNames.push('list-decimal');
    }
  }
  
  // Agregar clase para todo-list si los elementos tienen la propiedad checked
  if (hasTodoItems) {
    classNames.push('list-todo');
  }
  
  // Aplicar estilos inline para garantizar que se muestren las viñetas/números
  let inlineStyles: string[] = [];
  if (tag === 'ul' && !hasTodoItems) {
    // Estilos más específicos para asegurar que las viñetas se muestren
    inlineStyles.push('list-style-type: disc !important');
    inlineStyles.push('padding-left: 2rem !important');
    inlineStyles.push('margin-left: 0.5rem !important');
    inlineStyles.push('display: block !important');
    inlineStyles.push('counter-reset: list-item !important');
  } else if (tag === 'ol') {
    // Estilos más específicos para asegurar que los números se muestren
    inlineStyles.push('list-style-type: decimal !important');
    inlineStyles.push('padding-left: 2rem !important');
    inlineStyles.push('margin-left: 0.5rem !important');
    inlineStyles.push('display: block !important');
    inlineStyles.push('counter-reset: list-item !important');
  } else if (hasTodoItems) {
    inlineStyles.push('list-style-type: none !important');
    inlineStyles.push('padding-left: 0 !important');
  }
  
  attrs.push(`class="${classNames.join(' ')}"`);
  
  // Solo agregar atributo de estilo si hay estilos definidos
  if (inlineStyles.length > 0) {
    attrs.push(`style="${inlineStyles.join('; ')}"`);
  }
  
  const attrsString = ' ' + attrs.join(' ');
  
  return `<${tag}${attrsString}>${renderChildren(node.children)}</${tag}>`;
};

/**
 * Renderiza una tabla
 * @param node - Nodo de tabla
 * @returns HTML para la tabla
 */
const renderTable = (node: PlateNode): string => {
  // Usar overflow-x:auto para permitir scroll horizontal en dispositivos móviles
  // Además añadir max-width: 100% para asegurar que la tabla se ajuste al contenedor
  return `<div class="plate-table-container" style="overflow-x:auto; max-width:100%"><table class="plate-table" style="width:100%">${renderChildren(node.children)}</table></div>`;
};

/**
 * Renderiza una fila de tabla con posibles estilos
 * @param node - Nodo de fila de tabla
 * @returns HTML para la fila de tabla
 */
const renderTableRow = (node: PlateNode): string => {
  const styles: string[] = [];
  const attrs: string[] = [];
  
  // Clase base
  attrs.push('class="plate-table-row"');
  
  if (node.background) {
    styles.push(`background-color: ${node.background}`);
  }
  
  if (styles.length > 0) {
    attrs.push(`style="${styles.join('; ')}"`);
  }
  
  if (node.id) {
    attrs.push(`id="${node.id}"`);
  }
  
  const attrsString = ' ' + attrs.join(' ');
  
  return `<tr${attrsString}>${renderChildren(node.children)}</tr>`;
};

/**
 * Renderiza una celda de tabla con posibles estilos
 * @param tag - 'td' o 'th'
 * @param node - Nodo de celda de tabla
 * @returns HTML para la celda de tabla
 */
const renderTableCell = (tag: string, node: PlateNode): string => {
  const styles: string[] = [];
  const attrs: string[] = [];
  
  // Clase base
  attrs.push(`class="plate-table-${tag}"`);
  
  if (node.background) {
    styles.push(`background-color: ${node.background}`);
  }
  
  // Procesar bordes si existen
  if (node.borders) {
    const { top, right, bottom, left } = node.borders;
    if (top && top.size) styles.push(`border-top: ${top.size}px solid #000`);
    if (right && right.size) styles.push(`border-right: ${right.size}px solid #000`);
    if (bottom && bottom.size) styles.push(`border-bottom: ${bottom.size}px solid #000`);
    if (left && left.size) styles.push(`border-left: ${left.size}px solid #000`);
  }
  
  if (styles.length > 0) {
    attrs.push(`style="${styles.join('; ')}"`);
  }
  
  if (node.id) {
    attrs.push(`id="${node.id}"`);
  }
  
  const attrsString = ' ' + attrs.join(' ');
  
  return `<${tag}${attrsString}>${renderChildren(node.children)}</${tag}>`;
};

/**
 * Renderiza un toggle (detalles expandibles) con estilos mejorados
 * @param node - Nodo de toggle
 * @returns HTML para el toggle
 */
const renderToggle = (node: PlateNode): string => {
  // Extraer el título y contenido
  if (!node.children || node.children.length === 0) {
    return '<details class="toggle plate-toggle"><summary class="plate-toggle-summary">Detalles</summary><div class="plate-toggle-content"></div></details>';
  }
  
  // Determinar si el toggle está abierto por defecto
  const openAttr = node.open ? ' open' : '';
  
  // El primer hijo es el título, el resto es el contenido
  const title = node.children[0] ? renderNode(node.children[0]) : 'Detalles';
  const content = node.children.slice(1).map(child => renderNode(child)).join('');
  
  return `
<details class="toggle plate-toggle"${openAttr}>
  <summary class="plate-toggle-summary">${title}</summary>
  <div class="plate-toggle-content">${content}</div>
</details>
  `;
};

/**
 * Renderiza un callout (nota destacada) con estilos específicos
 * @param node - Nodo de callout
 * @returns HTML para el callout
 */
const renderCallout = (node: PlateNode): string => {
  const icon = node.icon || '💡';
  
  // Determinar el color de fondo y borde según el tipo
  let backgroundColor = '#f3f4f6';
  let borderColor = '#9ca3af';
  
  // Aquí podrías añadir lógica para ajustar colores según el tipo de callout
  // Por ejemplo, si es una advertencia, error, nota, etc.
  
  return `
<div class="callout plate-callout" style="background-color: ${backgroundColor}; border-left-color: ${borderColor};">
  <div class="callout-icon plate-callout-icon">${icon}</div>
  <div class="callout-content plate-callout-content">${renderChildren(node.children)}</div>
</div>
  `;
};

/**
 * Renderiza una ecuación matemática con soporte para KaTeX/MathJax
 * @param node - Nodo de ecuación
 * @param isInline - Si es una ecuación inline o de bloque
 * @returns HTML para la ecuación
 */
const renderEquation = (node: PlateNode, isInline: boolean): string => {
  const formula = node.texExpression || node.formula || '';
  
  if (isInline) {
    return `<span class="math-inline plate-equation-inline">\\(${formula}\\)</span>`;
  } else {
    return `<div class="math-display plate-equation-block">\\[${formula}\\]</div>`;
  }
};

/**
 * Renderiza un grupo de columnas
 * @param node - Nodo de grupo de columnas
 * @returns HTML para el grupo de columnas
 */
const renderColumnGroup = (node: PlateNode): string => {
  return `<div class="column-group plate-column-group">${renderChildren(node.children)}</div>`;
};

/**
 * Renderiza una columna
 * @param node - Nodo de columna
 * @returns HTML para la columna
 */
const renderColumn = (node: PlateNode): string => {
  // Preparar estilos para la columna
  const styles: string[] = [];
  
  // Aplicar ancho si existe
  if (node.width) {
    styles.push(`width: ${node.width}`);
  }
  
  // Añadir otros estilos si existen
  if (node.backgroundColor) {
    styles.push(`background-color: ${node.backgroundColor}`);
  }
  
  // Generar atributo style si hay estilos
  const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
  
  return `<div class="column plate-column"${styleAttr}>${renderChildren(node.children)}</div>`;
};

/**
 * Renderiza los hijos de un nodo
 * @param children - Hijos del nodo
 * @returns HTML para los hijos
 */
const renderChildren = (children?: PlateNode[]): string => {
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
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br />'); // Preservar saltos de línea convirtiéndolos a <br />
};

/**
 * Convierte una cadena de camelCase a kebab-case
 * @param str - Cadena en camelCase
 * @returns Cadena en kebab-case
 */
const toKebabCase = (str: string): string => {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
};

/**
 * Renderiza un elemento de video de forma responsiva
 * @param node - Nodo de video
 * @returns HTML para el elemento de video
 */
const renderVideo = (node: PlateNode): string => {
  const { url, width = 640, align = 'center', caption } = node;
  if (!url) return '';

  // Estilo de alineación + overflow y padding para separar reproductores
  const alignStyle = `
    text-align: ${align};
    overflow: hidden;
    padding: 1em 0;
  `;

  // Wrapper responsivo con proporción 16:9
  const wrapperStyle = `
    position: relative;
    width: 100%;
    max-width: ${width}px;
    padding-bottom: 56.25%; /* 16:9 */
    height: 0;
  `;

  // Estilos para iframe o <video>
  const mediaStyle = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: 0;
  `;

  // Detectar YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  const youtubeId = youtubeMatch ? youtubeMatch[1] : null;

  // Detectar Vimeo
  const vimeoMatch = url.match(
    /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/
  );
  const vimeoId = vimeoMatch ? vimeoMatch[3] : null;

  let mediaHtml = '';

  if (youtubeId) {
    // YouTube
    mediaHtml = `
      <iframe
        src="https://www.youtube.com/embed/${youtubeId}"
        style="${mediaStyle}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        title="YouTube Video"
      ></iframe>
    `;
  } else if (vimeoId) {
    // Vimeo
    mediaHtml = `
      <iframe
        src="https://player.vimeo.com/video/${vimeoId}"
        style="${mediaStyle}"
        allow="autoplay; fullscreen; picture-in-picture"
        allowfullscreen
        title="Vimeo Video"
      ></iframe>
    `;
  } else {
    // Video local o URL directa
    mediaHtml = `
      <video
        src="${url}"
        controls
        preload="auto"
        style="${mediaStyle}; object-fit: contain;"
      ></video>
    `;
  }

  // Construir el HTML completo
  let html = `
    <div style="${alignStyle}">
      <figure class="plate-video-figure" style="margin: 0; display: block; width: 100%; max-width: ${width}px;">
        <div style="${wrapperStyle}">
          ${mediaHtml}
        </div>
  `;

  // Caption opcional
  if (caption && Array.isArray(caption) && caption.length) {
    const captionText =
      typeof caption[0] === 'string' ? caption[0] : extractTextFromNode(caption[0]);
    html += `
        <figcaption style="margin-top: 0.5em; text-align: center; color: #666; font-size: 0.875rem;">
          ${captionText}
        </figcaption>
    `;
  }

  html += `
      </figure>
    </div>
  `;

  return html;
};

/**
 * Renderiza un elemento de audio
 * @param node - Nodo de audio
 * @returns HTML para el elemento de audio
 */
const renderAudio = (node: PlateNode): string => {
  const { url } = node;
  if (!url) return '';

  return `
    <figure class="plate-audio-figure" style="margin: 1em 0;">
      <div style="height: 64px;">
        <audio
          src="${url}"
          controls
          class="plate-audio"
          style="width: 100%;"
        ></audio>
      </div>
    </figure>
  `;
};

/**
 * Renderiza un elemento de archivo para descarga
 * @param node - Nodo de archivo
 * @returns HTML para el elemento de archivo
 */
const renderFile = (node: PlateNode): string => {
  const { url, name = 'archivo' } = node;
  if (!url) return '';

  return `
    <div class="plate-file" style="margin: 1em 0;">
      <a
        href="${url}"
        download="${name}"
        target="_blank"
        rel="noopener noreferrer"
        style="display: inline-flex; align-items: center; padding: 8px 12px; background-color: #f3f4f6; border-radius: 4px; text-decoration: none; color: inherit;"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
        </svg>
        <span>${name}</span>
      </a>
    </div>
  `;
};