import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-yellow-950 p-8">
      <Card>
        <CardHeader>
          <CardTitle>Perfil do Usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Página de perfil em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  );
}