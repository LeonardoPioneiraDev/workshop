import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function SystemSettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-yellow-950 p-8">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Configurações do sistema...</p>
        </CardContent>
      </Card>
    </div>
  );
}