import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CameraOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface QRScannerProps {
  onScanSuccess: (data: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const QRScanner = ({ onScanSuccess, isOpen, onClose }: QRScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsScanning(true);
    } catch (error) {
      console.error('Erro ao acessar a câmera:', error);
      toast({
        title: "Erro",
        description: "Erro ao acessar a câmera",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
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
              onClick={stopCamera} 
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