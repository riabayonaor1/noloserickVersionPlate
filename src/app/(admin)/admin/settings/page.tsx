'use client';

import React, { useState } from 'react';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Settings, 
  Globe, 
  Shield, 
  PaintBucket, 
  Palette, 
  Image,
  MailOpen, 
  BellRing, 
  Save,
  Undo
} from 'lucide-react';

export default function SettingsPage() {
  // Estados para los diferentes formularios
  const [generalSettings, setGeneralSettings] = useState({
    siteName: 'No lo sé Rick',
    siteDescription: 'Sitio web personal con editor de contenido avanzado',
    siteLanguage: 'es',
    allowComments: true,
    enableSearchIndexing: true,
  });
  
  const [appearanceSettings, setAppearanceSettings] = useState({
    primaryColor: '#3b82f6',
    accentColor: '#10b981',
    darkMode: false,
    fontSize: 16,
    headerStyle: 'default',
  });
  
  const [integrationSettings, setIntegrationSettings] = useState({
    analyticsId: '',
    recaptchaSiteKey: '',
    emailServiceProvider: 'none',
    emailApiKey: '',
  });

  // Manejadores de cambios
  const handleGeneralChange = (field, value) => {
    setGeneralSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleAppearanceChange = (field, value) => {
    setAppearanceSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleIntegrationChange = (field, value) => {
    setIntegrationSettings(prev => ({ ...prev, [field]: value }));
  };

  // Manejador de guardado
  const handleSaveSettings = (settingsType) => {
    // Aquí implementaríamos la lógica para guardar en Firebase
    console.log(`Guardando configuración de ${settingsType}:`, 
      settingsType === 'general' ? generalSettings :
      settingsType === 'appearance' ? appearanceSettings :
      integrationSettings
    );
    
    // Mostrar mensaje de éxito
    alert('Configuración guardada correctamente');
  };

  return (
    <AdminRoute>
      <div className="container mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Configuración del Sitio</h1>
          <Button variant="outline" asChild>
            <a href="/admin/dashboard">Volver al Dashboard</a>
          </Button>
        </div>
        
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="w-4 h-4" /> General
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="w-4 h-4" /> Apariencia
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Shield className="w-4 h-4" /> Integraciones
            </TabsTrigger>
          </TabsList>
          
          {/* Pestaña de Configuración General */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Configuración General</CardTitle>
                <CardDescription>
                  Configura los ajustes básicos de tu sitio web
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="siteName">Nombre del Sitio</Label>
                    <Input 
                      id="siteName" 
                      value={generalSettings.siteName}
                      onChange={(e) => handleGeneralChange('siteName', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="siteDescription">Descripción del Sitio</Label>
                    <Textarea 
                      id="siteDescription" 
                      value={generalSettings.siteDescription}
                      onChange={(e) => handleGeneralChange('siteDescription', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="siteLanguage">Idioma Principal</Label>
                    <Select 
                      value={generalSettings.siteLanguage}
                      onValueChange={(value) => handleGeneralChange('siteLanguage', value)}
                    >
                      <SelectTrigger id="siteLanguage">
                        <SelectValue placeholder="Selecciona un idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">Inglés</SelectItem>
                        <SelectItem value="fr">Francés</SelectItem>
                        <SelectItem value="de">Alemán</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="allowComments">Permitir Comentarios</Label>
                      <p className="text-muted-foreground text-sm">
                        Habilita la funcionalidad de comentarios en las páginas
                      </p>
                    </div>
                    <Switch 
                      id="allowComments"
                      checked={generalSettings.allowComments}
                      onCheckedChange={(checked) => handleGeneralChange('allowComments', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enableSearchIndexing">Indexación en Buscadores</Label>
                      <p className="text-muted-foreground text-sm">
                        Permitir que los motores de búsqueda indexen el sitio
                      </p>
                    </div>
                    <Switch 
                      id="enableSearchIndexing"
                      checked={generalSettings.enableSearchIndexing}
                      onCheckedChange={(checked) => handleGeneralChange('enableSearchIndexing', checked)}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <Button variant="outline" className="gap-2">
                    <Undo className="w-4 h-4" /> Resetear
                  </Button>
                  <Button onClick={() => handleSaveSettings('general')} className="gap-2">
                    <Save className="w-4 h-4" /> Guardar Cambios
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Pestaña de Apariencia */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Apariencia</CardTitle>
                <CardDescription>
                  Personaliza la apariencia visual de tu sitio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="primaryColor">Color Principal</Label>
                    <div className="flex gap-4 items-center">
                      <Input 
                        id="primaryColor" 
                        type="color"
                        value={appearanceSettings.primaryColor}
                        onChange={(e) => handleAppearanceChange('primaryColor', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <span className="text-sm text-muted-foreground">{appearanceSettings.primaryColor}</span>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="accentColor">Color de Acento</Label>
                    <div className="flex gap-4 items-center">
                      <Input 
                        id="accentColor" 
                        type="color"
                        value={appearanceSettings.accentColor}
                        onChange={(e) => handleAppearanceChange('accentColor', e.target.value)}
                        className="w-16 h-10 p-1"
                      />
                      <span className="text-sm text-muted-foreground">{appearanceSettings.accentColor}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="darkMode">Modo Oscuro por Defecto</Label>
                      <p className="text-muted-foreground text-sm">
                        Establecer el modo oscuro como diseño predeterminado
                      </p>
                    </div>
                    <Switch 
                      id="darkMode"
                      checked={appearanceSettings.darkMode}
                      onCheckedChange={(checked) => handleAppearanceChange('darkMode', checked)}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="fontSize">Tamaño de Fuente Base (px)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="fontSize"
                        min={12}
                        max={24}
                        step={1}
                        value={[appearanceSettings.fontSize]}
                        onValueChange={([value]) => handleAppearanceChange('fontSize', value)}
                        className="flex-1"
                      />
                      <span className="w-8 text-center">{appearanceSettings.fontSize}</span>
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="headerStyle">Estilo de Encabezado</Label>
                    <Select 
                      value={appearanceSettings.headerStyle}
                      onValueChange={(value) => handleAppearanceChange('headerStyle', value)}
                    >
                      <SelectTrigger id="headerStyle">
                        <SelectValue placeholder="Selecciona un estilo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Predeterminado</SelectItem>
                        <SelectItem value="minimal">Minimalista</SelectItem>
                        <SelectItem value="centered">Centrado</SelectItem>
                        <SelectItem value="hero">Hero</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <Button variant="outline" className="gap-2">
                    <Undo className="w-4 h-4" /> Resetear
                  </Button>
                  <Button onClick={() => handleSaveSettings('appearance')} className="gap-2">
                    <Save className="w-4 h-4" /> Guardar Cambios
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Pestaña de Integraciones */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Integraciones</CardTitle>
                <CardDescription>
                  Configura integraciones con servicios externos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="analyticsId">ID de Google Analytics</Label>
                    <Input 
                      id="analyticsId" 
                      value={integrationSettings.analyticsId}
                      onChange={(e) => handleIntegrationChange('analyticsId', e.target.value)}
                      placeholder="UA-XXXXXXXXX-X o G-XXXXXXXXXX"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="recaptchaSiteKey">Clave de sitio reCAPTCHA</Label>
                    <Input 
                      id="recaptchaSiteKey" 
                      value={integrationSettings.recaptchaSiteKey}
                      onChange={(e) => handleIntegrationChange('recaptchaSiteKey', e.target.value)}
                      placeholder="6LdXXXXXXXXXXXXXXXXXXXX"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="emailServiceProvider">Proveedor de Servicio de Email</Label>
                    <Select 
                      value={integrationSettings.emailServiceProvider}
                      onValueChange={(value) => handleIntegrationChange('emailServiceProvider', value)}
                    >
                      <SelectTrigger id="emailServiceProvider">
                        <SelectValue placeholder="Selecciona un proveedor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguno</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailchimp">Mailchimp</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {integrationSettings.emailServiceProvider !== 'none' && (
                    <div className="grid gap-2">
                      <Label htmlFor="emailApiKey">API Key</Label>
                      <Input 
                        id="emailApiKey" 
                        type="password"
                        value={integrationSettings.emailApiKey}
                        onChange={(e) => handleIntegrationChange('emailApiKey', e.target.value)}
                        placeholder="Ingresa tu API key"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <Button variant="outline" className="gap-2">
                    <Undo className="w-4 h-4" /> Resetear
                  </Button>
                  <Button onClick={() => handleSaveSettings('integrations')} className="gap-2">
                    <Save className="w-4 h-4" /> Guardar Cambios
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminRoute>
  );
}
