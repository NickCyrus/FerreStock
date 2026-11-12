import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Plus, 
  Minus, 
  ArrowRight,
  Maximize2,
  RefreshCw,
  QrCode
} from 'lucide-react';
import jsQR from 'jsqr';
import { Product, StockMovement } from '../types/inventory';
import { playScannerBeep } from '../utils/audio';
import { parseQrPayload } from '../utils/qr';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onStockChange: (movement: Omit<StockMovement, 'id' | 'timestamp'>) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onStockChange,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedProduct, setDetectedProduct] = useState<Product | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [quickQty, setQuickQty] = useState<number>(1);
  const [actionSuccessText, setActionSuccessText] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start camera when modal opens
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setDetectedProduct(null);
      setScanMessage(null);
      setActionSuccessText(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Tu navegador no soporta acceso directo a la cámara. Usa el modo simulador o sube una imagen.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setCameraActive(true);
        requestAnimationFrame(scanVideoFrame);
      }
    } catch (err: unknown) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Permiso de cámara no concedido o cámara no disponible. Puedes usar los botones de prueba instantánea.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Continuous frame analysis with jsQR
  const scanVideoFrame = () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleQrPayloadDetected(code.data);
        return; // Pause scanning while product is active
      }
    }

    animationFrameRef.current = requestAnimationFrame(scanVideoFrame);
  };

  // Process detected payload
  const handleQrPayloadDetected = (payload: string) => {
    playScannerBeep('success');
    const parsed = parseQrPayload(payload);

    // Search product by sku, barcode, or exact payload
    const found = products.find(
      (p) =>
        p.qrPayload === payload ||
        (parsed.sku && p.sku.toLowerCase() === parsed.sku.toLowerCase()) ||
        (parsed.barcode && p.barcode === parsed.barcode) ||
        p.sku.toLowerCase() === payload.toLowerCase() ||
        p.barcode === payload
    );

    if (found) {
      setDetectedProduct(found);
      setScanMessage(`Código detectado: ${found.sku} - ${found.name}`);
      setActionSuccessText(null);
    } else {
      playScannerBeep('warning');
      setScanMessage(`Código QR escaneado no coincide con el catálogo: "${payload.slice(0, 40)}"`);
    }
  };

  // Handle uploaded image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleQrPayloadDetected(code.data);
          } else {
            playScannerBeep('error');
            setScanMessage('No se detectó un código QR legible en la imagen.');
          }
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Handle instant test scan
  const handleSimulateScan = (product: Product) => {
    handleQrPayloadDetected(product.qrPayload);
  };

  // Fast stock adjustments
  const handleQuickAdjust = (type: 'ENTRADA' | 'SALIDA') => {
    if (!detectedProduct) return;

    const qty = quickQty;
    const delta = type === 'ENTRADA' ? qty : -qty;
    const previousStock = detectedProduct.stock;
    const newStock = Math.max(0, previousStock + delta);

    onStockChange({
      productId: detectedProduct.id,
      productName: detectedProduct.name,
      productSku: detectedProduct.sku,
      type,
      quantity: delta,
      previousStock,
      newStock,
      reason: type === 'ENTRADA' ? `Recepción rápida por escáner QR (+${qty})` : `Despacho rápido por escáner QR (-${qty})`,
      performedBy: 'Operador de Bodega (Lector QR)',
      device: 'PANEL_WEB',
      referenceDoc: `QR-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    playScannerBeep('success');
    setActionSuccessText(`¡Stock actualizado con éxito! Nuevo saldo: ${newStock} ${detectedProduct.unit}`);
    
    // Update local product view
    setDetectedProduct({
      ...detectedProduct,
      stock: newStock,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-neutral-200 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-neutral-950 font-bold">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-neutral-900">
                Terminal de Escaneo de Códigos QR & Barras
              </h3>
              <p className="text-xs text-neutral-500">
                Lector óptico con cámara en vivo o simulación instantánea
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Viewport & Camera Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Lado Izquierdo: Visor de Cámara */}
          <div className="relative bg-neutral-950 rounded-xl overflow-hidden aspect-4/3 flex flex-col items-center justify-center border border-neutral-800">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Retícula de mira láser */}
            {cameraActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-amber-400/80 rounded-xl relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-amber-400" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-amber-400" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-amber-400" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-amber-400" />
                  
                  {/* Línea roja escáner animada */}
                  <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse absolute top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {/* Mensaje de cámara inactiva o error */}
            {!cameraActive && (
              <div className="p-4 text-center space-y-2 text-white">
                <Camera className="w-10 h-10 mx-auto text-neutral-500" />
                <p className="text-xs text-neutral-300 font-medium max-w-xs">
                  {cameraError || 'Iniciando cámara del dispositivo...'}
                </p>
                <button
                  onClick={startCamera}
                  className="px-3 py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 rounded-md text-amber-400 border border-neutral-700"
                >
                  Reintentar Cámara
                </button>
              </div>
            )}

            {/* Subir foto como alternativa */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/60 backdrop-blur-xs px-2.5 py-1.5 rounded-lg text-white text-[11px]">
              <span className="text-neutral-300">¿Tienes una foto de etiqueta?</span>
              <label className="cursor-pointer font-semibold text-amber-400 hover:underline flex items-center gap-1">
                <Upload className="w-3 h-3" />
                Subir Imagen
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Lado Derecho: Simulación Rápida de Pruebas (Instant Test) */}
          <div className="space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-900 pb-1">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Simulador de Escaneo de Mercancía</span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Haz clic en cualquier artículo para simular la lectura láser instantánea de su etiqueta QR:
              </p>

              <div className="mt-2 space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {products.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSimulateScan(p)}
                    className="w-full text-left p-2 rounded-lg bg-neutral-50 hover:bg-amber-50/50 border border-neutral-200/80 transition-colors flex items-center justify-between text-xs cursor-pointer group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-mono font-bold text-neutral-900 group-hover:text-amber-800">
                        {p.sku}
                      </div>
                      <div className="text-[11px] text-neutral-600 truncate">
                        {p.name}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-neutral-800">
                        {p.stock} {p.unit}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {p.location.hall}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {scanMessage && (
              <div className="p-2 bg-neutral-100 rounded-lg text-xs font-mono text-neutral-800 border border-neutral-200">
                {scanMessage}
              </div>
            )}
          </div>

        </div>

        {/* DETECTED PRODUCT CARD */}
        {detectedProduct && (
          <div className="p-4 bg-amber-500/10 border-2 border-amber-500/40 rounded-xl space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-amber-400 text-neutral-950 px-2 py-0.5 rounded">
                    {detectedProduct.sku}
                  </span>
                  <span className="text-xs font-mono text-neutral-600">
                    EAN: {detectedProduct.barcode}
                  </span>
                </div>
                <h4 className="font-bold text-sm text-neutral-900 mt-1">
                  {detectedProduct.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-neutral-600 mt-0.5">
                  <span className="flex items-center gap-1 font-mono">
                    <MapPin className="w-3 h-3 text-neutral-500" />
                    Pasillo {detectedProduct.location.hall} · Estante {detectedProduct.location.shelf} · Gaveta {detectedProduct.location.bin}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>PVP: ${detectedProduct.salePrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-right sm:border-l sm:pl-4 border-amber-200">
                <span className="text-xs text-neutral-500">Stock Actual en Bodega</span>
                <div className="text-xl font-bold font-mono text-neutral-900 tabular-nums">
                  {detectedProduct.stock} {detectedProduct.unit}
                </div>
                <span className="text-[11px] text-neutral-500 font-mono">
                  Mínimo: {detectedProduct.minStock} {detectedProduct.unit}
                </span>
              </div>
            </div>

            {/* Success feedback */}
            {actionSuccessText && (
              <div className="p-2 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{actionSuccessText}</span>
              </div>
            )}

            {/* Quick stock adjustment controls */}
            <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-800">Cantidad:</span>
                <div className="flex items-center bg-white border border-neutral-300 rounded-lg">
                  <button
                    onClick={() => setQuickQty(Math.max(1, quickQty - 1))}
                    className="px-2 py-1 text-neutral-600 hover:text-neutral-900"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quickQty}
                    onChange={(e) => setQuickQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-14 text-center text-xs font-bold font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => setQuickQty(quickQty + 1)}
                    className="px-2 py-1 text-neutral-600 hover:text-neutral-900"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs text-neutral-500">{detectedProduct.unit}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickAdjust('ENTRADA')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Recepción (Entrada)</span>
                </button>
                <button
                  onClick={() => handleQuickAdjust('SALIDA')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-600 rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>- Despacho (Salida)</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs text-neutral-500">
          <div>
            Lecturas sincronizadas con base de datos MySQL en tiempo real
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            Cerrar Escáner
          </button>
        </div>

      </div>
    </div>
  );
};
