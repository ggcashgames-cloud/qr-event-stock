import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Package, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Event } from '@/components/EventForm';

interface EventProduct {
  id: string;
  event_id: string;
  product_id: string;
  quantity_sent: number;
  product: {
    id: string;
    name: string;
    category: string;
    quantity: number;
  };
}

const ReturnMaterial = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventProducts, setEventProducts] = useState<EventProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<EventProduct | null>(null);
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('status', ['active', 'completed'])
        .order('date', { ascending: false });

      if (error) {
        console.error('Error loading events:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os eventos",
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
    } finally {
      setLoading(false);
    }
  };

  const loadEventProducts = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_products')
        .select(`
          *,
          product:products(id, name, category, quantity)
        `)
        .eq('event_id', eventId);

      if (error) {
        console.error('Error loading event products:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os produtos do evento",
          variant: "destructive",
        });
        return;
      }

      setEventProducts(data || []);
    } catch (error) {
      console.error('Error loading event products:', error);
    }
  };

  const handleSelectEvent = async (event: Event) => {
    setSelectedEvent(event);
    await loadEventProducts(event.id);
  };

  const handleReturnProduct = (product: EventProduct) => {
    setSelectedProduct(product);
    setReturnQuantity(1);
    setIsReturnDialogOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!selectedProduct || !selectedEvent) return;

    if (returnQuantity > selectedProduct.quantity_sent) {
      toast({
        title: "Erro",
        description: "Quantidade de retorno não pode ser maior que a quantidade enviada",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update product quantity (add back to stock)
      const { error: updateProductError } = await supabase
        .from('products')
        .update({ 
          quantity: selectedProduct.product.quantity + returnQuantity 
        })
        .eq('id', selectedProduct.product_id);

      if (updateProductError) {
        console.error('Error updating product quantity:', updateProductError);
        toast({
          title: "Erro",
          description: "Não foi possível atualizar o estoque do produto",
          variant: "destructive",
        });
        return;
      }

      // Update or remove event_product record
      const newQuantitySent = selectedProduct.quantity_sent - returnQuantity;
      
      if (newQuantitySent <= 0) {
        // Remove the record if all items are returned
        const { error: deleteError } = await supabase
          .from('event_products')
          .delete()
          .eq('id', selectedProduct.id);

        if (deleteError) {
          console.error('Error removing event product:', deleteError);
          toast({
            title: "Erro",
            description: "Não foi possível remover o produto do evento",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Update the quantity sent
        const { error: updateError } = await supabase
          .from('event_products')
          .update({ quantity_sent: newQuantitySent })
          .eq('id', selectedProduct.id);

        if (updateError) {
          console.error('Error updating event product:', updateError);
          toast({
            title: "Erro",
            description: "Não foi possível atualizar a quantidade do produto no evento",
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Material retornado",
        description: `${returnQuantity} unidade(s) de ${selectedProduct.product.name} retornada(s) ao estoque`,
      });

      // Reload event products
      await loadEventProducts(selectedEvent.id);
      setIsReturnDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error returning material:', error);
      toast({
        title: "Erro",
        description: "Não foi possível retornar o material",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default' as const,
      completed: 'secondary' as const,
      planned: 'outline' as const,
    };
    
    const labels = {
      active: 'Ativo',
      completed: 'Concluído',
      planned: 'Planejado',
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Carregando eventos...</p>
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Retornar Material</h2>
          <p className="text-muted-foreground">
            Selecione um evento para retornar materiais ao estoque
          </p>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum evento encontrado</h3>
                <p className="text-muted-foreground">
                  Não há eventos ativos ou concluídos com materiais para retornar
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card key={event.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    {getStatusBadge(event.status)}
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.date).toLocaleDateString('pt-BR')}
                  </CardDescription>
                  {event.location && (
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => handleSelectEvent(event)}
                    className="w-full"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Ver Materiais
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => setSelectedEvent(null)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h2 className="text-2xl font-bold">{selectedEvent.name}</h2>
          <p className="text-muted-foreground">
            Materiais enviados para este evento
          </p>
        </div>
      </div>

      {eventProducts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum material encontrado</h3>
              <p className="text-muted-foreground">
                Este evento não possui materiais para retornar
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {eventProducts.map((eventProduct) => (
            <Card key={eventProduct.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{eventProduct.product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Categoria: {eventProduct.product.category}
                    </p>
                    <p className="text-sm">
                      Quantidade enviada: {eventProduct.quantity_sent}
                    </p>
                  </div>
                  <Button 
                    onClick={() => handleReturnProduct(eventProduct)}
                    variant="outline"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retornar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Return Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retornar Material</DialogTitle>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">{selectedProduct.product.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Quantidade disponível para retorno: {selectedProduct.quantity_sent}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="return-quantity">Quantidade a retornar</Label>
                <Input
                  id="return-quantity"
                  type="number"
                  min={1}
                  max={selectedProduct.quantity_sent}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsReturnDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmReturn}>
                  Confirmar Retorno
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReturnMaterial;