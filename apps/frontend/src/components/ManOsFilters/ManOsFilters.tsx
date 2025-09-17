import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useState } from "react";


interface Props {
  value: {
    startDate: string;
    endDate: string;
    origens: number[];
    garagens: number[];
    limit: number;
    useSimpleQuery: boolean;
  };
  onChange: (value: any) => void;
}

const ORIGENS_OPTIONS = [
  { value: 23, label: "CCO (QUEBRA)" },
  { value: 24, label: "CCO (DEFEITO)" },
];

const GARAGENS_OPTIONS = [
  { value: 31, label: "PARANOÁ" },
  { value: 239, label: "SÃO SEBASTIÃO" },
  { value: 240, label: "GAMA" },
  { value: 124, label: "SANTA MARIA" },
];

export function ManOsFilters({ value, onChange }: Props) {
  const [local, setLocal] = useState(value);

  function updateLocal(field: string, input: any) {
    setLocal((old: any) => {
      const next = { ...old, [field]: input };
      return next;
    });
  }

  function apply() {
    onChange(local);
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap gap-4 pt-6 pb-6">
        <div className="flex flex-col gap-1">
          <Label>Data inicial</Label>
          <DatePicker
            value={local.startDate}
            onChange={dateStr => updateLocal("startDate", dateStr)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label>Data final</Label>
          <DatePicker
            value={local.endDate}
            onChange={dateStr => updateLocal("endDate", dateStr)}
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[180px]">
          <Label>Origem</Label>
          <Select
            multiple
            value={local.origens}
            onValueChange={arr => updateLocal("origens", arr)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {ORIGENS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1 min-w-[180px]">
          <Label>Garagem</Label>
          <Select
            multiple
            value={local.garagens}
            onValueChange={arr => updateLocal("garagens", arr)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {GARAGENS_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="self-end pb-1">
          <Button onClick={apply}>Filtrar</Button>
        </div>
      </CardContent>
    </Card>
  );
}