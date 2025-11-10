import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function EmailTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-yellow-950 p-8">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Email</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Ferramenta de teste de email...</p>
        </CardContent>
      </Card>
    </div>
  );
}