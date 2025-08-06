import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import { Product } from './ProductCard';

interface StockStatsProps {
  products: Product[];
}

export const StockStats = ({ products }: StockStatsProps) => {
  const totalProducts = products.length;
  const totalItems = products.reduce((sum, product) => sum + product.quantity, 0);
  const lowStockItems = products.filter(product => product.quantity <= product.minStock).length;
  const categoriesCount = new Set(products.map(product => product.category)).size;

  const stats = [
    {
      title: 'Total de Produtos',
      value: totalProducts,
      icon: Package,
      color: 'bg-gradient-primary'
    },
    {
      title: 'Itens em Estoque',
      value: totalItems,
      icon: BarChart3,
      color: 'bg-gradient-success'
    },
    {
      title: 'Estoque Baixo',
      value: lowStockItems,
      icon: AlertTriangle,
      color: 'bg-destructive'
    },
    {
      title: 'Categorias',
      value: categoriesCount,
      icon: TrendingUp,
      color: 'bg-accent'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-elegant">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <stat.icon className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};