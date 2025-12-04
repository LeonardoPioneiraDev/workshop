// src/App.tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppRoutes } from '@/routes/AppRoutes';
import { Toaster } from 'sonner';

import { AuthManager } from '@/components/AuthManager';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthManager />
        <ThemeProvider>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <AppRoutes />
            <Toaster
              position="top-right"
              theme="system"
              toastOptions={{
                style: {
                  background: 'var(--toast-bg)',
                  border: '1px solid var(--toast-border)',
                  color: 'var(--toast-text)',
                },
              }}
            />
          </div>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;