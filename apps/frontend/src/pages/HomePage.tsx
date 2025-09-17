// src/pages/HomePage.tsx
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bus,
  BusFrontIcon,
  BusIcon,
  Calendar,
  Clock,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.png";

export function HomePage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Análise em Tempo Real",
      description: "Monitore o status das viagens com atualizações automáticas",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Controle de Horários",
      description: "Acompanhe atrasos, adiantamentos e cumprimento de horários",
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Relatórios Detalhados",
      description: "Exporte dados em Excel e PDF com análises completas",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Gestão de Frota",
      description: "Controle motoristas, veículos e linhas de transporte",
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-black via-neutral-900 to-yellow-950">
      {/* Elementos de background animados com tons de amarelo */}
      <div className="absolute inset-0 w-full">
        <div className="animate-blob absolute -top-40 -right-40 h-96 w-96 rounded-full bg-yellow-400 opacity-30 mix-blend-soft-light blur-3xl filter"></div>
        <div className="animate-blob animation-delay-2000 absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-amber-500 opacity-20 mix-blend-soft-light blur-3xl filter"></div>
        <div className="animate-blob animation-delay-4000 absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-yellow-300 opacity-20 mix-blend-soft-light blur-3xl filter"></div>
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Conteúdo principal */}
      <div className="relative z-10 w-full px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            {/* Logo */}
            <motion.div
              className="mb-8 flex justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-yellow-400 opacity-40 blur-3xl"></div>
                <img
                  src={logo}
                  alt="Logo da Empresa"
                  className="relative h-32 w-32 object-contain"
                  style={{
                    filter: "drop-shadow(0 0 30px rgba(255,215,0,0.5))",
                  }}
                />
              </div>
            </motion.div>

            {/* Badge de destaque */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 flex justify-center"
            >
              <Badge className="border-yellow-500/30 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-4 py-1.5 text-sm font-medium text-yellow-400 backdrop-blur hover:from-yellow-500/30 hover:to-amber-500/30">
                <BusFrontIcon className="mr-2 h-12 w-12" />
                Viação Pioneira
              </Badge>
            </motion.div>

            {/* Título principal com gradiente */}
            <motion.h1
              className="mb-6 text-5xl font-bold md:text-7xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                Dashboard de Transporte
              </span>
            </motion.h1>

            {/* Descrição */}
            <motion.p
              className="mx-auto mb-8 max-w-2xl text-lg text-gray-400 md:text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Monitore em tempo real a qualidade do transporte público. Análises
              precisas, relatórios detalhados e gestão inteligente da frota.
            </motion.p>

            {/* Botões de ação */}
            <motion.div
              className="flex flex-col items-center justify-center gap-16 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                asChild
                size="lg"
                className="group bg-gradient-to-r from-yellow-400 to-amber-500 font-bold text-black shadow-lg shadow-yellow-500/25 hover:from-yellow-500 hover:to-amber-600"
              >
                <Link to="/dashboard">
                  Acessar Dashboard de Viagens
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>

             
              {/* <Button
                asChild
                variant="outline"
                size="lg"
                className="border-yellow-500/50 bg-black text-white hover:border-yellow-400 hover:bg-yellow-500/10"
              >
                <Link to="/historico">Ver Histórico</Link>
              </Button>
               <Button
                asChild
                size="lg"
                className="group bg-gradient-to-r from-yellow-400 to-amber-500 font-bold text-black shadow-lg shadow-yellow-500/25 hover:from-yellow-500 hover:to-amber-600"
              >
                <Link to="/manos">
                  Acessar Dashboard de Ordem de Serviço
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              */}
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="group"
              >
                <Card className="h-full border-0 bg-gradient-to-br from-neutral-800/70 to-neutral-900/70 shadow-xl backdrop-blur transition-all duration-300 hover:from-neutral-800/80 hover:to-neutral-900/80 hover:shadow-2xl">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/20 text-yellow-400 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                      {feature.icon}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Footer */}
          {/* <motion.div
            className="mt-16 text-center text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <p>© 2025 Sistema CCO com API Transdata</p>
            <p className="mt-2">
              Desenvolvido para o Governo do Distrito Federal
            </p>
          </motion.div> */}
        </div>
      </div>

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
      `}</style>
    </div>
  );
}
