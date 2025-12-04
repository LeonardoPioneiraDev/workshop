import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

export function NotAuthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
      <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
      <h1 className="text-4xl font-bold mb-2">Acesso Negado</h1>
      <p className="text-lg text-muted-foreground mb-6">
        Você não tem permissão para acessar esta página.
      </p>
      <Button asChild>
        <Link to="/home">Voltar para a Página Inicial</Link>
      </Button>
    </div>
  );
}
