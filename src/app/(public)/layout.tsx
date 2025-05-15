'use client';

import React from 'react';
import Navbar from '@/components/layout/Navbar';
import { Toaster } from 'sonner';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Toaster />
    </div>
  );
}
