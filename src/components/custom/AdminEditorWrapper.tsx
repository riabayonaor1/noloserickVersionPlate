'use client';

import React, { useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// 1) Trae sólo de '@udecode/plate/react'
import {
  Plate,
  PlateContent,
  createPlatePlugin,
  createPlateEditor,
} from '@udecode/plate/react';

// 2) Plugins individuales de Plate v48
import { MentionPlugin } from '@udecode/plate-mention/react';
import { BaseFontSizePlugin } from '@udecode/plate-font';
// …importa aquí cualquier otro plugin que uses

// 3) Tus componentes UI propios
import { basePlugins } from '@/config/plate-plugins';
import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { FixedToolbarButtons } from '@/components/ui/fixed-toolbar-buttons';
import { FloatingToolbar } from '@/components/ui/floating-toolbar';
import { FloatingToolbarButtons } from '@/components/ui/floating-toolbar-buttons';
import { CursorOverlay } from '@/components/ui/cursor-overlay';
import { Editor } from '@/components/ui/editor';

interface Props {
  initialValue?: any[];
  onSave: (content: any[], title: string) => Promise<void>;
  pageTitle?: string;
  isSaving?: boolean;
}

export const AdminEditorWrapper: React.FC<Props> = ({
  initialValue = [{ type: 'p', children: [{ text: '' }] }],
  onSave,
  pageTitle: initialTitle = '',
  isSaving,
}) => {
  // 4) Memoiza los plugins
  const plugins = useMemo(
    () =>
      [
        // primero tus plugins base
        ...basePlugins,
        // luego los extras que importaste
        MentionPlugin,
        BaseFontSizePlugin,
      ].map((plugin) => createPlatePlugin(plugin as any)),
    []
  );

  // 5) Crea el editor con el HTML (o value) inicial
  const editor = useMemo(() => {
    const ed = createPlateEditor({ plugins });
    ed.children = initialValue;
    return ed;
  }, [initialValue, plugins]);

  const [value, setValue] = useState(editor.children);
  const [title, setTitle] = useState(initialTitle);

  const handleSave = async () => {
    await onSave(value, title);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      {/* 6) Renderiza Plate directamente */}
      <Plate editor={editor} onChange={({ value }) => setValue(value)}>
        <div className="space-y-4 p-4 border rounded-lg shadow-sm">
          <input
            type="text"
            placeholder="Título de la Página"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-md text-2xl font-semibold mb-4"
          />

          <FixedToolbar>
            <FixedToolbarButtons />
          </FixedToolbar>

          {/* 7) Tu editor “hint”, envuelve tu propio componente */}
          <Editor
            placeholder="Empieza a escribir tu contenido..."
            className="min-h-[600px] border rounded-md p-4 focus-within:ring-2 focus-within:ring-ring"
            autoFocus
          />

          <FloatingToolbar>
            <FloatingToolbarButtons />
          </FloatingToolbar>

          <CursorOverlay />

          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar Página'}
          </button>
        </div>

        {/* 8) Renderiza el contenido real */}
        <PlateContent />
      </Plate>
    </DndProvider>
  );
};