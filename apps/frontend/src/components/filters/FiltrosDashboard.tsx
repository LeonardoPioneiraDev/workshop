import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils"; // Utilitário do Shadcn/ui
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircleIcon, CalendarIcon, SearchIcon } from "lucide-react"; // Ícones
import { FormEvent, useState } from "react";

interface FiltrosProps {
  onFilter: (filtros: Record<string, string>) => void;
}

export function FiltrosDashboard({ onFilter }: FiltrosProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [idservico, setIdServico] = useState("");
  const [numerolinha, setNumeroLinha] = useState("");
  const [prefixorealizado, setPrefixoRealizado] = useState("");
  const [statusini, setStatusIni] = useState("");
  const [statusfim, setStatusFim] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMensagemErro(""); // Limpa erros anteriores

    if (!selectedDate) {
      setMensagemErro(
        "⚠️ Por favor, selecione uma data válida antes de aplicar os filtros.",
      );
      return;
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera a hora para comparar só a data
    if (selectedDate > hoje) {
      setMensagemErro(
        "🚫 A data selecionada não pode ser no futuro. Por favor, escolha uma data de hoje ou anterior.",
      );
      return;
    }

    if (prefixorealizado && !numerolinha) {
      setMensagemErro(
        "⚠️ Para filtrar por prefixo do veículo, informe primeiro o número da linha.",
      );
      return;
    }

    if (idservico && !numerolinha) {
      setMensagemErro(
        "⚠️ Para utilizar o filtro de ID do serviço, é necessário preencher o número da linha.",
      );
      return;
    }

    // A validação de numerolinha && !dia é coberta pela lógica de !selectedDate e o disable do campo numerolinha.
    // Mantemos a validação para status que dependem da linha.
    if ((statusini || statusfim) && !numerolinha) {
      setMensagemErro(
        "⚠️ Para filtrar por status inicial ou final, informe também o número da linha.",
      );
      return;
    }

    const formattedDia = format(selectedDate, "yyyy-MM-dd");

    const filtros: Record<string, string> = {
      dia: formattedDia,
      ...(idservico && { idservico }),
      ...(numerolinha && { numerolinha }),
      ...(prefixorealizado && { prefixorealizado }),
      ...(statusini && { statusini }),
      ...(statusfim && { statusfim }),
    };
    onFilter(filtros);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mensagemErro && (
        <Alert variant="destructive">
          <AlertCircleIcon className="h-4 w-4" />
          <AlertTitle>Erro de Validação</AlertTitle>
          <AlertDescription>{mensagemErro}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="data-filtro">Data</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="data-filtro"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="numerolinha">Número da Linha</Label>
          <Input
            id="numerolinha"
            type="text"
            placeholder="Ex: 101"
            value={numerolinha}
            onChange={(e) => setNumeroLinha(e.target.value)}
            disabled={!selectedDate}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="idservico">ID Serviço</Label>
          <Input
            id="idservico"
            type="text"
            placeholder="Ex: 12345"
            value={idservico}
            onChange={(e) => setIdServico(e.target.value)}
            disabled={!numerolinha}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prefixorealizado">Prefixo Realizado</Label>
          <Input
            id="prefixorealizado"
            type="text"
            placeholder="Ex: ABC1D23"
            value={prefixorealizado}
            onChange={(e) => setPrefixoRealizado(e.target.value)}
            disabled={!numerolinha}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="statusini">Status Inicial (Ponto Inicial)</Label>
          <Input
            id="statusini"
            type="text"
            placeholder="Ex: REALIZADO"
            value={statusini}
            onChange={(e) => setStatusIni(e.target.value)}
            disabled={!numerolinha}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="statusfim">Status Final (Ponto Final)</Label>
          <Input
            id="statusfim"
            type="text"
            placeholder="Ex: NÃO REALIZADO"
            value={statusfim}
            onChange={(e) => setStatusFim(e.target.value)}
            disabled={!numerolinha}
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full sm:w-auto"
        disabled={!selectedDate}
      >
        <SearchIcon className="mr-2 h-4 w-4" />
        Buscar
      </Button>
    </form>
  );
}
