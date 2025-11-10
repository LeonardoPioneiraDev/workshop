import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-yellow-950 p-8">
      <Card>
        <CardHeader>
          <CardTitle>Relatórios</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Página de relatórios...</p>
        </CardContent>
      </Card>
    </div>
  );
}