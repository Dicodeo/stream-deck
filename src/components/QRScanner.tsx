import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import * as Icons from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const startScanner = async () => {
    setHasStarted(true);
    setErrorMsg(null);
    
    // Pequeno delay para garantir que a div #qr-reader foi montada
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: "environment" },
          config,
          (decodedText) => {
            onScan(decodedText);
            stopScanner();
          },
          () => {
            // Ignoramos erros de frame sem QR
          }
        );
        setIsReady(true);
      } catch (err: any) {
        console.error("Camera access error:", err);
        setErrorMsg("Não foi possível acessar a câmera traseira. Verifique as permissões ou tente outra câmera.");
        setHasStarted(false);
      }
    }, 300);
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error("Failed to stop scanner", err);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
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
              <h2 className="text-lg font-black text-white uppercase italic tracking-tight">Leitor de QR</h2>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Aponte para o código do OBS</p>
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
                <h3 className="text-white font-bold text-sm uppercase tracking-wider">Acesso à Câmera</h3>
                <p className="text-xs text-gray-400 leading-relaxed px-4">
                  Para ler o QR Code, precisamos abrir a câmera traseira do seu dispositivo. 
                  Clique abaixo para autorizar.
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
                Ativar Leitor QR
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative group">
                <div id="qr-reader" className="overflow-hidden rounded-2xl border border-white/20 bg-black shadow-inner aspect-square" />
                {!isReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl gap-3">
                    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                    <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Iniciando Câmera...</p>
                  </div>
                )}
                {isReady && (
                  <>
                    <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] border-2 border-blue-500/50 rounded-lg pointer-events-none shadow-[0_0_0_1000px_rgba(0,0,0,0.4)]">
                      <div className="absolute top-[-2px] left-[-2px] w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                      <div className="absolute top-[-2px] right-[-2px] w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                      <div className="absolute bottom-[-2px] left-[-2px] w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                      <div className="absolute bottom-[-2px] right-[-2px] w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
                      <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,1)] animate-[scan_2s_linear_infinite]" />
                    </div>
                  </>
                )}
              </div>
              <p className="text-[10px] text-center text-gray-500 font-bold uppercase tracking-widest animate-pulse">
                Escaneie o QR Code agora
              </p>
            </div>
          )}
          
          <div className="mt-6 bg-white/5 border border-white/10 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <Icons.Info className="text-purple-400 shrink-0 mt-0.5" size={16} />
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider italic">Instrução:</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Posicione o QR Code dentro do quadrado central. A leitura será automática assim que houver foco.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-full mt-4 py-3 text-gray-500 hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
      `}</style>
    </div>
  );
};
