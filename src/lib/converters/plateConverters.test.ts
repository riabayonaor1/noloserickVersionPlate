import { PlateImporter } from './plateConverters'; // Assuming fromMarkdown is part of PlateImporter
import { Descendant } from '@udecode/plate';

// Helper to simplify the expected output for single paragraph with single text node
const p = (text: string, props = {}): Descendant => ({
  type: 'p',
  children: [{ text, ...props }],
});

// Helper for code blocks
const codeBlock = (code: string): Descendant => ({
  type: 'code_block',
  children: [{ text: code }],
});

// Helper for headings
const heading = (level: 1 | 2 | 3 | 4 | 5 | 6, text: string): Descendant => ({
  type: `h${level}`,
  children: [{ text }],
});


describe('PlateImporter.fromMarkdown', () => {
  it('should convert empty markdown to an empty paragraph', () => {
    const markdown = '';
    const expected: Descendant[] = [{ type: 'p', children: [{ text: '' }] }];
    expect(PlateImporter.fromMarkdown(markdown)).toEqual(expected);
  });

  it('should convert a simple paragraph', () => {
    const markdown = 'Hello, world!';
    const expected: Descendant[] = [p('Hello, world!')];
    expect(PlateImporter.fromMarkdown(markdown)).toEqual(expected);
  });

  it('should convert an H1 heading', () => {
    const markdown = '# Hello Header';
    const expected: Descendant[] = [heading(1, 'Hello Header')];
    expect(PlateImporter.fromMarkdown(markdown)).toEqual(expected);
  });

  it('should convert bold text within a paragraph', () => {
    const markdown = 'This is **bold** text.';
    // Expected: paragraph with 'This is ', then bold 'bold', then ' text.'
    const expected: Descendant[] = [{
      type: 'p',
      children: [
        { text: 'This is ' },
        { text: 'bold', bold: true },
        { text: ' text.' },
      ],
    }];
    expect(PlateImporter.fromMarkdown(markdown)).toEqual(expected);
  });

  it('should convert italic text within a paragraph', () => {
    const markdown = 'This is *italic* text.';
    const expected: Descendant[] = [{
      type: 'p',
      children: [
        { text: 'This is ' },
        { text: 'italic', italic: true },
        { text: ' text.' },
      ],
    }];
    expect(PlateImporter.fromMarkdown(markdown)).toEqual(expected);
  });

  it('should convert a code block', () => {
    const markdown = '```\nconst x = 10;\nconsole.log(x);\n```';
    const expected: Descendant[] = [codeBlock('const x = 10;\nconsole.log(x);')];
    expect(PlateImporter.fromMarkdown(markdown)).toEqual(expected);
  });

  it('should convert inline code', () => {
    const markdown = 'Use `myVariable` in your code.';
    const expected: Descendant[] = [{
      type: 'p',
      children: [
        { text: 'Use ' },
        { text: 'myVariable', code: true },
        { text: ' in your code.' },
      ],
    }];
    expect(PlateImporter.fromMarkdown(markdown)).toEqual(expected);
  });

  it('should convert markdown with multiple elements', () => {
    const markdown = '# Title\n\nThis is a paragraph.\n\nAnd **another** one with *emphasis*.';
    const expected: Descendant[] = [
      heading(1, 'Title'),
      p('This is a paragraph.'),
      {
        type: 'p',
        children: [
          { text: 'And ' },
          { text: 'another', bold: true },
          { text: ' one with ' },
          { text: 'emphasis', italic: true },
          { text: '.'}
        ],
      },
    ];
    expect(PlateImporter.fromMarkdown(markdown)).toEqual(expected);
  });

  it('should convert markdown with bold and italic text nested', () => {
    const markdown = 'This is ***bold and italic*** text.';
    const expected: Descendant[] = [{
      type: 'p',
      children: [
        { text: 'This is ' },
        // Remark usually parses "***text***" as strong(emphasis(text)) or emphasis(strong(text))
        // The current transformer logic might apply bold to an italic node or vice-versa.
        // Let's assume strong wraps emphasis: { text: 'bold and italic', bold: true, italic: true }
        // Or more accurately, remark would produce emphasis node inside strong node.
        // The current transformer processes children and then applies the mark.
        // strong: children.map(child => ({ ...child, bold: true }))
        // emphasis: children.map(child => ({ ...child, italic: true }))
        // So if markdown is **_test_** -> strong node has child emphasis node, which has child text node.
        // transform(textNode) -> {text: "test"}
        // transform(emphasisNode) -> its child is {text: "test"}, so it returns [{text: "test", italic: true}]
        // transform(strongNode) -> its child is {text: "test", italic: true}, so it returns [{text: "test", italic: true, bold: true}]
        { text: 'bold and italic', bold: true, italic: true },
        { text: ' text.' },
      ],
    }];
    expect(PlateImporter.fromMarkdown(markdown)).toEqual(expected);
  });

  it('should handle multiple paragraphs', () => {
    const markdown = 'First paragraph.\n\nSecond paragraph.';
    const expected: Descendant[] = [
      p('First paragraph.'),
      p('Second paragraph.')
    ];
    expect(PlateImporter.fromMarkdown(markdown)).toEqual(expected);
  });

  it('should handle headings of different levels', () => {
    const markdown = '# H1\n\n## H2\n\n### H3';
    const expected: Descendant[] = [
      heading(1, 'H1'),
      heading(2, 'H2'),
      heading(3, 'H3'),
    ];
    expect(PlateImporter.fromMarkdown(markdown)).toEqual(expected);
  });

  it('should correctly parse multiple inline styles in the same paragraph', () => {
    const markdown = "**Bold** then *italic* then `code`."
    const expected: Descendant[] = [{
        type: 'p',
        children: [
            { text: "Bold", bold: true },
            { text: " then " },
            { text: "italic", italic: true },
            { text: " then " },
            { text: "code", code: true },
            { text: "." }
        ]
    }]
    expect(PlateImporter.fromMarkdown(markdown)).toEqual(expected);
  });

  it('should return an empty paragraph for markdown that is just whitespace', () => {
    const markdown = '   \n\t  \n  ';
    // Remark usually trims this and might produce an empty AST or an AST with empty text nodes.
    // Depending on remark's output, our transformer might produce an empty paragraph.
    const expected: Descendant[] = [{ type: 'p', children: [{ text: '' }] }];
    // The current implementation of fromMarkdown returns the result of transformNode(ast)
    // If ast is empty or only whitespace, transformNode('root') might return empty array or [{ type: 'p', children: [{ text: '' }] }]
    // The final check `plateContent.length > 0 ? plateContent : [{ type: 'p', children: [{ text: '' }] }];` ensures this.
    expect(PlateImporter.fromMarkdown(markdown)).toEqual(expected);
  });

  it('should handle paragraphs with leading/trailing spaces around inline marks', () => {
    const markdown = "Text with ** bold ** and * italic *."
    const expected: Descendant[] = [{
        type: 'p',
        children: [
            { text: "Text with " },
            { text: " bold ", bold: true },
            { text: " and " },
            { text: " italic ", italic: true },
            { text: "." }
        ]
    }]
    expect(PlateImporter.fromMarkdown(markdown)).toEqual(expected);
  });

});
