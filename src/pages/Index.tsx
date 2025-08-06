import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Plus, Search, Filter } from 'lucide-react';
import { ProductCard, Product } from '@/components/ProductCard';
import { ProductForm } from '@/components/ProductForm';
import { QRScanner } from '@/components/QRScanner';
import { StockStats } from '@/components/StockStats';
import { toast } from '@/hooks/use-toast';

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [scannedQRData, setScannedQRData] = useState<string>('');

  // Load products from localStorage on component mount
  useEffect(() => {
    const savedProducts = localStorage.getItem('stock-products');
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      // Add some demo data
      const demoProducts: Product[] = [
        {
          id: '1',
          name: 'Mesa Redonda 1.5m',
          category: 'Mobiliário',
          quantity: 15,
          minStock: 5,
          description: 'Mesa redonda para 8 pessoas',
          qrCode: 'MESA-001'
        },
        {
          id: '2',
          name: 'Refletor LED 50W',
          category: 'Iluminação',
          quantity: 3,
          minStock: 5,
          description: 'Refletor LED branco quente',
          qrCode: 'LED-001'
        },
        {
          id: '3',
          name: 'Caixa de Som Ativa',
          category: 'Som e Áudio',
          quantity: 8,
          minStock: 3,
          description: 'Caixa ativa 500W RMS',
          qrCode: 'SOM-001'
        }
      ];
      setProducts(demoProducts);
      localStorage.setItem('stock-products', JSON.stringify(demoProducts));
    }
  }, []);

  // Save products to localStorage whenever products change
  useEffect(() => {
    localStorage.setItem('stock-products', JSON.stringify(products));
  }, [products]);

  const handleSaveProduct = (productData: Omit<Product, 'id'>) => {
    if (editingProduct) {
      // Update existing product
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? { ...productData, id: editingProduct.id }
          : p
      ));
    } else {
      // Add new product
      const newProduct: Product = {
        ...productData,
        id: Date.now().toString()
      };
      setProducts(prev => [...prev, newProduct]);
    }
    
    setEditingProduct(undefined);
    setScannedQRData('');
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Produto removido",
      description: "O produto foi removido do estoque",
    });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleQRScan = (data: string) => {
    setScannedQRData(data);
    setIsFormOpen(true);
  };

  const openNewProductForm = () => {
    setEditingProduct(undefined);
    setScannedQRData('');
    setIsFormOpen(true);
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Sistema de Controle de Estoque
          </h1>
          <p className="text-muted-foreground">
            Gerencie seu estoque de equipamentos para eventos
          </p>
        </div>

        {/* Stats */}
        <StockStats products={products} />

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as categorias</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={() => setIsScannerOpen(true)} className="flex-1 sm:flex-none">
              <QrCode className="h-4 w-4 mr-2" />
              Escanear QR
            </Button>
            <Button onClick={openNewProductForm} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </p>
            <Button onClick={openNewProductForm}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Produto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        )}

        {/* Forms and Modals */}
        <ProductForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveProduct}
          product={editingProduct}
          initialQRData={scannedQRData}
        />

        <QRScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleQRScan}
        />
      </div>
    </div>
  );
};

export default Index;
