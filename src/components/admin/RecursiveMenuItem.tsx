'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, File, Folder, Edit, Trash, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Draggable, Droppable } from 'react-beautiful-dnd';

export const RecursiveMenuItem = ({ 
  item, 
  index, 
  level = 0, 
  onOpenModal, 
  onDelete,
  onDragEnd
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const isFolder = item.type === 'folder';
  
  const toggleOpen = (e) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  const handleEdit = (e) => {
    e.stopPropagation();
    onOpenModal('edit', item.parentId, item);
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de eliminar "${item.name}" ${hasChildren ? 'y todos sus sub-elementos' : ''}?`)) {
      onDelete(item.id);
    }
  };
  
  const handleAddChild = (e) => {
    e.stopPropagation();
    onOpenModal('add', item.id);
  };
  
  return (
    <Draggable draggableId={item.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "mb-1 select-none",
            snapshot.isDragging && "opacity-70"
          )}
        >
          <div 
            className={cn(
              "flex items-center p-2 rounded-md text-sm",
              "hover:bg-accent/50 transition-colors",
              snapshot.isDragging && "bg-accent"
            )}
            onClick={isFolder ? toggleOpen : undefined}
          >
            <div 
              className="mr-2 cursor-grab"
              {...provided.dragHandleProps}
            >
              <GripVertical size={16} className="text-muted-foreground" />
            </div>
            
            <div style={{ marginLeft: `${level * 12}px` }} className="flex items-center flex-1">
              {isFolder ? (
                <button 
                  type="button" 
                  onClick={toggleOpen}
                  className="mr-1"
                >
                  {isOpen ? (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronRight size={16} className="text-muted-foreground" />
                  )}
                </button>
              ) : (
                <div className="w-4 mr-1"></div>
              )}
              
              {isFolder ? (
                <Folder size={16} className="mr-2 text-amber-500" />
              ) : (
                <File size={16} className="mr-2 text-blue-500" />
              )}
              
              <span className="flex-1 truncate">{item.name}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={handleEdit}
              >
                <Edit size={14} />
                <span className="sr-only">Editar</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-destructive"
                onClick={handleDelete}
              >
                <Trash size={14} />
                <span className="sr-only">Eliminar</span>
              </Button>
              
              {isFolder && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={handleAddChild}
                >
                  <ChevronDown size={14} />
                  <span className="sr-only">Añadir elemento</span>
                </Button>
              )}
            </div>
          </div>
          
          {isFolder && hasChildren && isOpen && (
            <Droppable droppableId={item.id} type="MENU_ITEM">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "pl-4 ml-6 border-l mt-1 overflow-y-auto max-h-[calc(100vh-10rem)]",
                    snapshot.isDraggingOver && "border-primary"
                  )}
                >
                  {item.children.map((child, childIndex) => (
                    <RecursiveMenuItem
                      key={child.id}
                      item={child}
                      index={childIndex}
                      level={level + 1}
                      onOpenModal={onOpenModal}
                      onDelete={onDelete}
                      onDragEnd={onDragEnd}
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>
      )}
    </Draggable>
  );
};
