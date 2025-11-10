// src/pages/HomePage.tsx - TOTALMENTE RESPONSIVA E OTIMIZADA
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Shield,
  Users,
  Database,
  CheckCircle,
  Building2,
  UserCheck,
  Server,
  Truck,
  BarChart3,
  Route,
  Wrench,
  DollarSign,
  Clock,
  Fuel,
  Scale,
  Car,
  FileText,
  UserPlus
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export function HomePage() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setIsVisible(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const departmentFeatures = [
    {
      icon: <Truck className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-yellow-500" />,
      title: "Operações",
      description: "Monitoramento da frota e rotas em tempo real",
      color: "yellow",
      path: "/"
    },
    {
      icon: <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-green-500" />,
      title: "Financeiro",
      description: "Controle de receitas, despesas e análises financeiras",
      color: "green",
      path: "/"
    },
    {
      icon: <Scale className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-blue-500" />,
      title: "Jurídico",
      description: "Sistema completo de multas de trânsito e SEMOB com analytics",
      color: "blue",
      path: "/",
      highlight: true
    },
    {
      icon: <Wrench className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-orange-500" />,
      title: "Manutenção",
      description: "Gestão preventiva e corretiva da frota",
      color: "orange",
      path: "/"
    },
    {
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-purple-500" />,
      title: "Recursos Humanos",
      description: "Gestão de colaboradores e documentação",
      color: "purple",
      path: "/"
    },
    {
      icon: <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-indigo-500" />,
      title: "Departamento Pessoal",
      description: "Folha de pagamento e benefícios",
      color: "indigo",
      path: "/"
    },
    {
      icon: <Route className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-cyan-500" />,
      title: "Logística",
      description: "Planejamento de rotas e entregas",
      color: "cyan",
      path: "/"
    },
    {
      icon: <Fuel className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-red-500" />,
      title: "Combustível",
      description: "Controle de abastecimento e consumo",
      color: "red",
      path: "/"
    }
  ];

  // Estatísticas em tempo real (simuladas)
  const [stats, setStats] = useState({
    multasProcessadas: 382,
    agentesAtivos: 47,
    valorArrecadado: 286448.73,
    veiculosMonitorados: 222
  });

  useEffect(() => {
    // Simular atualizações em tempo real
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        multasProcessadas: prev.multasProcessadas + Math.floor(Math.random() * 3),
        valorArrecadado: prev.valorArrecadado + (Math.random() * 1000)
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col bg-gradient-to-br from-slate-900 via-yellow-900 to-slate-800">
      
      {/* Elementos de background animados */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 lg:top-10 lg:left-10 w-8 h-8 sm:w-12 sm:h-12 lg:w-20 lg:h-20 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
      <div className="absolute top-0 right-1 sm:right-2 lg:right-4 w-8 h-8 sm:w-12 sm:h-12 lg:w-20 lg:h-20 bg-amber-400 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-2 left-4 sm:-bottom-4 sm:left-8 lg:-bottom-8 lg:left-20 w-8 h-8 sm:w-12 sm:h-12 lg:w-20 lg:h-20 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>

      {/* Header Responsivo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full border-b border-white/10 bg-black/20 backdrop-blur-sm"
      >
        <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-4">
            
            {/* Seção esquerda - Logo e empresa */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <img 
                  src={logo} 
                  alt="Viação Pioneira" 
                  className="h-12 w-12 sm:h-10 sm:w-10 lg:h-12 lg:w-12 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg items-center justify-center hidden">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-gray-900" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-lg lg:text-xl font-bold text-white leading-tight">
                    Viação Pioneira Ltda
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-300">
                    Transporte Rodoviário de Passageiros
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <Badge
                  variant="secondary"
                  className="border-yellow-500/30 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-2 sm:px-3 py-1 text-xs font-medium text-yellow-400 backdrop-blur"
                >
                  <Building2 className="mr-1 sm:mr-2 h-3 w-3" />
                  Workshop Operacional
                </Badge>
              </div>
            </div>

            {/* Seção direita - Status e Data/Hora */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="flex flex-wrap gap-1 sm:gap-2">
                <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-300 text-xs px-2 py-1">
                  <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                  Online
                </Badge>
                <Badge variant="outline" className="bg-blue-500/20 border-blue-500/30 text-blue-300 text-xs px-2 py-1">
                  <Database className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                  Oracle
                </Badge>
                <Badge variant="outline" className="bg-amber-500/20 border-amber-500/30 text-amber-300 text-xs px-2 py-1">
                  <Shield className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                  Seguro
                </Badge>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-300 bg-white/5 px-2 sm:px-3 py-1 sm:py-2 rounded-lg border border-white/10">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="font-medium">
                  {currentTime.toLocaleDateString('pt-BR')} - {currentTime.toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Conteúdo principal - Ocupa toda altura restante */}
      <div className="relative z-10 w-full flex-1 flex flex-col px-2 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col">
          
          {/* Seção do título e botões */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-4 sm:mb-6 lg:mb-8"
          >
            {/* Ícone principal */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="flex justify-center mb-3 sm:mb-4 lg:mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-yellow-200/60 opacity-70 blur-xl sm:blur-2xl"></div>
                <div className="relative h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 bg-gradient-to-br from-gray-900 via-black-600 to-amber-600 rounded-xl flex items-center justify-center shadow-2xl overflow-hidden border-2 border-yellow-200/30">
                  <img 
                    src={logo} 
                    alt="Viação Pioneira" 
                    className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 object-contain filter drop-shadow-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling.style.display = 'block';
                    }}
                  />
                  <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-yellow-300 hidden" />
                </div>
              </div>
            </motion.div>

            {/* Título principal */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mb-2 sm:mb-4 text-2xl sm:text-3xl lg:text-5xl xl:text-6xl font-bold leading-tight"
            >
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                Workshop Operacional
              </span>
            </motion.h1>

            {/* Descrição */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mx-auto mb-4 sm:mb-6 max-w-2xl text-sm sm:text-base lg:text-lg text-gray-300"
            >
              Plataforma integrada para monitoramento e gestão de todos os departamentos. 
              Sistema completo de multas de trânsito e SEMOB com análises em tempo real.
            </motion.p>

            

            {/* Botões principais */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center mb-4 sm:mb-6"
            >
              <Button
                asChild
                size="lg"
                className="
                  group relative w-full sm:w-auto sm:min-w-[200px] lg:min-w-[280px]
                  bg-gradient-to-r from-yellow-500 to-amber-600 
                  hover:from-yellow-600 hover:to-amber-700
                  text-gray-900 font-semibold 
                  px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-5
                  text-sm sm:text-base lg:text-lg
                  rounded-xl shadow-lg hover:shadow-xl
                  transform transition-all duration-300 ease-out
                  hover:scale-105 hover:-translate-y-1
                  border-2 border-yellow-400 hover:border-amber-500
                  overflow-hidden
                "
              >
                <Link 
                  to="/login" 
                  className="flex items-center justify-center gap-2 sm:gap-3 relative z-10"
                >
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 transition-transform group-hover:scale-110 flex-shrink-0" />
                  <span className="font-bold tracking-wide">Acessar Sistema</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110 flex-shrink-0" />
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="
                  group relative w-full sm:w-auto sm:min-w-[180px] lg:min-w-[240px]
                  bg-gradient-to-r from-gray-500/20 to-gray-600/20 
                  hover:from-gray-600/30 hover:to-gray-700/30
                  border-gray-400/50 hover:border-gray-400/70
                  text-gray-300 hover:text-gray-200 font-semibold 
                  px-4 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-5
                  text-sm sm:text-base lg:text-lg
                  rounded-xl shadow-lg hover:shadow-xl
                  transform transition-all duration-300 ease-out
                  hover:scale-105 hover:-translate-y-1
                  overflow-hidden
                "
              >
                <a 
                  href="http://localhost:3336/api" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 sm:gap-3 relative z-10"
                >
                  <Server className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 transition-transform group-hover:scale-110 flex-shrink-0" />
                  <span className="font-bold tracking-wide">Documentação API</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110 flex-shrink-0" />
                  
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                </a>
              </Button>
            </motion.div>
          </motion.div>

          {/* Grid de Departamentos - Ocupa espaço restante */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 40 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6"
          >
            {departmentFeatures.map((department, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.6 }}
                className="h-full"
              >
                <Link to={department.path} className="block h-full">
                  <Card className={`
                    ${department.highlight 
                      ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/50 hover:from-blue-600/30 hover:to-blue-700/30 hover:border-blue-400/70' 
                      : 'bg-white/10 border-white/20 hover:bg-white/20'
                    } 
                    backdrop-blur-sm transition-all duration-300 h-full group hover:scale-105 cursor-pointer
                    ${department.highlight ? 'ring-2 ring-blue-400/30' : ''}
                  `}>
                    <CardContent className="p-3 sm:p-4 lg:p-5 h-full flex flex-col relative">
                      {department.highlight && (
                        <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                          <Badge className="bg-blue-500 text-white text-xs px-1 sm:px-2 py-0.5 sm:py-1">
                            Novo
                          </Badge>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="transform transition-transform group-hover:scale-110">
                          {department.icon}
                        </div>
                        <h3 className={`text-sm sm:text-base lg:text-lg font-semibold ${department.highlight ? 'text-blue-300' : 'text-white'}`}>
                          {department.title}
                        </h3>
                      </div>
                      
                      <p className={`text-xs sm:text-sm flex-grow leading-relaxed ${department.highlight ? 'text-blue-200' : 'text-gray-300'}`}>
                        {department.description}
                      </p>

                      {department.highlight && (
                        <div className="mt-2 sm:mt-3 flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs bg-blue-600/20 border-blue-500/30 text-blue-300 px-1 py-0.5">
                            Trânsito
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-green-600/20 border-green-500/30 text-green-300 px-1 py-0.5">
                            SEMOB
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-purple-600/20 border-purple-500/30 text-purple-300 px-1 py-0.5">
                            Analytics
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.6 }}
        className="relative z-10 w-full border-t border-white/10 bg-black/20 backdrop-blur-sm"
      >
        <div className="w-full px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-400">
          <p>© 2025 Viação Pioneira Ltda - Workshop Operacional | Sistema de Multas v2.0</p>
        </div>
      </motion.div>

      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-pattern {
          background-image: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 15px 15px;
        }
        
                @media (max-width: 640px) {
          .bg-grid-pattern {
            background-size: 12px 12px;
          }
        }
        
        @media (max-width: 480px) {
          .bg-grid-pattern {
            background-size: 10px 10px;
          }
        }
        
        /* Garantir que a página ocupe 100% da altura */
        html, body, #root {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
        }
        
        /* Otimizações para dispositivos móveis */
        @media (max-width: 768px) {
          .animate-blob {
            width: 2rem !important;
            height: 2rem !important;
          }
        }
        
        @media (max-width: 480px) {
          .animate-blob {
            width: 1.5rem !important;
            height: 1.5rem !important;
          }
        }
        
        /* Melhorar performance em dispositivos móveis */
        @media (max-width: 640px) {
          .backdrop-blur-sm {
            backdrop-filter: none;
            background-color: rgba(0, 0, 0, 0.3);
          }
        }
      `}</style>
    </div>
  );
}