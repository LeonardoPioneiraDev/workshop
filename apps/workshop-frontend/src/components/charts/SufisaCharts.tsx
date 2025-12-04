// src/components/charts/SufisaCharts.tsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const COLORS = ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];

interface ChartProps {
  data: any[];
  title: string;
  type: 'bar' | 'horizontalBar' | 'pie' | 'line';
  dataKey: string;
  nameKey: string;
  height?: number;
}

export const SufisaChart: React.FC<ChartProps> = ({ 
  data, 
  title, 
  type, 
  dataKey, 
  nameKey, 
  height = 300 
}) => {
  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={nameKey} stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                color: '#F3F4F6'
              }} 
            />
            <Bar dataKey={dataKey} fill="#6366F1" />
          </BarChart>
        );

      case 'horizontalBar':
        return (
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" stroke="#9CA3AF" />
            <YAxis 
              type="category" 
              dataKey={nameKey} 
              stroke="#9CA3AF"
              width={100}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                color: '#F3F4F6'
              }} 
            />
            <Bar dataKey={dataKey} fill="#8B5CF6" />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                color: '#F3F4F6'
              }} 
            />
          </PieChart>
        );

      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={nameKey} stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                color: '#F3F4F6'
              }} 
            />
            <Line 
              type="monotone" 
              dataKey={dataKey} 
              stroke="#10B981" 
              strokeWidth={2}
              dot={{ fill: '#10B981' }}
            />
          </LineChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-indigo-200 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default SufisaChart;