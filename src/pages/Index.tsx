import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Plus, Search, Filter, Calendar, Send, Package, RotateCcw, Users, LogOut } from 'lucide-react';
import { ProductCard, Product } from '@/components/ProductCard';
import { ProductForm } from '@/components/ProductForm';
import { QRScanner } from '@/components/QRScanner';
import { StockStats } from '@/components/StockStats';
import { EventForm, Event } from '@/components/EventForm';
import { EventCard } from '@/components/EventCard';
import { SendMaterialScanner } from '@/components/SendMaterialScanner';
import { EventProducts } from '@/components/EventProducts';
import ReturnMaterial from '@/components/ReturnMaterial';
import UserApproval from '@/components/UserApproval';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, profile, loading, signOut, isAdmin, isFinancialAdmin, isApproved } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [scannedQRData, setScannedQRData] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventProductsOpen, setIsEventProductsOpen] = useState(false);
  const [eventProductCounts, setEventProductCounts] = useState<Record<string, number>>({});

  // Redirect to auth if not logged in or not approved
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-bold">Aguardando Aprovação</h1>
          <p className="text-muted-foreground">
            Sua conta foi criada com sucesso e está aguardando aprovação de um administrador.
          </p>
          <Button onClick={signOut} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  // Load data from Supabase on component mount
  useEffect(() => {
    if (isApproved) {
      loadProducts();
      loadEvents();
      loadEventProductCounts();
    }
  }, [isApproved]);

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
        minStock: 0, // Removed min_stock functionality
        description: product.description,
        qrCode: product.qr_code,
        price: product.price || 0
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

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error loading events:', error);
        toast({
          title: "Erro ao carregar eventos",
          description: "Não foi possível carregar os eventos do banco de dados",
          variant: "destructive",
        });
        return;
      }

      const formattedEvents: Event[] = data?.map(event => ({
        ...event,
        status: event.status as 'planned' | 'active' | 'completed'
      })) || [];
      
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      toast({
        title: "Erro ao carregar eventos",
        description: "Não foi possível carregar os eventos",
        variant: "destructive",
      });
    }
  };

  const loadEventProductCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('event_products')
        .select('event_id, quantity_sent');

      if (error) {
        console.error('Error loading event product counts:', error);
        return;
      }

      const counts: Record<string, number> = {};
      data?.forEach(ep => {
        counts[ep.event_id] = (counts[ep.event_id] || 0) + ep.quantity_sent;
      });

      setEventProductCounts(counts);
    } catch (error) {
      console.error('Error loading event product counts:', error);
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
            price: productData.price || 0,
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
            price: productData.price || 0,
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

  // Event handlers
  const handleSaveEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editingEvent.id);

        if (error) {
          console.error('Error updating event:', error);
          toast({
            title: "Erro ao atualizar evento",
            description: "Não foi possível atualizar o evento",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Evento atualizado",
          description: "O evento foi atualizado com sucesso",
        });
      } else {
        const { error } = await supabase
          .from('events')
          .insert(eventData);

        if (error) {
          console.error('Error creating event:', error);
          toast({
            title: "Erro ao criar evento",
            description: "Não foi possível criar o evento",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Evento criado",
          description: "O evento foi criado com sucesso",
        });
      }

      await loadEvents();
      setEditingEvent(undefined);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: "Erro ao salvar evento",
        description: "Não foi possível salvar o evento",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event:', error);
        toast({
          title: "Erro ao remover evento",
          description: "Não foi possível remover o evento",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Evento removido",
        description: "O evento foi removido com sucesso",
      });

      await loadEvents();
      await loadEventProductCounts();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Erro ao remover evento",
        description: "Não foi possível remover o evento",
        variant: "destructive",
      });
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsEventFormOpen(true);
  };

  const handleViewEventProducts = (event: Event) => {
    setSelectedEvent(event);
    setIsEventProductsOpen(true);
  };

  const handleSendToEvent = async (productId: string, eventId: string, quantity: number) => {
    try {
      // Check if product has enough quantity
      const product = products.find(p => p.id === productId);
      if (!product || product.quantity < quantity) {
        toast({
          title: "Estoque insuficiente",
          description: "Não há quantidade suficiente do produto no estoque",
          variant: "destructive",
        });
        return;
      }

      // Insert into event_products or update if exists
      const { error: eventProductError } = await supabase
        .from('event_products')
        .upsert({
          event_id: eventId,
          product_id: productId,
          quantity_sent: quantity
        }, {
          onConflict: 'event_id,product_id',
          ignoreDuplicates: false
        });

      if (eventProductError) {
        console.error('Error sending product to event:', eventProductError);
        toast({
          title: "Erro ao enviar produto",
          description: "Não foi possível enviar o produto para o evento",
          variant: "destructive",
        });
        return;
      }

      // Update product quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ quantity: product.quantity - quantity })
        .eq('id', productId);

      if (updateError) {
        console.error('Error updating product quantity:', updateError);
        toast({
          title: "Erro ao atualizar estoque",
          description: "Não foi possível atualizar o estoque do produto",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Material enviado",
        description: "O produto foi enviado para o evento com sucesso",
      });

      await loadProducts();
      await loadEventProductCounts();
    } catch (error) {
      console.error('Error sending material to event:', error);
      toast({
        title: "Erro ao enviar material",
        description: "Não foi possível enviar o material para o evento",
        variant: "destructive",
      });
    }
  };

  const openNewEventForm = () => {
    setEditingEvent(undefined);
    setIsEventFormOpen(true);
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
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                VISION EVENTOS
              </h1>
              <p className="text-muted-foreground">
                Gerenciamento de Material (Desenvolvido por ALLMASTER)
              </p>
              {profile && (
                <p className="text-sm text-muted-foreground">
                  Olá, {profile.name || profile.email} • {profile.role === 'admin' ? 'Administrador' : profile.role === 'financial_admin' ? 'Admin Financeiro' : 'Usuário'}
                </p>
              )}
            </div>
          </div>
          <Button onClick={signOut} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="estoque" className="w-full">
          <TabsList className={`grid w-full ${isAdmin ? 'grid-cols-6' : 'grid-cols-4'}`}>
            <TabsTrigger value="estoque" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Estoque
            </TabsTrigger>
            <TabsTrigger value="enviar" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Enviar Material
            </TabsTrigger>
            <TabsTrigger value="retornar" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Retornar Material
            </TabsTrigger>
            <TabsTrigger value="eventos" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Eventos
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="aprovacoes" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Aprovações
                </TabsTrigger>
                <TabsTrigger value="financeiro" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Financeiro
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Estoque Tab */}
          <TabsContent value="estoque" className="space-y-6">
            {/* Stats */}
            <StockStats products={products} />

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
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
                {(isAdmin || isFinancialAdmin) && (
                  <Button onClick={openNewProductForm} className="flex-1 sm:flex-none">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                )}
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {searchTerm || categoryFilter ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                </p>
                {(isAdmin || isFinancialAdmin) && (
                  <Button onClick={openNewProductForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Produto
                  </Button>
                )}
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
          </TabsContent>

          {/* Enviar Material Tab */}
          <TabsContent value="enviar" className="space-y-6">
            <SendMaterialScanner
              products={products}
              events={events}
              onSendToEvent={handleSendToEvent}
            />
          </TabsContent>

          {/* Retornar Material Tab */}
          <TabsContent value="retornar" className="space-y-6">
            <ReturnMaterial />
          </TabsContent>

          {/* Eventos Tab */}
          <TabsContent value="eventos" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">Eventos</h2>
                <p className="text-muted-foreground">Gerencie seus eventos e materiais</p>
              </div>
              <Button onClick={openNewEventForm}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Evento
              </Button>
            </div>

            {events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">Nenhum evento cadastrado</p>
                <Button onClick={openNewEventForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Evento
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onEdit={handleEditEvent}
                    onDelete={handleDeleteEvent}
                    onViewProducts={handleViewEventProducts}
                    productCount={eventProductCounts[event.id] || 0}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aprovações Tab - Only for admins */}
          {isAdmin && (
            <TabsContent value="aprovacoes" className="space-y-6">
              <UserApproval />
            </TabsContent>
          )}

          {/* Financeiro Tab - Only for admins and financial admins */}
          {(isAdmin || isFinancialAdmin) && (
            <TabsContent value="financeiro" className="space-y-6">
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Módulo Financeiro</h3>
                <p className="text-muted-foreground">
                  Funcionalidades financeiras serão implementadas em breve
                </p>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Forms and Modals */}
        <ProductForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveProduct}
          product={editingProduct}
          initialQRData={scannedQRData}
        />

        <EventForm
          isOpen={isEventFormOpen}
          onClose={() => setIsEventFormOpen(false)}
          onSave={handleSaveEvent}
          event={editingEvent}
        />

        <EventProducts
          event={selectedEvent}
          isOpen={isEventProductsOpen}
          onClose={() => setIsEventProductsOpen(false)}
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
