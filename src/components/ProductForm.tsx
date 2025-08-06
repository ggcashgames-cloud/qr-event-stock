import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Product } from './ProductCard';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Omit<Product, 'id'>) => void;
  product?: Product;
  initialQRData?: string;
}

const categories = [
  'Iluminação',
  'Som e Áudio', 
  'Decoração',
  'Mobiliário',
  'Equipamentos',
  'Consumíveis',
  'Outros'
];

export const ProductForm = ({ isOpen, onClose, onSave, product, initialQRData }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    minStock: 1,
    description: '',
    qrCode: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        category: product.category,
        quantity: product.quantity,
        minStock: product.minStock,
        description: product.description || '',
        qrCode: product.qrCode || ''
      });
    } else if (initialQRData) {
      setFormData(prev => ({
        ...prev,
        qrCode: initialQRData,
        name: initialQRData // Use QR data as initial name
      }));
    } else {
      setFormData({
        name: '',
        category: '',
        quantity: 0,
        minStock: 1,
        description: '',
        qrCode: ''
      });
    }
  }, [product, initialQRData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.category) {
      toast({
        title: "Erro",
        description: "Nome e categoria são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    let finalFormData = { ...formData };
    
    // Generate QR code automatically if not provided and it's a new product
    if (!product && !formData.qrCode.trim()) {
      const uniqueId = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      finalFormData.qrCode = uniqueId;
    }

    onSave(finalFormData);
    onClose();
    
    toast({
      title: "Sucesso!",
      description: product ? "Produto atualizado" : "Produto adicionado com QR code gerado automaticamente",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {product ? 'Editar Produto' : 'Adicionar Produto'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Mesa Redonda 1.5m"
              required
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="minStock">Estoque Mínimo</Label>
              <Input
                id="minStock"
                type="number"
                min="1"
                value={formData.minStock}
                onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="qrCode">Código QR</Label>
            <Input
              id="qrCode"
              value={formData.qrCode}
              onChange={(e) => setFormData(prev => ({ ...prev, qrCode: e.target.value }))}
              placeholder={product || initialQRData ? "Código QR do produto" : "Será gerado automaticamente se vazio"}
              readOnly={!!initialQRData}
            />
            {!product && !initialQRData && (
              <p className="text-xs text-muted-foreground">
                💡 Um código QR único será gerado automaticamente para novos produtos
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição adicional do produto..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              {product ? 'Atualizar' : 'Adicionar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};