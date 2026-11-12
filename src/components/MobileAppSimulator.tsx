import React, { useState } from 'react';
import { 
  Smartphone, 
  QrCode, 
  Boxes, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  Battery, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Minus, 
  MapPin, 
  Search,
  ArrowUpRight,
  Send,
  Zap
} from 'lucide-react';
import { Product, StockMovement } from '../types/inventory';
import { playScannerBeep } from '../utils/audio';

interface MobileAppSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onStockChange: (movement: Omit<StockMovement, 'id' | 'timestamp'>) => void;
  onEmitSyncEvent: (msg: string) => void;
}

interface OfflineQueueItem {
  id: string;
  productSku: string;
  productName: string;
  quantity: number;
  type: 'ENTRADA' | 'SALIDA';
  timestamp: string;
}

export const MobileAppSimulator: React.FC<MobileAppSimulatorProps> = ({
  isOpen,
  onClose,
  products,
  onStockChange,
  onEmitSyncEvent,
}) => {
  const [mobileTab, setMobileTab] = useState<'scan' | 'inventory' | 'sync'>('scan');
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);
  
  // Mobile scan state
  const [selectedMobileProduct, setSelectedMobileProduct] = useState<Product | null>(products[0] || null);
  const [mobileQty, setMobileQty] = useState<number>(1);
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  // Mobile inventory search
  const [mobileSearch, setMobileSearch] = useState<string>('');

  if (!isOpen) return null;

  // Handle quick mobile scan
  const handleSelectToScan = (product: Product) => {
    playScannerBeep('success');
    setSelectedMobileProduct(product);
    setFeedbackText(`QR Escaneado: ${product.sku}`);
  };

  // Perform stock action inside mobile app
  const handlePerformMobileAction = (type: 'ENTRADA' | 'SALIDA') => {
    if (!selectedMobileProduct) return;

    const delta = type === 'ENTRADA' ? mobileQty : -mobileQty;
    const previousStock = selectedMobileProduct.stock;
    const newStock = Math.max(0, previousStock + delta);

    if (isOffline) {
      // Add to offline queue
      const queueItem: OfflineQueueItem = {
        id: `offline-${Date.now()}`,
        productSku: selectedMobileProduct.sku,
        productName: selectedMobileProduct.name,
        quantity: delta,
        type,
        timestamp: new Date().toLocaleTimeString(),
      };
      setOfflineQueue((prev) => [queueItem, ...prev]);
      playScannerBeep('warning');
      setFeedbackText(`Guardado en cola OFFLINE (${offlineQueue.length + 1} pendientes)`);
      return;
    }

    // Online execution -> immediate real-time sync with Web Panel & MySQL
    onStockChange({
      productId: selectedMobileProduct.id,
      productName: selectedMobileProduct.name,
      productSku: selectedMobileProduct.sku,
      type,
      quantity: delta,
      previousStock,
      newStock,
      reason: `Despacho móvil bodeguero Terminal Android (${type === 'ENTRADA' ? '+' : ''}${delta})`,
      performedBy: 'Bodeguero Juan (Android React Native)',
      device: 'APP_ANDROID_QR',
      referenceDoc: `APP-AND-${Math.floor(100 + Math.random() * 900)}`,
    });

    playScannerBeep('success');
    setFeedbackText(`Sincronizado con MySQL: ${selectedMobileProduct.sku} (${newStock} saldo)`);
    onEmitSyncEvent(`App Android: Despacho de ${mobileQty}x ${selectedMobileProduct.sku}`);

    setSelectedMobileProduct({
      ...selectedMobileProduct,
      stock: newStock,
    });
  };

  // Force sync offline queue
  const handleSyncOfflineQueue = () => {
    if (offlineQueue.length === 0) return;

    offlineQueue.forEach((item) => {
      const prod = products.find((p) => p.sku === item.productSku);
      if (prod) {
        const previousStock = prod.stock;
        const newStock = Math.max(0, previousStock + item.quantity);
        onStockChange({
          productId: prod.id,
          productName: prod.name,
          productSku: prod.sku,
          type: item.type,
          quantity: item.quantity,
          previousStock,
          newStock,
          reason: `Sincronización de cola offline acumulada`,
          performedBy: 'Bodeguero Juan (Android Offline Sync)',
          device: 'APP_ANDROID_QR',
          referenceDoc: `OFFLINE-SYNC-${Math.floor(100 + Math.random() * 900)}`,
        });
      }
    });

    setOfflineQueue([]);
    playScannerBeep('success');
    setFeedbackText('¡Todas las operaciones pendientes fueron sincronizadas con el servidor!');
    onEmitSyncEvent(`Sincronización completada: Cola offline enviada al servidor.`);
  };

  const filteredMobileProducts = products.filter((p) =>
    p.name.toLowerCase().includes(mobileSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(mobileSearch.toLowerCase()) ||
    p.location.hall.toLowerCase().includes(mobileSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:max-w-md bg-neutral-950/90 backdrop-blur-md shadow-2xl flex flex-col p-3 sm:p-4 border-l border-neutral-800 animate-in slide-in-from-right duration-200">
      
      {/* Top bar simulator controls */}
      <div className="flex items-center justify-between text-neutral-300 pb-2 mb-2 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">
            Simulador Terminal Android (React Native)
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:text-white rounded-md hover:bg-neutral-800 transition-colors"
          title="Cerrar simulador"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Frame del teléfono Android */}
      <div className="flex-1 bg-neutral-900 rounded-3xl border-4 border-neutral-700 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Status Bar del Teléfono Android */}
        <div className="bg-neutral-950 px-4 py-1.5 flex items-center justify-between text-neutral-400 text-[10px] font-mono shrink-0 select-none">
          <span>09:41</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOffline(!isOffline)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                isOffline ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}
              title="Alternar modo offline para simular pérdida de red"
            >
              {isOffline ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
              <span>{isOffline ? 'OFFLINE' : '4G LTE'}</span>
            </button>
            <div className="flex items-center gap-1">
              <span>98%</span>
              <Battery className="w-3 h-3 text-neutral-300" />
            </div>
          </div>
        </div>

        {/* Header de la App React Native */}
        <div className="bg-neutral-850 px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-amber-500 flex items-center justify-center font-bold text-neutral-950 text-xs">
              F
            </div>
            <div>
              <h4 className="text-xs font-bold text-white leading-tight">FerreStock Móvil</h4>
              <p className="text-[10px] text-neutral-400">Terminal Bodega · Juan P.</p>
            </div>
          </div>

          {offlineQueue.length > 0 && (
            <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono px-2 py-0.5 rounded-full border border-amber-500/40">
              {offlineQueue.length} pend.
            </span>
          )}
        </div>

        {/* Feedback Banner */}
        {feedbackText && (
          <div className="bg-neutral-800 px-3 py-1.5 text-[11px] text-amber-300 border-b border-neutral-700 flex items-center justify-between">
            <span className="truncate">{feedbackText}</span>
            <button onClick={() => setFeedbackText(null)} className="text-neutral-400 hover:text-white ml-2">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Contenido según pestaña móvil */}
        <div className="flex-1 overflow-y-auto p-3 text-white space-y-3">
          
          {/* TAB 1: ESCANEAR QR Y DESPACHAR */}
          {mobileTab === 'scan' && (
            <div className="space-y-3">
              
              {/* Visor simulado de cámara para escanear en bodega */}
              <div className="bg-neutral-950 rounded-xl p-3 border border-neutral-800 text-center relative overflow-hidden">
                <div className="w-36 h-36 mx-auto border-2 border-dashed border-amber-400/70 rounded-lg flex flex-col items-center justify-center relative bg-neutral-900/60">
                  <QrCode className="w-10 h-10 text-amber-400/80 mb-1" />
                  <span className="text-[10px] text-neutral-400 font-mono">Apuntar a Etiqueta QR</span>
                  {/* Láser simulado */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-rose-500/80 shadow-[0_0_8px_#f43f5e] animate-pulse" />
                </div>

                <div className="mt-2 text-[11px] text-neutral-400">
                  Toca cualquier producto abajo para simular lectura:
                </div>

                {/* Lista rápida para simular lectura */}
                <div className="mt-2 grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto text-left">
                  {products.slice(0, 8).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectToScan(p)}
                      className={`p-1.5 rounded text-[10px] font-mono border transition-colors truncate ${
                        selectedMobileProduct?.id === p.id
                          ? 'bg-amber-400 text-neutral-950 border-amber-300 font-bold'
                          : 'bg-neutral-850 text-neutral-300 border-neutral-700 hover:bg-neutral-800'
                      }`}
                    >
                      {p.sku} ({p.stock})
                    </button>
                  ))}
                </div>
              </div>

              {/* Ficha del producto escaneado */}
              {selectedMobileProduct && (
                <div className="bg-neutral-850 border border-neutral-700 rounded-xl p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono bg-neutral-800 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                        {selectedMobileProduct.sku}
                      </span>
                      <h5 className="text-xs font-bold text-white mt-1 leading-snug">
                        {selectedMobileProduct.name}
                      </h5>
                      <p className="text-[10px] text-neutral-400">
                        {selectedMobileProduct.brand}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                        {selectedMobileProduct.stock} {selectedMobileProduct.unit}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        en almacén
                      </div>
                    </div>
                  </div>

                  {/* Ubicación en bodega */}
                  <div className="p-1.5 bg-neutral-900 rounded text-[11px] font-mono text-neutral-300 flex items-center justify-between border border-neutral-800">
                    <span className="flex items-center gap-1 text-neutral-400">
                      <MapPin className="w-3 h-3 text-amber-400" />
                      Ubicación:
                    </span>
                    <span className="font-bold text-white">
                      Pasillo {selectedMobileProduct.location.hall} · Estante {selectedMobileProduct.location.shelf} · Gaveta {selectedMobileProduct.location.bin}
                    </span>
                  </div>

                  {/* Acciones de Despacho / Entrada */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <div className="flex items-center bg-neutral-900 rounded-lg border border-neutral-700 px-1">
                      <button
                        onClick={() => setMobileQty(Math.max(1, mobileQty - 1))}
                        className="p-1 text-neutral-400 hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 font-mono font-bold text-xs">
                        {mobileQty}
                      </span>
                      <button
                        onClick={() => setMobileQty(mobileQty + 1)}
                        className="p-1 text-neutral-400 hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-1">
                      <button
                        onClick={() => handlePerformMobileAction('SALIDA')}
                        className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        - Despachar
                      </button>
                      <button
                        onClick={() => handlePerformMobileAction('ENTRADA')}
                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        + Ingresar
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: INVENTARIO EN BODEGA */}
          {mobileTab === 'inventory' && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar SKU o ubicación..."
                  value={mobileSearch}
                  onChange={(e) => setMobileSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-neutral-850 border border-neutral-700 rounded-lg text-xs text-white placeholder:text-neutral-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredMobileProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedMobileProduct(p);
                      setMobileTab('scan');
                      playScannerBeep('success');
                    }}
                    className="p-2.5 bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-amber-400">{p.sku}</span>
                      <span className="font-mono font-bold text-white tabular-nums">{p.stock} {p.unit}</span>
                    </div>
                    <div className="text-[11px] text-neutral-300 font-medium truncate mt-0.5">
                      {p.name}
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono mt-1 flex items-center justify-between">
                      <span>Ubicación: {p.location.hall} / {p.location.shelf}</span>
                      <span>${p.salePrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COLA DE SINCRONIZACIÓN OFFLINE */}
          {mobileTab === 'sync' && (
            <div className="space-y-3">
              <div className="p-3 bg-neutral-850 rounded-xl border border-neutral-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Estado de Red Móvil</span>
                  <span className={`flex items-center gap-1 font-mono text-[11px] ${isOffline ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {isOffline ? <WifiOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
                    {isOffline ? 'Sin Conexión (Offline)' : 'En Línea (Conectado)'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  La app almacena en SQLite/AsyncStorage cualquier despacho realizado sin señal celular y lo sincroniza automáticamente con Laravel + MySQL al restablecer la conexión.
                </p>
                <button
                  onClick={() => setIsOffline(!isOffline)}
                  className="w-full py-1.5 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg border border-neutral-600 transition-colors"
                >
                  {isOffline ? 'Simular Conexión Restablecida' : 'Simular Pérdida de Señal (Modo Offline)'}
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-300">
                  <span>Cola de Operaciones Pendientes ({offlineQueue.length})</span>
                  {offlineQueue.length > 0 && !isOffline && (
                    <button
                      onClick={handleSyncOfflineQueue}
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Sincronizar Ahora
                    </button>
                  )}
                </div>

                {offlineQueue.length === 0 ? (
                  <div className="p-6 text-center text-neutral-500 text-xs bg-neutral-850 rounded-xl border border-neutral-800">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                    No hay despachos pendientes. La terminal está 100% sincronizada con el panel central.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {offlineQueue.map((item) => (
                      <div key={item.id} className="p-2 bg-neutral-850 border border-neutral-700 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <div className="font-mono font-bold text-neutral-200">{item.productSku}</div>
                          <div className="text-[10px] text-neutral-400">{item.timestamp}</div>
                        </div>
                        <span className={`font-mono font-bold ${item.type === 'ENTRADA' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {item.quantity > 0 ? `+${item.quantity}` : item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Navigation Bar del Teléfono Android */}
        <div className="bg-neutral-950 border-t border-neutral-800 grid grid-cols-3 py-1 shrink-0 text-center select-none">
          <button
            onClick={() => setMobileTab('scan')}
            className={`py-1.5 flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
              mobileTab === 'scan' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Lector QR</span>
          </button>

          <button
            onClick={() => setMobileTab('inventory')}
            className={`py-1.5 flex flex-col items-center gap-1 text-[10px] font-medium transition-colors ${
              mobileTab === 'inventory' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Bodega</span>
          </button>

          <button
            onClick={() => setMobileTab('sync')}
            className={`py-1.5 flex flex-col items-center gap-1 text-[10px] font-medium relative transition-colors ${
              mobileTab === 'sync' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sincronizar</span>
            {offlineQueue.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 right-8" />
            )}
          </button>
        </div>

      </div>

    </div>
  );
};
