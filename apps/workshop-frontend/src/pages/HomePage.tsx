import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Car, Wrench, LogOut, Users, Sun, Moon, Sparkles, Bus, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.png';

const serviceLinks = [
  {
    title: 'Multas Sufisa',
    description: 'Consulte, registre e acompanhe multas de toda a frota.',
    path: '/departments/juridico/sufisa',
    Icon: Bus,
    bgIcon: 'bg-blue-100/80 dark:bg-blue-900/50',
    iconColor: 'text-blue-500 dark:text-blue-400',
    borderFocus: 'hover:border-blue-500 dark:hover:border-blue-400',
  },
  {
    title: 'Workshop',
    description: 'Ordens de serviço, cronogramas e histórico de manutenções.',
    path: '/workshop',
    Icon: Monitor,
    bgIcon: 'bg-emerald-100/80 dark:bg-emerald-900/50',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    borderFocus: 'hover:border-green-500 dark:hover:border-green-400',
  },
  {
    title: 'Gerenciamento de Usuários',
    description: 'Cadastre, edite e atribua papéis aos administradores.',
    path: '/admin/users',
    Icon: Users,
    bgIcon: 'bg-purple-100/80 dark:bg-purple-900/50',
    iconColor: 'text-purple-500 dark:text-purple-400',
    borderFocus: 'hover:border-purple-500 dark:hover:border-purple-400',
    adminOnly: true,
  },
];

export function HomePage() {
  const { user, logout, hasRole } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const availableServices = serviceLinks.filter((service) => !service.adminOnly || hasRole(['admin']));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffdf5] via-[#fef0d4] to-[#feeccc] dark:from-gray-950 dark:via-gray-900 dark:to-neutral-900 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      <div className="relative flex min-h-screen flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-10 h-64 w-64 rounded-full bg-[#fbcc2c]/40 blur-3xl dark:bg-yellow-500/20" />
          <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-[#fbcc2c]/30 blur-3xl dark:bg-yellow-400/30" />
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,_rgba(251,204,44,0.35),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl space-y-10">
            <Card className="relative overflow-hidden rounded-3xl border border-white/30 dark:border-yellow-500/30 bg-white/80 dark:bg-gray-900/80 shadow-2xl shadow-yellow-500/10 dark:shadow-black/40 backdrop-blur-xl">
              <CardContent className="space-y-10 p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/60 bg-white/80 dark:border-yellow-400/60 dark:bg-gray-900/70">
                        <img src={logo} alt="Viação Pioneira" className="h-full w-full object-cover" />
                      </div>
                      <p className="text-sm uppercase tracking-[0.5em] text-gray-500 dark:text-gray-400">Viação Pioneira</p>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                      Bem-vindo, {user?.fullName || user?.username}
                    </h1>
                   
                    

                    <p className="text-sm text-gray-600 dark:text-gray-300 max-w-2xl">

                      Centralize o controle de multas, workshops e usuários em um único lugar com visual agradável nos temas claro e escuro.

                    </p>

                    
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/80 text-gray-800 shadow-lg transition hover:bg-white dark:border-yellow-400/60 dark:bg-gray-900/70 dark:text-gray-100 dark:hover:bg-gray-900"
                      aria-label="Alternar tema"
                    >
                      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </button>
                    <Button variant="ghost" onClick={logout} className="text-sm font-semibold" size="sm">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sair
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                    <Sparkles className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                    Escolha uma operação
                  </p>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Acesse um dos sistemas</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {availableServices.map((service) => {
                    const Icon = service.Icon;
                    return (
                      <Link key={service.title} to={service.path} className="group">
                        <Card
                          className={`h-full rounded-3xl border border-white/5 bg-white/80 dark:border-yellow-500/30 dark:bg-gray-900/80 shadow-xl shadow-yellow-500/5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl ${service.borderFocus}`}
                        >
                          <CardHeader className="flex flex-row items-center gap-4 p-5">
                            <div className={`${service.bgIcon} rounded-2xl p-3 shadow-inner`}>
                              <Icon className={`h-8 w-8 ${service.iconColor}`} />
                            </div>
                            <div>
                              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                                {service.title}
                              </CardTitle>
                              <CardDescription className="text-sm text-gray-600 dark:text-gray-300">
                                {service.description}
                              </CardDescription>
                            </div>
                          </CardHeader>
                          <CardContent className="px-5 pb-5 pt-0">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Clique para navegar até o módulo e acompanhar indicadores e tarefas.
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
