import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Event } from './EventForm';
import type { Product } from './ProductCard';

interface EventProductsProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

interface EventProduct {
  id: string;
  event_id: string;
  product_id: string;
  quantity_sent: number;
  sent_at: string;
  notes?: string;
  product: Product;
}

export const EventProducts = ({ event, isOpen, onClose }: EventProductsProps) => {
  const [eventProducts, setEventProducts] = useState<EventProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event && isOpen) {
      loadEventProducts();
    }
  }, [event, isOpen]);

  const loadEventProducts = async () => {
    if (!event) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_products')
        .select(`
          *,
          product:products(*)
        `)
        .eq('event_id', event.id)
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Error loading event products:', error);
        toast({
          title: "Erro ao carregar produtos",
          description: "Não foi possível carregar os produtos do evento",
          variant: "destructive",
        });
        return;
      }

      const formattedEventProducts = data?.map(ep => ({
        ...ep,
        product: {
          ...ep.product,
          minStock: ep.product.min_stock,
          qrCode: ep.product.qr_code
        }
      })) || [];

      setEventProducts(formattedEventProducts);
    } catch (error) {
      console.error('Error loading event products:', error);
      toast({
        title: "Erro ao carregar produtos",
        description: "Não foi possível carregar os produtos do evento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalProducts = eventProducts.reduce((sum, ep) => sum + ep.quantity_sent, 0);

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Produtos do Evento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Event Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{event.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{format(new Date(event.date), "PPP", { locale: ptBR })}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{totalProducts} {totalProducts === 1 ? 'produto enviado' : 'produtos enviados'}</span>
              </div>
            </CardContent>
          </Card>

          {/* Products List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando produtos...</p>
              </div>
            ) : eventProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Nenhum produto enviado para este evento</p>
              </div>
            ) : (
              eventProducts.map((eventProduct) => (
                <Card key={eventProduct.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{eventProduct.product.name}</h4>
                        <p className="text-sm text-muted-foreground">{eventProduct.product.category}</p>
                        {eventProduct.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{eventProduct.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">
                          {eventProduct.quantity_sent} {eventProduct.quantity_sent === 1 ? 'unidade' : 'unidades'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(eventProduct.sent_at), "PPp", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};