// src/components/admin/MenuGestionDialog.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription, // No se usa directamente en el nuevo dialog, pero se puede mantener por si acaso
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// toast no se usa directamente aquí, se maneja en el padre

interface Page {
  id: string;
  title: string;
  slug?: string;
}

interface MenuItem {
  id: string;
  name: string;
  type: string; // 'folder' or 'page'
  pageId?: string | null;
  // No hay 'url' en este modelo, se infiere de pageId y slug
  children?: MenuItem[]; // Para la prop currentItem
}

interface MenuGestionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  mode: 'add' | 'edit';
  handleSubmit: () => Promise<void>;
  isSaving: boolean;
  itemName: string;
  onItemNameChange: (name: string) => void;
  itemType: string; // 'folder' or 'page'
  onItemTypeChange: (type: string) => void;
  selectedPageId: string;
  onSelectedPageIdChange: (pageId: string) => void;
  allPages: Page[];
  currentItem: MenuItem | null;
}

export default function MenuGestionDialog({
  isOpen,
  onOpenChange,
  mode,
  handleSubmit,
  isSaving,
  itemName,
  onItemNameChange,
  itemType,
  onItemTypeChange,
  selectedPageId,
  onSelectedPageIdChange,
  allPages,
  currentItem,
}: MenuGestionDialogProps) {
  // pagesForSelect se deriva de allPages
  const pagesForSelect = allPages.map((page) => ({
    id: page.id,
    title: page.title,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent> {/* className="sm:max-w-[425px]" se puede añadir si es necesario */}
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' 
              ? 'Añadir Nuevo Elemento al Menú' 
              : 'Editar Elemento del Menú'}
          </DialogTitle>
          {/* DialogDescription podría añadirse si se desea */}
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="itemType" className="text-right">Tipo</Label>
            <Select
              value={itemType}
              onValueChange={onItemTypeChange}
              // Si currentItem tiene hijos, no se puede cambiar el tipo (asumiendo que solo las carpetas tienen hijos)
              disabled={mode === 'edit' && currentItem?.children && currentItem.children.length > 0}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="folder">Carpeta</SelectItem>
                <SelectItem value="page">Página</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {itemType === 'folder' ? (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="itemName" className="text-right">Nombre Carpeta</Label>
              <Input
                id="itemName"
                value={itemName}
                onChange={(e) => onItemNameChange(e.target.value)}
                className="col-span-3"
                placeholder="Ej. Blog"
              />
            </div>
          ) : ( // itemType === 'page'
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="selectedPageId" className="text-right">Página</Label>
              <Select
                value={selectedPageId}
                onValueChange={onSelectedPageIdChange}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una página" />
                </SelectTrigger>
                <SelectContent>
                  {pagesForSelect.map((page) => (
                    <SelectItem key={page.id} value={page.id}>
                      {page.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* El nombre del item para 'page' se toma del título de la página seleccionada */}
          {/* y se maneja en handleModalSubmit en el componente padre. */}
          {/* No se necesita un campo de 'Nombre' explícito para 'page' aquí, a menos que el diseño cambie */}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
