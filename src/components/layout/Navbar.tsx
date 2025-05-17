'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signInWithGoogle, logout } from '@/lib/authService';
import { getMenuItems, buildMenuTree, MenuItem } from '@/lib/firestoreService';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetClose 
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Menu, 
  User, 
  LogIn, 
  LogOut, 
  Settings, 
  FileEdit, 
  FolderTree, 
  FileText,
  ChevronRight,
  LayoutDashboard,
  Home,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { currentUser, isAdmin, loading } = useAuth();
  const pathname = usePathname();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuTree, setMenuTree] = useState<MenuItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Estado para controlar qué carpetas están expandidas en el menú móvil
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Cargar elementos del menú
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const items = await getMenuItems();
        setMenuItems(items);
        setMenuTree(buildMenuTree(items));
      } catch (error) {
        console.error('Error al cargar el menú:', error);
      }
    };

    fetchMenu();
  }, []);

  // Manejar inicio de sesión
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    }
  };

  // Manejar cierre de sesión
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Renderizar elementos del menú de forma recursiva (versión dropdown)
  const renderMenuDropdown = (items: MenuItem[] = []) => {
    return items.map((item) => {
      if (item.type === 'folder' && item.children && item.children.length > 0) {
        return (
          <DropdownMenuSub key={item.id}>
            <DropdownMenuSubTrigger>
              <FolderOpen className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {renderMenuDropdown(item.children)}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        );
      } else if (item.type === 'page' && item.slug) {
        return (
          <DropdownMenuItem key={item.id} asChild>
            <Link href={`/${item.slug}`}>
              <FileText className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          </DropdownMenuItem>
        );
      }
      return null;
    });
  };

  // Función para alternar el estado de expansión de una carpeta
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Renderizar elementos del menú de forma recursiva (versión móvil) con expansión/colapso
  const renderMobileMenu = (items: MenuItem[] = [], level = 0) => {
    return items.map((item) => {
      if (item.type === 'folder' && item.children && item.children.length > 0) {
        const isExpanded = expandedFolders[item.id] || false;
        
        return (
          <div key={item.id} className="pl-4">
            <div 
              className="flex items-center py-2 font-medium cursor-pointer"
              onClick={() => toggleFolder(item.id)}
            >
              <FolderOpen className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
              <ChevronRight className={cn(
                "ml-auto h-4 w-4 transition-transform",
                isExpanded ? "rotate-90" : ""
              )} />
            </div>
            {isExpanded && (
              <div className="pl-2 border-l-2 border-gray-200 ml-2">
                {renderMobileMenu(item.children, level + 1)}
              </div>
            )}
          </div>
        );
      } else if (item.type === 'page' && item.slug) {
        return (
          <SheetClose key={item.id} asChild>
            <Link 
              href={`/${item.slug}`}
              className={cn(
                "flex items-center py-2 pl-4",
                pathname === `/${item.slug}` ? "font-bold text-primary" : "font-medium"
              )}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          </SheetClose>
        );
      }
      return null;
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/home" className="mr-4 flex items-center space-x-2">
          <span className="text-xl font-bold">No lo sé Rick</span>
        </Link>

        {/* Menú de navegación desktop */}
        <nav className="hidden md:flex items-center space-x-2 flex-1">
          <Button asChild variant="ghost" size="sm" className="flex items-center gap-1">
            <Link href="/home">
              <Home className="h-4 w-4 mr-1" /> Inicio
            </Link>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                Menú
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem asChild>
                <Link href="/home">Inicio</Link>
              </DropdownMenuItem>
              
              {menuTree.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  {renderMenuDropdown(menuTree)}
                </>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/archivos">
                  <FolderTree className="mr-2 h-4 w-4" />
                  <span>Archivos</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Admin Button in Nav - For Desktop */}
          {!loading && isAdmin && (
            <Button asChild variant="outline" size="sm" className="ml-2">
              <Link href="/admin/dashboard" className="flex items-center gap-1">
                <LayoutDashboard className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            </Button>
          )}
        </nav>

        {/* Acciones de usuario */}
        <div className="flex items-center">
          {!loading && (
            <>
              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={currentUser.photoURL || undefined} alt={currentUser.displayName || 'Usuario'} />
                        <AvatarFallback>{currentUser.displayName?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline-flex">
                        {currentUser.displayName || 'Usuario'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {isAdmin && (
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link href="/admin/dashboard">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Panel de Admin</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/plate-editor">
                            <FileEdit className="mr-2 h-4 w-4" />
                            <span>Editor de Páginas</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </DropdownMenuGroup>
                    )}
                    
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" onClick={handleSignIn} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span>Iniciar Sesión</span>
                </Button>
              )}
            </>
          )}

          {/* Menú móvil */}
          <div className="md:hidden ml-2">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col space-y-4 py-4">
                  <SheetClose asChild>
                    <Link 
                      href="/home"
                      className={cn(
                        "flex items-center py-2",
                        pathname === "/home" ? "font-bold text-primary" : "font-medium"
                      )}
                    >
                      <Home className="mr-2 h-4 w-4" /> Inicio
                    </Link>
                  </SheetClose>
                  
                  {menuTree.length > 0 && (
                    <div className="space-y-2">
                      {renderMobileMenu(menuTree)}
                    </div>
                  )}
                  
                  <SheetClose asChild>
                    <Link 
                      href="/archivos"
                      className={cn(
                        "flex items-center py-2",
                        pathname === "/archivos" ? "font-bold text-primary" : "font-medium"
                      )}
                    >
                      <FolderTree className="mr-2 h-4 w-4" /> Archivos
                    </Link>
                  </SheetClose>
                  
                  {isAdmin && (
                    <div className="pt-4 mt-4 border-t">
                      <div className="font-bold mb-2">Administración</div>
                      <SheetClose asChild>
                        <Link 
                          href="/admin/dashboard"
                          className="flex items-center py-2 pl-4"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Panel de Admin</span>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link 
                          href="/plate-editor"
                          className="flex items-center py-2 pl-4"
                        >
                          <FileEdit className="mr-2 h-4 w-4" />
                          <span>Editor de Páginas</span>
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
