// apps/frontend/src/components/ui/generic-filter.tsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Filter, X, MessageSquare, TrendingUp } from 'lucide-react';

export interface FilterItem {
  id: string;
  label: string;
  value: any;
  count: number;
  percentage: number;
  category?: string;
  isSpecific?: boolean;
  icon?: string;
  color?: string;
}

interface GenericFilterProps {
  title: string;
  subtitle?: string;
  items: FilterItem[];
  onFilterChange: (itemId: string | null) => void;
  selectedItemId?: string | null;
  placeholder?: string;
  showStats?: boolean;
  maxHeight?: string;
  icon?: React.ReactNode;
  colorScheme?: 'orange' | 'blue' | 'green' | 'purple' | 'red';
}

const GenericFilter: React.FC<GenericFilterProps> = ({
  title,
  subtitle,
  items,
  onFilterChange,
  selectedItemId,
  placeholder = "Buscar item...",
  showStats = true,
  maxHeight = "max-h-96",
  icon = <MessageSquare className="h-5 w-5" />,
  colorScheme = 'orange'
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar itens baseado na busca
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    
    return items.filter(item => 
      item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  // Estatísticas
  const stats = useMemo(() => {
    const specific = items.filter(item => item.isSpecific);
    const general = items.filter(item => !item.isSpecific);
    const total = items.reduce((sum, item) => sum + item.count, 0);

    return {
      specificCount: specific.length,
      generalCount: general.length,
      totalCount: total
    };
  }, [items]);

  const handleItemClick = (itemId: string) => {
    if (selectedItemId === itemId) {
      onFilterChange(null);
    } else {
      onFilterChange(itemId);
    }
  };

  // Esquemas de cores
  const getColorClasses = (scheme: string) => {
    const schemes = {
      orange: {
        card: 'border-orange-300 bg-gradient-to-br from-orange-100 to-yellow-100',
        header: 'bg-gradient-to-r from-orange-200 to-yellow-200 border-orange-300 text-orange-900',
        input: 'bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-300 focus:border-orange-500 focus:ring-orange-300',
        active: 'bg-gradient-to-r from-orange-200 to-yellow-200 border-orange-400 text-orange-900',
        item: 'border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 hover:border-orange-300 hover:from-orange-100 hover:to-yellow-100',
        itemSelected: 'border-orange-500 bg-gradient-to-r from-orange-200 to-yellow-200',
        legend: 'border-orange-300'
      },
      blue: {
        card: 'border-blue-300 bg-gradient-to-br from-blue-100 to-cyan-100',
        header: 'bg-gradient-to-r from-blue-200 to-cyan-200 border-blue-300 text-blue-900',
        input: 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-300 focus:border-blue-500 focus:ring-blue-300',
        active: 'bg-gradient-to-r from-blue-200 to-cyan-200 border-blue-400 text-blue-900',
        item: 'border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 hover:border-blue-300 hover:from-blue-100 hover:to-cyan-100',
        itemSelected: 'border-blue-500 bg-gradient-to-r from-blue-200 to-cyan-200',
        legend: 'border-blue-300'
      },
      green: {
        card: 'border-green-300 bg-gradient-to-br from-green-100 to-emerald-100',
        header: 'bg-gradient-to-r from-green-200 to-emerald-200 border-green-300 text-green-900',
        input: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 focus:border-green-500 focus:ring-green-300',
        active: 'bg-gradient-to-r from-green-200 to-emerald-200 border-green-400 text-green-900',
        item: 'border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 hover:border-green-300 hover:from-green-100 hover:to-emerald-100',
        itemSelected: 'border-green-500 bg-gradient-to-r from-green-200 to-emerald-200',
        legend: 'border-green-300'
      },
      purple: {
        card: 'border-purple-300 bg-gradient-to-br from-purple-100 to-violet-100',
        header: 'bg-gradient-to-r from-purple-200 to-violet-200 border-purple-300 text-purple-900',
        input: 'bg-gradient-to-r from-purple-50 to-violet-50 border-purple-300 focus:border-purple-500 focus:ring-purple-300',
        active: 'bg-gradient-to-r from-purple-200 to-violet-200 border-purple-400 text-purple-900',
        item: 'border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 hover:border-purple-300 hover:from-purple-100 hover:to-violet-100',
        itemSelected: 'border-purple-500 bg-gradient-to-r from-purple-200 to-violet-200',
        legend: 'border-purple-300'
      },
      red: {
        card: 'border-red-300 bg-gradient-to-br from-red-100 to-pink-100',
        header: 'bg-gradient-to-r from-red-200 to-pink-200 border-red-300 text-red-900',
        input: 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300 focus:border-red-500 focus:ring-red-300',
        active: 'bg-gradient-to-r from-red-200 to-pink-200 border-red-400 text-red-900',
        item: 'border-gray-300 bg-gradient-to-r from-gray-100 to-gray-200 hover:border-red-300 hover:from-red-100 hover:to-pink-100',
        itemSelected: 'border-red-500 bg-gradient-to-r from-red-200 to-pink-200',
        legend: 'border-red-300'
      }
    };

    return schemes[scheme as keyof typeof schemes] || schemes.orange;
  };

  const colors = getColorClasses(colorScheme);

  return (
    <Card className={`shadow-lg border-2 ${colors.card}`}>
      <CardHeader className={`pb-4 ${colors.header} rounded-t-lg border-b`}>
        <CardTitle className="text-lg flex items-center gap-2 font-bold">
          {icon}
          {title}
        </CardTitle>
        {subtitle && (
          <p className="text-sm mt-1 font-medium opacity-90">
            {subtitle}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {/* Campo de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-600" />
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 border-2 text-gray-900 font-medium ${colors.input}`}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-200 rounded-full"
            >
              <X className="h-3 w-3 text-gray-700" />
            </Button>
          )}
        </div>

        {/* Estatísticas gerais */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg border-2 border-gray-300 shadow-md">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.specificCount}
              </div>
              <div className="text-xs text-gray-700 font-medium">Itens Específicos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.generalCount}
              </div>
              <div className="text-xs text-gray-700 font-medium">Categorias Gerais</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.totalCount.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-gray-700 font-medium">Total</div>
            </div>
          </div>
        )}

        {/* Filtro ativo */}
        {selectedItemId && (
          <div className={`flex items-center gap-2 p-3 rounded-lg border-2 shadow-md ${colors.active}`}>
            <span className="text-sm font-bold">Filtro ativo:</span>
            <Badge 
              variant="outline"
              className="bg-gradient-to-r from-white/30 to-white/20 border-white/30 font-medium"
            >
              {items.find(item => item.id === selectedItemId)?.label}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange(null)}
              className="h-6 w-6 p-0 hover:bg-white/20 ml-auto rounded-full"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Lista de itens */}
        <div className={`space-y-3 ${maxHeight} overflow-y-auto`}>
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className={`rounded-lg border-2 transition-all duration-200 hover:shadow-lg ${
                selectedItemId === item.id ? colors.itemSelected : colors.item
              }`}
            >
              <button
                onClick={() => handleItemClick(item.id)}
                className="w-full p-4 text-left rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Ícone */}
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <span className="text-lg">
                      {item.icon || (item.isSpecific ? '📝' : '📂')}
                    </span>
                    {item.isSpecific && (
                      <Badge variant="outline" className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 font-medium">
                        Específico
                      </Badge>
                    )}
                  </div>

                  {/* Conteúdo principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className={`font-bold text-sm leading-tight ${
                        item.isSpecific ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {item.label}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-700 shrink-0">
                        <TrendingUp className="h-3 w-3" />
                        <span className="font-bold">{item.count.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* Barra de progresso */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-700 font-medium">
                          {item.isSpecific ? 'Ocorrências estimadas:' : 'Total:'}
                        </span>
                        <span className={`font-bold ${
                          item.isSpecific ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {item.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gradient-to-r from-gray-300 to-gray-400 rounded-full h-2 shadow-inner">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 shadow-md ${
                            item.isSpecific ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-gray-500 to-gray-700'
                          }`}
                          style={{ width: `${Math.min(item.percentage * 2, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Categoria pai */}
                    {item.isSpecific && item.category && (
                      <div className="mt-2 text-xs text-gray-700 font-medium bg-gradient-to-r from-blue-100 to-blue-200 rounded px-2 py-1">
                        Categoria: {item.category}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border-2 border-gray-300">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-600" />
            <p className="text-lg font-bold text-gray-800">Nenhum item encontrado</p>
            <p className="text-sm text-gray-600 mt-1 font-medium">Tente ajustar o termo de busca</p>
          </div>
        )}

        {/* Legenda */}
        <div className={`flex items-center justify-center gap-6 pt-3 border-t-2 text-sm text-gray-800 font-medium ${colors.legend}`}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-gray-500 to-gray-700 rounded shadow-md"></div>
            <span>Categorias Gerais</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded shadow-md"></div>
            <span>Itens Específicos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GenericFilter;