import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Package } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  description?: string;
  qrCode?: string;
}

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const ProductCard = ({ product, onEdit, onDelete }: ProductCardProps) => {
  const isLowStock = product.quantity <= product.minStock;

  return (
    <Card className="shadow-elegant hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{product.name}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(product)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(product.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{product.category}</Badge>
          <Badge 
            variant={isLowStock ? "destructive" : "default"}
            className={isLowStock ? "bg-destructive" : "bg-success"}
          >
            Estoque: {product.quantity}
          </Badge>
        </div>
        
        {product.description && (
          <p className="text-sm text-muted-foreground">{product.description}</p>
        )}
        
        <div className="text-xs text-muted-foreground">
          Estoque mínimo: {product.minStock}
        </div>
        
        {isLowStock && (
          <div className="text-xs text-destructive font-medium">
            ⚠️ Estoque baixo!
          </div>
        )}
      </CardContent>
    </Card>
  );
};