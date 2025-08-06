import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Copy, Download, Printer } from 'lucide-react';
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

  const printQRCode = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - ${productName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
              margin: 0;
            }
            .container {
              max-width: 400px;
              margin: 0 auto;
            }
            .product-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 10px;
              color: #333;
            }
            .qr-code {
              margin: 20px 0;
              border: 1px solid #ddd;
              border-radius: 8px;
              padding: 10px;
              background: white;
            }
            .qr-code img {
              max-width: 100%;
              height: auto;
            }
            .qr-text {
              font-family: monospace;
              font-size: 14px;
              background: #f5f5f5;
              padding: 10px;
              border-radius: 4px;
              margin-top: 10px;
              word-break: break-all;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 10px;
              }
              .container {
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="product-name">${productName}</div>
            <div class="qr-code">
              <img src="${qrCodeImageUrl}" alt="QR Code" />
            </div>
            <div class="qr-text">${qrCode}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
    
    toast({
      title: "Imprimindo QR Code",
      description: "A janela de impressão foi aberta",
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
            <div className="grid grid-cols-3 gap-2">
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-1" />
                Copiar
              </Button>
              <Button onClick={downloadQRCode} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Baixar
              </Button>
              <Button onClick={printQRCode} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-1" />
                Imprimir
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