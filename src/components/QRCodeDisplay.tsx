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
    // Generate TSC commands for Argox 2140 printer
    const generateTSCCommands = () => {
      const commands = [
        'SIZE 50 mm, 30 mm',  // Label size
        'GAP 2 mm, 0 mm',     // Gap between labels
        'DIRECTION 1',         // Print direction
        'REFERENCE 0,0',       // Reference point
        'OFFSET 0 mm',         // Offset
        'SET PEEL OFF',        // Peel off mode
        'SET CUTTER OFF',      // Cutter off
        'SET PARTIAL_CUTTER OFF',
        'SET TEAR ON',         // Tear mode
        'CLS',                 // Clear buffer
        '',
        // Product name
        `TEXT 25,20,"3",0,1,1,"${productName}"`,
        '',
        // QR Code (centered)
        `QRCODE 25,50,H,4,A,0,"${qrCode}"`,
        '',
        // QR Code text below
        `TEXT 25,180,"1",0,1,1,"${qrCode}"`,
        '',
        'PRINT 1,1',           // Print 1 label, 1 copy
        ''
      ];
      
      return commands.join('\n');
    };

    const tscCommands = generateTSCCommands();
    
    // Create a downloadable TSC file
    const blob = new Blob([tscCommands], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-label-${productName.replace(/[^a-zA-Z0-9]/g, '-')}.tsc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Also show print window with instructions
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Impressão QR Code - Argox 2140</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .product-name {
              font-size: 24px;
              font-weight: bold;
              color: #333;
              margin-bottom: 10px;
            }
            .printer-model {
              font-size: 16px;
              color: #666;
            }
            .instructions {
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .instructions h3 {
              margin-top: 0;
              color: #495057;
            }
            .instructions ol {
              margin: 10px 0;
              padding-left: 20px;
            }
            .instructions li {
              margin: 8px 0;
            }
            .tsc-code {
              background: #f1f3f4;
              border: 1px solid #dadce0;
              border-radius: 4px;
              padding: 15px;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              white-space: pre-wrap;
              overflow-x: auto;
              margin: 15px 0;
            }
            .download-info {
              background: #e8f5e8;
              border: 1px solid #c3e6c3;
              border-radius: 4px;
              padding: 15px;
              margin: 15px 0;
            }
            .preview {
              text-align: center;
              margin: 20px 0;
              padding: 20px;
              border: 2px dashed #ccc;
              border-radius: 8px;
            }
            @media print {
              .instructions, .download-info { display: none; }
              body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="product-name">${productName}</div>
              <div class="printer-model">Configurado para Argox 2140</div>
            </div>

            <div class="download-info">
              <strong>✅ Arquivo TSC baixado automaticamente!</strong><br>
              O arquivo "qr-label-${productName.replace(/[^a-zA-Z0-9]/g, '-')}.tsc" foi baixado para seu computador.
            </div>

            <div class="instructions">
              <h3>📋 Instruções para Impressão:</h3>
              <ol>
                <li><strong>Conecte a impressora Argox 2140</strong> ao computador via USB ou Ethernet</li>
                <li><strong>Instale o driver</strong> da Argox 2140 se ainda não instalado</li>
                <li><strong>Abra o software da impressora</strong> (Argox Printer Utility ou similar)</li>
                <li><strong>Carregue o arquivo TSC</strong> baixado automaticamente</li>
                <li><strong>Configure o tamanho da etiqueta:</strong>
                    <ul>
                      <li>Largura: 50mm</li>
                      <li>Altura: 30mm</li>
                      <li>Gap: 2mm</li>
                    </ul>
                </li>
                <li><strong>Envie para impressão</strong></li>
              </ol>
            </div>

            <div class="preview">
              <h3>🎯 Preview da Etiqueta:</h3>
              <div style="border: 1px solid #333; width: 200px; height: 120px; margin: 0 auto; padding: 10px; background: white;">
                <div style="text-align: center; font-weight: bold; font-size: 12px; margin-bottom: 5px;">${productName}</div>
                <div style="text-align: center; margin: 10px 0;">
                  <img src="${qrCodeImageUrl}" alt="QR Code" style="width: 60px; height: 60px;" />
                </div>
                <div style="text-align: center; font-size: 8px; font-family: monospace;">${qrCode.substring(0, 20)}...</div>
              </div>
            </div>

            <div class="tsc-code">
              <strong>Comandos TSC gerados:</strong><br>
              ${tscCommands.replace(/\n/g, '<br>')}
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
    
    toast({
      title: "Arquivo TSC gerado!",
      description: "Arquivo para impressora Argox 2140 foi baixado. Consulte as instruções na nova janela.",
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