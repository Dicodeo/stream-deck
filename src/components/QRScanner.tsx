import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import * as Icons from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startScanner = () => {
    setHasStarted(true);
    setErrorMsg(null);
    
    // Pequeno delay para garantir que a div #qr-reader foi montada se estiver usando condicional
    setTimeout(() => {
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
        // Ignoramos erros de frame sem QR
      };

      try {
        scannerRef.current.render(onSuccess, onError);
      } catch (err: any) {
        console.error("Render error:", err);
        setErrorMsg("Não foi possível acessar a câmera. Verifique se deu permissão no navegador.");
        setHasStarted(false);
      }
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-[32px] w-full max-w-md overflow-hidden relative shadow-2xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Icons.Camera className="text-purple-400" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white uppercase italic tracking-tight">Câmera OBS</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Configuração rápida via QR</p>
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
          {!hasStarted ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                <Icons.Smartphone className="text-blue-400" size={32} />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Acesso necessário</h3>
                <p className="text-xs text-gray-400 leading-relaxed px-4">
                  Para ler o QR Code do OBS, precisamos de permissão para usar sua câmera. 
                  Um aviso de permissão aparecerá em seguida.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400 flex items-center gap-2">
                  <Icons.AlertTriangle size={14} className="shrink-0" />
                  {errorMsg}
                </div>
              )}

              <button 
                onClick={startScanner}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black uppercase text-[12px] tracking-[0.2em] rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                Permitir e Iniciar
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div id="qr-reader" className="overflow-hidden rounded-2xl border border-white/10 bg-black/40" />
              <p className="text-[10px] text-center text-gray-500 font-medium animate-pulse">
                Aguardando foco no QR Code...
              </p>
            </div>
          )}
          
          <div className="mt-6 bg-white/5 border border-white/10 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <Icons.Info className="text-purple-400 shrink-0 mt-0.5" size={16} />
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider italic">Dica Mobile:</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Se o QR não ler de primeira, tente aumentar o brilho do monitor onde o OBS está aberto.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-4 py-3 text-gray-500 hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
};
