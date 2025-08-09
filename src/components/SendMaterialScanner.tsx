import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRScanner } from './QRScanner';
import { Product } from './ProductCard';
import { Event } from './EventForm';
import { QrCode, Send } from 'lucide-react';

interface SendMaterialScannerProps {
  products: Product[];
  events: Event[];
  onSendToEvent: (productId: string, eventId: string, quantity: number) => void;
}

export const SendMaterialScanner = ({ products, events, onSendToEvent }: SendMaterialScannerProps) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isSelectionOpen, setIsSelectionOpen] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const handleQRScan = (data: string) => {
    // Try to find product by QR code
    const product = products.find(p => p.qrCode === data);
    
    if (product) {
      setScannedProduct(product);
      setIsScannerOpen(false);
      setIsSelectionOpen(true);
      setQuantity(1);
      setSelectedEventId('');
    } else {
      alert('Produto não encontrado com este código QR');
    }
  };

  const handleSendToEvent = async () => {
    if (scannedProduct && selectedEventId && quantity > 0) {
      try {
        await onSendToEvent(scannedProduct.id, selectedEventId, quantity);
        // Only close dialog and reset state after successful operation
        setIsSelectionOpen(false);
        setScannedProduct(null);
        setSelectedEventId('');
        setQuantity(1);
      } catch (error) {
        console.error('Error sending material to event:', error);
        // Keep dialog open on error
      }
    }
  };

  const handleCloseSelection = () => {
    setIsSelectionOpen(false);
    setScannedProduct(null);
    setSelectedEventId('');
    setQuantity(1);
  };

  const activeEvents = events.filter(event => event.status === 'planned' || event.status === 'active');

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Enviar Material</h2>
        <p className="text-muted-foreground mb-6">
          Escaneie o código QR do produto para enviá-lo a um evento
        </p>
        
        <Button 
          onClick={() => setIsScannerOpen(true)} 
          size="lg"
          className="w-full max-w-md"
        >
          <QrCode className="h-5 w-5 mr-2" />
          Escanear Código QR
        </Button>
      </div>

      {/* QR Scanner */}
      <QRScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleQRScan}
      />

      {/* Event Selection Dialog */}
      <Dialog open={isSelectionOpen} onOpenChange={handleCloseSelection}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle>Enviar Material para Evento</DialogTitle>
          </DialogHeader>
          
          <div id="dialog-description" className="sr-only">
            Selecione um evento e quantidade para enviar o material escaneado
          </div>
          {scannedProduct && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold">{scannedProduct.name}</h3>
                <p className="text-sm text-muted-foreground">{scannedProduct.category}</p>
                <p className="text-sm">Estoque disponível: {scannedProduct.quantity}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event">Evento de Destino*</Label>
                <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeEvents.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade*</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={scannedProduct.quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseSelection} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSendToEvent} 
                  className="flex-1"
                  disabled={!selectedEventId || quantity <= 0 || quantity > scannedProduct.quantity}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};