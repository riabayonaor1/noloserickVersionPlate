'use client';

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute isAdminRoute={true}>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
