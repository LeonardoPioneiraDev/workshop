import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-yellow-950 flex items-center justify-center p-8">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>404 - Página Não Encontrada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>A página que você está procurando não existe.</p>
          <Button onClick={() => navigate('/')}>
            Voltar ao Início
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}