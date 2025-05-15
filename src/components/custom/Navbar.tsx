'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AuthButton } from './AuthButton';
import { useAuth } from '@/contexts/AuthContext';
import { getMenuItems, buildMenuTree } from '@/lib/firestoreService';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isAdmin } = useAuth();
  const pathname = usePathname();
  const [menuItems, setMenuItems] = useState([]);
  const [menuTree, setMenuTree] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoadingMenu(true);
        const items = await getMenuItems();
        setMenuItems(items);
        
        const tree = buildMenuTree(items);
        setMenuTree(tree);
      } catch (error) {
        console.error('Error al cargar el menú:', error);
      } finally {
        setLoadingMenu(false);
      }
    };
    
    fetchMenu();
  }, []);

  const renderMenuItems = (items) => {
    return items.map((item) => {
      if (item.type === 'folder' && item.children && item.children.length > 0) {
        return (
          <NavigationMenuItem key={item.id}>
            <NavigationMenuTrigger>{item.name}</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px]">
                {item.children.map((child) => {
                  if (child.type === 'folder' && child.children && child.children.length > 0) {
                    return (
                      <li key={child.id} className="mb-2">
                        <h4 className="font-medium mb-1 text-sm text-muted-foreground">{child.name}</h4>
                        <ul className="grid grid-cols-1 gap-2">
                          {child.children.map((grandChild) => {
                            if (grandChild.type === 'page' && grandChild.slug) {
                              return (
                                <li key={grandChild.id}>
                                  <NavigationMenuLink asChild>
                                    <Link
                                      href={`/pagina/${grandChild.slug}`}
                                      className={cn(
                                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                      )}
                                    >
                                      <div className="text-sm font-medium leading-none">{grandChild.name}</div>
                                    </Link>
                                  </NavigationMenuLink>
                                </li>
                              );
                            }
                            return null;
                          })}
                        </ul>
                      </li>
                    );
                  } else if (child.type === 'page' && child.slug) {
                    return (
                      <li key={child.id}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={`/pagina/${child.slug}`}
                            className={cn(
                              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            )}
                          >
                            <div className="text-sm font-medium leading-none">{child.name}</div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        );
      } else if (item.type === 'page' && item.slug) {
        return (
          <NavigationMenuItem key={item.id}>
            <Link href={`/pagina/${item.slug}`} legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                {item.name}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        );
      }
      return null;
    });
  };

  const renderMobileMenuItems = (items, level = 0) => {
    return items.map((item) => {
      if (item.type === 'folder' && item.children && item.children.length > 0) {
        return (
          <div key={item.id} className="mb-2">
            <h4 className={cn("font-medium mb-1", level === 0 ? "text-base" : "text-sm text-muted-foreground")}>{item.name}</h4>
            <div className={`pl-4 ${level > 0 ? 'border-l' : ''}`}>
              {renderMobileMenuItems(item.children, level + 1)}
            </div>
          </div>
        );
      } else if (item.type === 'page' && item.slug) {
        return (
          <div key={item.id} className="mb-2">
            <Link href={`/pagina/${item.slug}`}>
              <span className={cn(
                "block py-2 hover:text-primary",
                pathname === `/pagina/${item.slug}` && "font-medium text-primary"
              )}>
                {item.name}
              </span>
            </Link>
          </div>
        );
      }
      return null;
    });
  };

  return (
    <nav className="bg-background border-b px-4 py-2 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-bold text-lg">
            App Plate
          </Link>
          
          {/* Menú para escritorio */}
          <div className="hidden md:flex">
            <NavigationMenu>
              <NavigationMenuList>
                {loadingMenu ? (
                  <NavigationMenuItem>
                    <span className="text-sm text-muted-foreground">Cargando menú...</span>
                  </NavigationMenuItem>
                ) : (
                  renderMenuItems(menuTree)
                )}
                
                {isAdmin && (
                  <NavigationMenuItem>
                    <Link href="/admin/dashboard" legacyBehavior passHref>
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        Panel de Admin
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <AuthButton />
          
          {/* Menú para móvil */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="py-4">
                <h3 className="text-lg font-bold mb-4">Menú</h3>
                <div className="space-y-2">
                  <Link href="/">
                    <span className={cn(
                      "block py-2 hover:text-primary",
                      pathname === "/" && "font-medium text-primary"
                    )}>
                      Inicio
                    </span>
                  </Link>
                  
                  {isAdmin && (
                    <Link href="/admin/dashboard">
                      <span className={cn(
                        "block py-2 hover:text-primary",
                        pathname === "/admin/dashboard" && "font-medium text-primary"
                      )}>
                        Panel de Admin
                      </span>
                    </Link>
                  )}
                  
                  {loadingMenu ? (
                    <p className="text-sm text-muted-foreground">Cargando menú...</p>
                  ) : (
                    renderMobileMenuItems(menuTree)
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};
