import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BrowserQRCodeReader } from '@zxing/browser';

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const QRScanner = ({ onScanSuccess, isOpen, onClose }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [codeReader, setCodeReader] = useState<BrowserQRCodeReader | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasScanned(false);
      startScanner();
    } else {
      stopScanner();
    }

    return () => stopScanner();
  }, [isOpen]);

  const startScanner = async () => {
    try {
      const reader = new BrowserQRCodeReader();
      setCodeReader(reader);
      
      // Get available video devices
      const videoInputDevices = await BrowserQRCodeReader.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('Nenhuma câmera encontrada');
      }

      // Try to use back camera if available
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      ) || videoInputDevices[0];

      setIsScanning(true);

      // Start decoding from video element
      reader.decodeFromVideoDevice(
        backCamera.deviceId,
        videoRef.current!,
        (result, error) => {
          if (result && !hasScanned) {
            const qrText = result.getText();
            setHasScanned(true);
            onScanSuccess(qrText);
            toast({
              title: "QR Code escaneado!",
              description: `Dados: ${qrText}`,
            });
            stopScanner();
            onClose();
          }
          
          if (error && error.name !== 'NotFoundException') {
            console.error('Erro ao escanear:', error);
          }
        }
      );

    } catch (error) {
      console.error('Erro ao iniciar scanner:', error);
      toast({
        title: "Erro",
        description: "Erro ao acessar a câmera ou iniciar o scanner",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (codeReader) {
      // Stop the video stream manually
      const video = videoRef.current;
      if (video && video.srcObject) {
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        video.srcObject = null;
      }
      setCodeReader(null);
    }
    setIsScanning(false);
  };

  const handleManualInput = () => {
    const qrData = prompt('Digite o código QR manualmente:');
    if (qrData) {
      onScanSuccess(qrData);
      onClose();
      toast({
        title: "Código adicionado!",
        description: `Dados: ${qrData}`,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Escaneamento QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              autoPlay
              muted
              playsInline
            />
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white text-center">
                  Posicione o QR Code na frente da câmera
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleManualInput} 
              variant="outline"
              className="flex-1"
            >
              Digitar Código
            </Button>
            <Button 
              onClick={stopScanner} 
              disabled={!isScanning}
              variant="outline"
              className="flex-1"
            >
              <CameraOff className="h-4 w-4 mr-2" />
              Parar
            </Button>
            <Button onClick={onClose} variant="destructive" className="flex-1">
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};