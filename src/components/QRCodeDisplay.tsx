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

  const downloadQRCode = async () => {
    try {
      // Fetch the QR code image
      const response = await fetch(qrCodeImageUrl);
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-${productName.replace(/[^a-zA-Z0-9]/g, '-')}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the temporary URL
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download concluído",
        description: "QR Code baixado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o QR Code",
        variant: "destructive",
      });
    }
  };

  const printQRCode = () => {
    // Create a new window with the QR code for direct printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Code - ${productName}</title>
          <style>
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
            }
            .qr-container {
              page-break-inside: avoid;
              margin: 20px auto;
              padding: 20px;
              border: 2px dashed #ccc;
              max-width: 400px;
            }
            .product-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .qr-code {
              margin: 15px 0;
            }
            .qr-text {
              font-size: 12px;
              word-break: break-all;
              margin-top: 10px;
              font-family: monospace;
            }
            .print-button {
              padding: 10px 20px;
              background: #007acc;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              margin: 10px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="product-name">${productName}</div>
            <div class="qr-code">
              <img src="${qrCodeImageUrl}" alt="QR Code" style="width: 200px; height: 200px;" />
            </div>
            <div class="qr-text">${qrCode}</div>
          </div>
          <div class="no-print">
            <button class="print-button" onclick="window.print()">🖨️ Imprimir QR Code</button>
            <button class="print-button" onclick="window.close()">❌ Fechar</button>
          </div>
          <script>
            // Auto print after page loads
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
    
    toast({
      title: "Impressão iniciada",
      description: "Janela de impressão aberta automaticamente",
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
              <Button onClick={printQRCode} variant="default" size="sm">
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