import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Copy, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  qrCode: string;
  productName: string;
}

export const QRCodeDisplay = ({ qrCode, productName }: QRCodeDisplayProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Generate QR code URL using qr-server.com API
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      toast({
        title: "Copiado!",
        description: "Código QR copiado para a área de transferência",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeImageUrl;
    link.download = `qr-${productName.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download iniciado",
      description: "O QR code está sendo baixado",
    });
  };

  if (!qrCode) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="w-full"
      >
        <QrCode className="h-4 w-4 mr-2" />
        Ver QR Code
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {productName}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* QR Code Image */}
            <div className="flex justify-center">
              <img
                src={qrCodeImageUrl}
                alt={`QR Code para ${productName}`}
                className="border rounded-lg"
                style={{ width: '300px', height: '300px' }}
              />
            </div>
            
            {/* QR Code Text */}
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-mono text-center break-all">{qrCode}</p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" className="flex-1">
                <Copy className="h-4 w-4 mr-2" />
                Copiar Código
              </Button>
              <Button onClick={downloadQRCode} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Baixar QR
              </Button>
            </div>
            
            <Button onClick={() => setIsOpen(false)} className="w-full">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};