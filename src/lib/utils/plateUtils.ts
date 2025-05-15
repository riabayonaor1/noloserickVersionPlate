/**
 * Funciones para convertir contenido JSON de Plate a HTML
 */

/**
 * Convierte contenido JSON de Plate a HTML
 * @param {string|object} jsonContent - Contenido en formato JSON o string JSON
 * @returns {string} HTML generado
 */
export const convertPlateJsonToHtml = (jsonContent) => {
  // Si es una cadena, intentar parsearla como JSON
  let content;
  if (typeof jsonContent === 'string') {
    try {
      content = JSON.parse(jsonContent);
    } catch (error) {
      // Si no es JSON válido, devolver el contenido tal cual
      console.warn("No se pudo parsear como JSON, devolviendo contenido original", error);
      return jsonContent;
    }
  } else {
    content = jsonContent;
  }

  // Si no es un array, devolver el contenido tal cual
  if (!Array.isArray(content)) {
    console.warn("El contenido no es un array, devolviendo como string:", content);
    return String(jsonContent);
  }

  console.log("Convirtiendo contenido JSON a HTML, nodos:", content.length);

  // Convertir cada nodo a HTML
  let html = '<div class="max-w-full mx-auto space-y-4">';

  for (const node of content) {
    if (!node || !node.type) {
      console.warn("Nodo inválido en el contenido:", node);
      continue;
    }
    
    // Verificar correctamente los nodos - no todos tienen children
    const hasValidChildren = node.children && Array.isArray(node.children);
    const isSpecialElement = ['img', 'hr', 'equation', 'inlineEquation', 'texExpression'].includes(node.type);
    
    if (!hasValidChildren && !isSpecialElement) {
      console.warn("Nodo sin hijos válidos (no es elemento especial):", node);
      continue;
    }

    // Extraer el estilo si existe
    const style = extractStyleFromNode(node);
    const align = node.textAlign || node.align || '';
    const alignClass = align ? `text-${align}` : '';
    
    switch (node.type) {
      case 'h1':
        html += `<h1 class="text-4xl font-bold mb-4 ${alignClass}" style="${style}">${renderChildren(node.children)}</h1>`;
        break;
      case 'h2':
        html += `<h2 class="text-2xl font-bold mt-6 mb-3 ${alignClass}" style="${style}">${renderChildren(node.children)}</h2>`;
        break;
      case 'h3':
        html += `<h3 class="text-xl font-bold mt-4 mb-2 ${alignClass}" style="${style}">${renderChildren(node.children)}</h3>`;
        break;
      case 'h4':
        html += `<h4 class="text-lg font-bold mt-3 mb-2 ${alignClass}" style="${style}">${renderChildren(node.children)}</h4>`;
        break;
      case 'h5':
        html += `<h5 class="text-base font-bold mt-3 mb-1 ${alignClass}" style="${style}">${renderChildren(node.children)}</h5>`;
        break;
      case 'h6':
        html += `<h6 class="text-sm font-bold mt-3 mb-1 ${alignClass}" style="${style}">${renderChildren(node.children)}</h6>`;
        break;
      case 'p':
        html += `<p class="mb-4 ${alignClass}" style="${style}">${renderChildren(node.children)}</p>`;
        break;
      case 'blockquote':
        html += `<blockquote class="border-l-4 border-gray-300 pl-4 italic my-4 ${alignClass}" style="${style}">${renderChildren(node.children)}</blockquote>`;
        break;
      case 'ul':
        html += `<ul class="list-disc pl-6 mb-4" style="${style}">${renderChildrenList(node.children)}</ul>`;
        break;
      case 'ol':
        html += `<ol class="list-decimal pl-6 mb-4" style="${style}">${renderChildrenList(node.children)}</ol>`;
        break;
      case 'li':
        html += `<li style="${style}">${renderChildren(node.children)}</li>`;
        break;
      case 'checklist':
        html += `<ul class="pl-6 mb-4 checklist" style="${style}">${renderChildrenList(node.children)}</ul>`;
        break;
      case 'check-list-item':
        const checked = node.checked ? 'checked' : '';
        html += `<li class="flex items-start my-1" style="${style}">
                  <input type="checkbox" ${checked} class="mt-1 mr-2" disabled />
                  <div>${renderChildren(node.children)}</div>
                </li>`;
        break;
      case 'code_block':
        html += `<pre><code class="p-4 bg-gray-100 dark:bg-gray-800 block rounded-md overflow-x-auto" style="${style}">${renderChildren(node.children)}</code></pre>`;
        break;
      case 'code_line':
        html += `${renderChildren(node.children)}\n`;
        break;
      case 'img':
        // Si el nodo tiene una URL
        if (node.url) {
          const alt = node.alt || '';
          // Extraer las propiedades específicas de imágenes
          const width = node.width ? `width: ${node.width};` : '';
          const height = node.height ? `height: ${node.height};` : '';
          const imgStyle = `${style}${width}${height}`;
          
          // Crear contenedor con alineación para la imagen
          html += `<figure class="my-4 ${alignClass}" style="${style}">
                    <img src="${node.url}" alt="${alt}" class="max-w-full rounded-md" style="${imgStyle}" />
                    ${node.caption ? `<figcaption class="text-center text-gray-500 text-sm mt-1">${node.caption}</figcaption>` : ''}
                  </figure>`;
        }
        break;
      case 'a':
        if (node.url) {
          html += `<a href="${node.url}" class="text-blue-500 hover:underline" style="${style}">${renderChildren(node.children)}</a>`;
        } else {
          html += renderChildren(node.children);
        }
        break;
      case 'hr':
        html += `<hr class="my-4 border-t border-gray-300" style="${style}" />`;
        break;
      case 'table':
        html += `<div class="overflow-x-auto my-4">
                  <table class="w-full border-collapse border border-gray-300" style="${style}">
                    ${renderTableContent(node.children)}
                  </table>
                </div>`;
        break;
      case 'tr':
        html += `<tr style="${style}">${renderTableRowContent(node.children)}</tr>`;
        break;
      case 'th':
      case 'td':
        // Usar el tipo de celda directamente del nodo
        const tag = node.type;
        html += `<${tag} class="border border-gray-300 p-2" style="${style}">${renderChildren(node.children)}</${tag}>`;
        break;
      case 'table_row':
        html += `<tr style="${style}">${renderTableRowContent(node.children)}</tr>`;
        break;
      case 'table_cell':
        // Determinar si es encabezado
        const isHeader = node.header === true;
        const cellTag = isHeader ? 'th' : 'td';
        html += `<${cellTag} class="border border-gray-300 p-2" style="${style}">${renderChildren(node.children)}</${cellTag}>`;
        break;
      case 'table_header':
        html += `<thead style="${style}">${renderTableContent(node.children)}</thead>`;
        break;
      case 'table_body':
        html += `<tbody style="${style}">${renderTableContent(node.children)}</tbody>`;
        break;
      case 'texExpression':
      case 'equation':
        // Para ecuaciones matemáticas, usamos MathJax sintaxis
        const texExpression = node.texExpression || node.formula || '';
        html += `<div class="equation-container my-4 text-center">
                  <div class="tex-math">\\(${texExpression.replace(/\\/g, '\\\\')}\\)</div>
                </div>`;
        break;
      case 'inlineEquation':
        // Para ecuaciones inline
        const inlineExpression = node.formula || '';
        html += `<span class="inline-equation tex-math">\\(${inlineExpression.replace(/\\/g, '\\\\')}\\)</span>`;
        break;
      case 'callout':
        const calloutIcon = node.icon || '💡';
        const calloutColor = node.color || 'blue';
        html += `<div class="callout my-4 p-4 bg-${calloutColor}-50 border-l-4 border-${calloutColor}-500 rounded-md" style="${style}">
                  <div class="flex items-start">
                    <span class="text-xl mr-2">${calloutIcon}</span>
                    <div>${renderChildren(node.children)}</div>
                  </div>
                </div>`;
        break;
      case 'toggle':
        html += `<details class="toggle mb-4 border border-gray-200 rounded-md" style="${style}">
                  <summary class="cursor-pointer p-2 bg-gray-50">
                    ${node.children && node.children.length > 0 ? renderChildren([node.children[0]]) : ''}
                  </summary>
                  <div class="p-4">
                    ${node.children && node.children.length > 1 ? renderChildren(node.children.slice(1)) : ''}
                  </div>
                </details>`;
        break;
      case 'column-layout':
        html += `<div class="grid grid-cols-${node.columns || 2} gap-4 my-4" style="${style}">${renderColumnContent(node.children)}</div>`;
        break;
      case 'column':
        html += `<div class="column" style="${style}">${renderChildren(node.children)}</div>`;
        break;
      case 'date':
        html += `<span class="inline-date">${node.value || ''}</span>`;
        break;
      default:
        console.log("Tipo de nodo no reconocido:", node.type);
        if (hasValidChildren) {
          html += `<div class="${alignClass}" style="${style}">${renderChildren(node.children)}</div>`;
        } else {
          html += `<div class="${alignClass}" style="${style}">${node.type || ''}</div>`;
        }
    }
  }

  html += '</div>';
  return html;
};

/**
 * Renderiza contenido de columnas
 * @param {Array} children - Nodos hijos
 * @returns {string} HTML generado
 */
const renderColumnContent = (children) => {
  if (!children || !Array.isArray(children)) return '';

  let html = '';
  
  for (const child of children) {
    const style = extractStyleFromNode(child);
    
    if (child.type === 'column') {
      html += `<div class="column" style="${style}">${renderChildren(child.children)}</div>`;
    } else {
      html += renderChildren([child]);
    }
  }
  
  return html;
};

/**
 * Extrae estilos (como color) de un nodo
 * @param {Object} node - Nodo del que extraer estilos
 * @returns {string} Cadena de estilo CSS
 */
const extractStyleFromNode = (node) => {
  let style = '';
  
  // Procesar todos los atributos que empiezan con "style" o son conocidos como estilos
  Object.keys(node).forEach(key => {
    // Atributos de estilo conocidos
    if ([
      'textAlign', 'color', 'backgroundColor', 'fontSize', 'fontWeight',
      'lineHeight', 'letterSpacing', 'borderColor', 'borderWidth',
      'borderStyle', 'borderRadius', 'padding', 'margin', 'width',
      'height', 'textDecoration', 'fontStyle', 'display', 'verticalAlign',
      'textTransform'
    ].includes(key)) {
      style += `${camelToKebab(key)}: ${node[key]};`;
    }
    // Atributos que empiezan con "style"
    else if (key.startsWith('style') && key !== 'style') {
      const cssProperty = camelToKebab(key.slice(5).charAt(0).toLowerCase() + key.slice(6));
      style += `${cssProperty}: ${node[key]};`;
    }
  });
  
  // Aplicar el atributo de textAlign como text-align
  if (node.textAlign) {
    style += `text-align: ${node.textAlign};`;
  }
  
  return style;
};

/**
 * Convierte una cadena en camelCase a kebab-case
 * @param {string} str - Cadena en camelCase
 * @returns {string} Cadena en kebab-case
 */
const camelToKebab = (str) => {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
};

/**
 * Renderiza el contenido de una tabla
 * @param {Array} children - Nodos hijos de la tabla
 * @returns {string} HTML generado
 */
const renderTableContent = (children) => {
  if (!children || !Array.isArray(children)) return '';

  let html = '';
  
  for (const child of children) {
    const style = extractStyleFromNode(child);
    
    if (child.type === 'table_row') {
      html += `<tr style="${style}">${renderTableRowContent(child.children)}</tr>`;
    } else if (child.type === 'table_header') {
      html += `<thead style="${style}">${renderTableContent(child.children)}</thead>`;
    } else if (child.type === 'table_body') {
      html += `<tbody style="${style}">${renderTableContent(child.children)}</tbody>`;
    } else {
      html += renderChildren([child]);
    }
  }
  
  return html;
};

/**
 * Renderiza el contenido de una fila de tabla
 * @param {Array} children - Nodos hijos de la fila
 * @returns {string} HTML generado
 */
const renderTableRowContent = (children) => {
  if (!children || !Array.isArray(children)) return '';

  let html = '';
  
  for (const child of children) {
    const style = extractStyleFromNode(child);
    
    if (child.type === 'table_cell') {
      // Determinar si es encabezado
      const isHeader = child.header === true;
      const tag = isHeader ? 'th' : 'td';
      html += `<${tag} class="border border-gray-300 p-2" style="${style}">${renderChildren(child.children)}</${tag}>`;
    } else {
      html += renderChildren([child]);
    }
  }
  
  return html;
};

/**
 * Renderiza los hijos de nodos anidados, como ul > li
 * @param {Array} children - Nodos hijos a renderizar
 * @returns {string} HTML generado
 */
const renderChildrenList = (children) => {
  if (!children || !Array.isArray(children)) return '';

  let html = '';
  
  for (const child of children) {
    if (child.type === 'li') {
      const style = extractStyleFromNode(child);
      html += `<li style="${style}">${renderChildren(child.children)}</li>`;
    } else {
      html += renderChildren([child]);
    }
  }
  
  return html;
};

/**
 * Renderiza los nodos hijos con su formato
 * @param {Array} children - Nodos hijos a renderizar
 * @param {string} wrapTag - Etiqueta opcional para envolver el contenido
 * @returns {string} HTML generado
 */
const renderChildren = (children, wrapTag = '') => {
  if (!children || !Array.isArray(children)) return '';

  let html = '';
  
  for (const child of children) {
    if (typeof child === 'string') {
      html += child;
      continue;
    }

    if (!child) continue;

    let textContent = child.text || '';
    let style = '';
    
    // Recopilar estilos del texto - procesar todos los atributos que podrían ser estilos
    Object.keys(child).forEach(key => {
      // Atributos de estilo conocidos
      if ([
        'color', 'backgroundColor', 'fontSize', 'fontWeight',
        'lineHeight', 'letterSpacing', 'textAlign', 'textDecoration',
        'fontStyle', 'verticalAlign', 'textTransform'
      ].includes(key)) {
        style += `${camelToKebab(key)}: ${child[key]};`;
      }
      // Atributos que empiezan con "style"
      else if (key.startsWith('style') && key !== 'style') {
        const cssProperty = camelToKebab(key.slice(5).charAt(0).toLowerCase() + key.slice(6));
        style += `${cssProperty}: ${child[key]};`;
      }
    });
    
    // Aplicar formato
    if (style) {
      textContent = `<span style="${style}">${textContent}</span>`;
    }
    
    if (child.bold) textContent = `<strong>${textContent}</strong>`;
    if (child.italic) textContent = `<em>${textContent}</em>`;
    if (child.underline) textContent = `<u>${textContent}</u>`;
    if (child.code) textContent = `<code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">${textContent}</code>`;
    if (child.strikethrough) textContent = `<del>${textContent}</del>`;
    
    if (wrapTag) {
      html += `<${wrapTag}>${textContent}</${wrapTag}>`;
    } else {
      html += textContent;
    }
  }
  
  return html;
};
