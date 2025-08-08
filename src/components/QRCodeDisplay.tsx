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

  const printThermalQRCode = () => {
    // Generate TSC commands for Argox 2140 thermal printer
    const tscCommands = `SIZE 50 mm,30 mm
GAP 2 mm,0 mm
DIRECTION 1,0
REFERENCE 0,0
OFFSET 0 mm
SET TEAR ON
DENSITY 8
SET RIBBON OFF
CLS

TEXT 25,25,"3",0,1,1,"${productName}"
QRCODE 25,50,M,5,A,0,"${qrCode}"
TEXT 25,180,"2",0,1,1,"${qrCode}"

PRINT 1,1
`;

    // Create and download TSC file
    const blob = new Blob([tscCommands], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-${productName.replace(/[^a-zA-Z0-9]/g, '-')}.tsc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Also open instruction window
    const instructionWindow = window.open('', '_blank');
    if (instructionWindow) {
      instructionWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Instruções - Impressora Argox 2140</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
              line-height: 1.6;
            }
            .header {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            .commands {
              background: #f9f9f9;
              padding: 15px;
              border-radius: 8px;
              font-family: monospace;
              white-space: pre-line;
              border-left: 4px solid #007acc;
            }
            .preview {
              border: 2px dashed #ccc;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
              background: white;
            }
            .step {
              margin: 10px 0;
              padding: 10px;
              border-left: 3px solid #28a745;
              background: #f8f9fa;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Impressão QR Code - Argox 2140</h1>
            <p><strong>Produto:</strong> ${productName}</p>
            <p><strong>Configuração:</strong> Etiqueta 50x30mm, Gap 2mm, Modo Tear</p>
          </div>
          
          <div class="step">
            <h3>🔄 Arquivo TSC baixado automaticamente</h3>
            <p>O arquivo com comandos TSC para a impressora Argox 2140 foi baixado. Localize o arquivo <strong>qr-${productName.replace(/[^a-zA-Z0-9]/g, '-')}.tsc</strong> em sua pasta de downloads.</p>
          </div>
          
          <div class="step">
            <h3>🖨️ Como imprimir:</h3>
            <p>1. Conecte a impressora Argox 2140 via USB</p>
            <p>2. Abra o software da Argox (Argox Printer Utility)</p>
            <p>3. Carregue o arquivo .tsc baixado</p>
            <p>4. Clique em "Send to Printer" ou execute o comando</p>
          </div>
          
          <div class="preview">
            <h3>📋 Preview da Etiqueta (50x30mm)</h3>
            <div style="width: 200px; height: 120px; border: 1px solid #000; margin: 0 auto; padding: 10px; position: relative;">
              <div style="font-size: 12px; font-weight: bold; text-align: center;">${productName}</div>
              <div style="width: 60px; height: 60px; border: 1px solid #000; margin: 10px auto; background: url('${qrCodeImageUrl}') no-repeat center; background-size: contain;"></div>
              <div style="font-size: 8px; text-align: center; word-break: break-all;">${qrCode.substring(0, 30)}...</div>
            </div>
          </div>
          
          <div class="commands">
            <h3>📝 Comandos TSC Gerados:</h3>
${tscCommands}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <button onclick="window.close()" style="padding: 10px 20px; background: #007acc; color: white; border: none; border-radius: 4px; cursor: pointer;">Fechar Janela</button>
          </div>
        </body>
        </html>
      `);
      instructionWindow.document.close();
    }
    
    toast({
      title: "Arquivo TSC criado",
      description: "Arquivo para impressora Argox 2140 baixado com sucesso",
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
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                <Copy className="h-4 w-4 mr-1" />
                Copiar
              </Button>
              <Button onClick={downloadQRCode} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Baixar
              </Button>
            </div>
            
            {/* Print Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={printQRCode} variant="default" size="sm">
                <Printer className="h-4 w-4 mr-1" />
                Imprimir
              </Button>
              <Button onClick={printThermalQRCode} variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-1" />
                Argox 2140
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