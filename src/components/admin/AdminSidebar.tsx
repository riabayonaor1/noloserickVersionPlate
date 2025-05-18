'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  FileText, 
  Menu, 
  FolderOpen, 
  LogOut,
  Settings
} from 'lucide-react';
import { logout } from '@/lib/authService';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ href, icon, label, active }) => {
  return (
    <Link 
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
      )}
    >
      <span className="w-5 h-5">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <div className="flex flex-col h-screen w-64 bg-background border-r px-4 py-6">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-xl font-bold">Panel de Admin</h1>
        <Button asChild variant="outline" size="sm" className="flex items-center justify-center gap-2">
          <Link href="/home">
            <Home size={16} /> Volver al Inicio
          </Link>
        </Button>
      </div>
      
      <nav className="space-y-2 flex-1">
        <SidebarItem 
          href="/admin/dashboard" 
          icon={<Home size={18} />} 
          label="Dashboard" 
          active={pathname === '/admin/dashboard'} 
        />
        <SidebarItem 
          href="/admin/pages" 
          icon={<FileText size={18} />} 
          label="Páginas" 
          active={pathname === '/admin/pages'} 
        />
        <SidebarItem 
          href="/admin/setup-homepage" 
          icon={<FileText size={18} />} 
          label="Configurar Inicio" 
          active={pathname === '/admin/setup-homepage'} 
        />
        <SidebarItem 
          href="/admin/menu-gestion" 
          icon={<Menu size={18} />} 
          label="Menú Jerárquico" 
          active={pathname === '/admin/menu-gestion'} 
        />
        <SidebarItem 
          href="/admin/archivos-gestion" 
          icon={<FolderOpen size={18} />} 
          label="Archivos" 
          active={pathname === '/admin/archivos-gestion'} 
        />
        <SidebarItem 
          href="/admin/settings" 
          icon={<Settings size={18} />} 
          label="Settings" 
          active={pathname === '/admin/settings'} 
        />
      </nav>
      
      <div className="mt-auto pt-4 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-accent w-full"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
};

//Ejemplo para probar el Sidebar