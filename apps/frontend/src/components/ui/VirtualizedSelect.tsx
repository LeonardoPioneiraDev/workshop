// apps/frontend/src/components/ui/VirtualizedSelect.tsx

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Check, ChevronDown } from "lucide-react"; // Removido Check, já que o item está super simplificado
import * as React from "react"; // Importar React completo para useState e useCallback

// Interface para as opções, esperando label e value
export interface VirtualizedSelectOption {
  value: string;
  label: string;
}

interface VirtualizedSelectProps {
  options: VirtualizedSelectOption[];
  value?: string; // O valor atualmente selecionado
  onChange: (value: string | undefined) => void; // Permite desmarcar passando undefined
  placeholder?: string;
  label?: string; // Label opcional para o campo
  triggerClassName?: string;
  contentClassName?: string;
  disabled?: boolean;
  listHeight?: number; // Altura customizável para a lista suspensa em pixels
}

const APPROX_ITEM_HEIGHT = 32; // Altura aproximada de cada item em pixels (text-xs + padding)

export function VirtualizedSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  label,
  triggerClassName,
  contentClassName,
  disabled,
  listHeight = 256, // Default list height (aprox. 8 itens visíveis)
}: VirtualizedSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // --- INÍCIO DA MODIFICAÇÃO: Substituir useRef por useState + callback ref ---
  // const parentRef = React.useRef<HTMLDivElement>(null); // Linha antiga
  const [scrollElement, setScrollElement] =
    React.useState<HTMLDivElement | null>(null);

  const parentRefCallback = React.useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setScrollElement(node);
    } else {
      console.log(
        "[VirtualizedSelect] Callback ref: Elemento de scroll removido/nulo.",
      );
      // Opcional: setScrollElement(null); se quiser limpar quando desmontado,
      // mas para PopoverContent que monta/desmonta, isso pode causar mais recálculos.
      // Para este caso, definir apenas quando 'node' existe pode ser mais estável.
    }
  }, []); // Array de dependências vazio para que a callback não mude
  // --- FIM DA MODIFICAÇÃO ---

  const rowVirtualizer = useVirtualizer({
    count: options.length,
    getScrollElement: () => scrollElement, // Usar o estado scrollElement aqui
    estimateSize: () => APPROX_ITEM_HEIGHT,
    overscan: 5,
    // Adicionando scrollElement à lista de dependências do virtualizer pode ajudar
    // a forçar um recálculo quando ele é definido. O TanStack Virtual pode já fazer isso
    // se a função getScrollElement retornar um novo valor (como um novo objeto de referência de estado).
    // No entanto, o re-render causado por setScrollElement já deve ser suficiente.
  });

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder;

  const handleSelectOption = (optionValue: string) => {
    if (value === optionValue) {
      // Se clicar no item já selecionado
    } else {
      onChange(optionValue);
    }
    setIsOpen(false);
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <Label
          htmlFor={label ? label + "-vselect-trigger" : undefined}
          className="text-xs font-medium"
        >
          {label}
        </Label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            id={label ? label + "-vselect-trigger" : undefined}
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            aria-label={selectedOption ? selectedOption.label : placeholder}
            className={cn(
              "h-9 w-full justify-between text-xs font-normal", // Removido truncate daqui, displayLabel já é truncado se necessário
              !selectedOption && "text-muted-foreground",
              triggerClassName,
            )}
          >
            <span className="truncate">{displayLabel}</span>
            <ChevronDown
              className={cn(
                "ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "bg-popover text-popover-foreground z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border p-0 shadow-md",
            contentClassName,
          )}
          style={{ maxHeight: `${listHeight + 16}px` }}
          side="bottom"
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {options.length === 0 ? (
            <div className="text-muted-foreground p-4 text-center text-xs">
              Nenhuma opção disponível.
            </div>
          ) : (
            // Aplicar o callback ref ao div rolável
            <div
              ref={parentRefCallback}
              className="relative overflow-y-auto"
              style={{
                height: `${Math.min(options.length * APPROX_ITEM_HEIGHT, listHeight)}px`,
              }}
            >
              {/* Adicionar uma verificação para scrollElement antes de renderizar a lista interna.
                  Isso garante que o virtualizer tenha um getScrollElement válido
                  antes de tentar calcular o getTotalSize e getVirtualItems. */}
              {scrollElement && (
                <div
                  className="relative w-full"
                  style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                    const option = options[virtualItem.index];

                    if (!option) {
                      return (
                        <div
                          key={`placeholder-${virtualItem.index}-${virtualItem.key ?? virtualItem.index}`}
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                            // Estilo mínimo para placeholder, se necessário
                            display: "flex",
                            alignItems: "center",
                            padding: "0 8px",
                            fontSize: "12px",
                            color: "transparent", // Pode ser invisível
                          }}
                        >
                          Carregando...
                        </div>
                      );
                    }
                    const isSelected = value === option.value;
                    return (
                      <div
                        key={option.value}
                        data-value={option.value}
                        onClick={() => handleSelectOption(option.value)}
                        role="option"
                        aria-selected={isSelected}
                        // ESTILOS RESTAURADOS E REFINADOS com Tailwind/Shadcn
                        className={cn(
                          "absolute top-0 left-0 w-full", // Estilos base para posicionamento do virtualizer
                          "flex items-center justify-between", // Layout flex para label e checkmark
                          "px-3 py-1.5 md:px-2 md:py-2", // Padding (ajustado para altura similar ao SelectItem padrão) -> aprox 32-36px de altura
                          "rounded-sm text-xs", // Tamanho da fonte e bordas arredondadas para o hover/selected
                          "cursor-pointer select-none", // Cursor e previne seleção de texto
                          "hover:bg-accent hover:text-accent-foreground", // Efeito hover padrão
                          isSelected &&
                            "bg-accent text-accent-foreground font-medium", // Estilo para item selecionado
                        )}
                        style={{
                          height: `${virtualItem.size}px`, // Definido pelo virtualizer
                          transform: `translateY(${virtualItem.start}px)`, // Definido pelo virtualizer
                          // Removidos estilos inline de depuração como fontFamily, border, backgroundColor explícito (a menos que isSelected)
                        }}
                      >
                        <span className="truncate">
                          {" "}
                          {/* Truncate para o label */}
                          {option.label}
                        </span>
                        {isSelected && (
                          <Check className="text-accent-foreground h-4 w-4" /> // Ícone de check para item selecionado
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
