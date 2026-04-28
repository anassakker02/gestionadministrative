import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface InteractiveChartsProps {
  paymentsData?: ChartData[];
  invoicesData?: ChartData[];
  monthlyData?: ChartData[];
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const InteractiveCharts: React.FC<InteractiveChartsProps> = ({
  paymentsData = [],
  invoicesData = [],
  monthlyData = [],
  className
}) => {
  // Données d'exemple si aucune donnée n'est fournie
  const defaultPaymentsData = [
    { name: 'Jan', value: 4000 },
    { name: 'Fév', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Avr', value: 2780 },
    { name: 'Mai', value: 1890 },
    { name: 'Jun', value: 2390 },
  ];

  const defaultInvoicesData = [
    { name: 'Payées', value: 400, color: '#00C49F' },
    { name: 'En attente', value: 300, color: '#FFBB28' },
    { name: 'En retard', value: 300, color: '#FF8042' },
    { name: 'Partielles', value: 200, color: '#0088FE' },
  ];

  const defaultMonthlyData = [
    { name: 'Jan', value: 4000 },
    { name: 'Fév', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Avr', value: 2780 },
    { name: 'Mai', value: 1890 },
    { name: 'Jun', value: 2390 },
  ];

  const chartData = paymentsData.length > 0 ? paymentsData : defaultPaymentsData;
  const pieData = invoicesData.length > 0 ? invoicesData : defaultInvoicesData;
  const lineData = monthlyData.length > 0 ? monthlyData : defaultMonthlyData;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Graphique en barres - Paiements mensuels */}
      <Card>
        <CardHeader>
          <CardTitle>Paiements Mensuels</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} MAD`, 'Montant']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#f9fafb', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique en secteurs - Statut des factures */}
        <Card>
          <CardHeader>
            <CardTitle>Statut des Factures</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value}`, 'Nombre']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#f9fafb', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Graphique en aires - Évolution des revenus */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des Revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value} MAD`, 'Revenus']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: '#f9fafb', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  fill="#10b981" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Graphique linéaire - Tendances */}
      <Card>
        <CardHeader>
          <CardTitle>Tendances des Paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} MAD`, 'Montant']}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#f9fafb', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveCharts;
