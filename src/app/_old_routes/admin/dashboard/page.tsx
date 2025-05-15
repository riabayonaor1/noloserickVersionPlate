'use client';

import React from 'react';
import { AdminRoute } from '@/components/auth/AdminRoute';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileEdit, FolderTree, FileText, PlusCircle, Edit, Settings } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <AdminRoute>
      <div className="container mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8">Panel de Administración</h1>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visión General</TabsTrigger>
            <TabsTrigger value="content">Contenido</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileEdit className="w-5 h-5 text-primary" /> 
                    <span>Editor de Contenido</span>
                  </CardTitle>
                  <CardDescription>Crea y edita páginas con el editor Plate</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Utiliza el editor visual avanzado para crear páginas con contenido rico y personalizable.</p>
                </CardContent>
                <CardFooter>
                  <Button asChild>
                    <Link href="/plate-editor">Abrir Editor</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-primary" /> 
                    <span>Menú Jerárquico</span>
                  </CardTitle>
                  <CardDescription>Gestiona la estructura de navegación</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Organiza la estructura de navegación de tu sitio con un menú jerárquico intuitivo.</p>
                </CardContent>
                <CardFooter>
                  <Button asChild>
                    <Link href="/admin/menu">Gestionar Menú</Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> 
                    <span>Archivos y Medios</span>
                  </CardTitle>
                  <CardDescription>Administra tus archivos y medios</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Sube y organiza archivos para usar en tu contenido, con carpetas jerárquicas.</p>
                </CardContent>
                <CardFooter>
                  <Button asChild>
                    <Link href="/admin/files">Gestionar Archivos</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Acciones Rápidas</h2>
              <div className="flex flex-wrap gap-4">
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/plate-editor">
                    <PlusCircle className="w-4 h-4" /> Nueva Página
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/admin/pages">
                    <Edit className="w-4 h-4" /> Editar Páginas Existentes
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/admin/settings">
                    <Settings className="w-4 h-4" /> Configuración
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Páginas</CardTitle>
                <CardDescription>
                  Administra todas las páginas de tu sitio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button asChild>
                    <Link href="/admin/pages">Ver Todas las Páginas</Link>
                  </Button>
                  
                  <div className="mt-4">
                    <Button asChild variant="outline">
                      <Link href="/plate-editor">Crear Nueva Página</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Sitio</CardTitle>
                <CardDescription>
                  Administra la configuración general del sitio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Esta sección te permite configurar aspectos generales del sitio.</p>
                <div className="mt-4">
                  <Button asChild>
                    <Link href="/admin/settings">Ir a Configuración</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminRoute>
  );
}
