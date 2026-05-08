import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import * as Icons from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Basic scanner configuration
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      config,
      /* verbose= */ false
    );

    const onSuccess = (decodedText: string) => {
      onScan(decodedText);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear scanner", error);
        });
      }
    };

    const onError = (errorMessage: string) => {
      // Errors are common (no QR found in frame), we just ignore them
      // console.warn(`QR Code no longer in front of camera.`, errorMessage);
    };

    scannerRef.current.render(onSuccess, onError);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear scanner during unmount", error);
        });
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden relative shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Icons.QrCode className="text-purple-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase italic tracking-tight">Escanear QR Code</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Aponte para o QR do OBS Studio</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <Icons.X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div id="qr-reader" className="overflow-hidden rounded-2xl border border-white/10 bg-black/40" />
          
          <div className="mt-6 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <Icons.Info className="text-blue-400 shrink-0 mt-0.5" size={16} />
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Formatos Suportados:</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Escaneie o QR Code gerado pelo plugin de WebSocket do OBS ou insira um JSON contendo {"{ \"address\": \"...\", \"password\": \"...\" }"}.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-6 py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[12px] tracking-[0.2em] rounded-2xl transition-all border border-white/5 active:scale-95"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
