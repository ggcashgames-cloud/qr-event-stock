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
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [scannedQRData, setScannedQRData] = useState<string>('');

  // Load products from Supabase on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading products:', error);
        toast({
          title: "Erro ao carregar produtos",
          description: "Não foi possível carregar os produtos do banco de dados",
          variant: "destructive",
        });
        return;
      }

      const formattedProducts: Product[] = data.map(product => ({
        id: product.id,
        name: product.name,
        category: product.category,
        quantity: product.quantity,
        minStock: product.min_stock,
        description: product.description,
        qrCode: product.qr_code
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar os produtos",
        variant: "destructive",
      });
    }
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id'>) => {
    try {
      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update({
            name: productData.name,
            category: productData.category,
            quantity: productData.quantity,
            min_stock: productData.minStock,
            description: productData.description,
            qr_code: productData.qrCode
          })
          .eq('id', editingProduct.id);

        if (error) {
          console.error('Error updating product:', error);
          toast({
            title: "Erro ao atualizar produto",
            description: "Não foi possível atualizar o produto",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Produto atualizado",
          description: "O produto foi atualizado com sucesso",
        });
      } else {
        // Add new product
        const { error } = await supabase
          .from('products')
          .insert({
            name: productData.name,
            category: productData.category,
            quantity: productData.quantity,
            min_stock: productData.minStock,
            description: productData.description,
            qr_code: productData.qrCode
          });

        if (error) {
          console.error('Error creating product:', error);
          toast({
            title: "Erro ao criar produto",
            description: "Não foi possível criar o produto",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Produto criado",
          description: "O produto foi criado com sucesso",
        });
      }

      // Reload products from database
      await loadProducts();
      setEditingProduct(undefined);
      setScannedQRData('');
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Erro ao salvar produto",
        description: "Não foi possível salvar o produto",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting product:', error);
        toast({
          title: "Erro ao remover produto",
          description: "Não foi possível remover o produto",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Produto removido",
        description: "O produto foi removido do estoque",
      });

      // Reload products from database
      await loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erro ao remover produto",
        description: "Não foi possível remover o produto",
        variant: "destructive",
      });
    }
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
    const matchesCategory = !categoryFilter || categoryFilter === 'all' || product.category === categoryFilter;
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
                <SelectItem value="all">Todas as categorias</SelectItem>
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
