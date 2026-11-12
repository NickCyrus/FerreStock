import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  CheckSquare, 
  Square, 
  Layers, 
  ArrowLeft, 
  Download,
  QrCode,
  Tag
} from 'lucide-react';
import { Product, Category } from '../types/inventory';
import { generateQrDataUrl } from '../utils/qr';

interface LabelPrintingViewProps {
  products: Product[];
  categories: Category[];
  initialSelectedIds?: string[];
  onBackToInventory: () => void;
}

export const LabelPrintingView: React.FC<LabelPrintingViewProps> = ({
  products,
  categories,
  initialSelectedIds,
  onBackToInventory,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialSelectedIds && initialSelectedIds.length > 0
      ? initialSelectedIds
      : products.slice(0, 8).map((p) => p.id)
  );

  const [qrCache, setQrCache] = useState<Record<string, string>>({});
  const [loadingQr, setLoadingQr] = useState<boolean>(true);

  // Generate QR for all products
  useEffect(() => {
    let isMounted = true;
    const generateAllQrs = async () => {
      setLoadingQr(true);
      const cache: Record<string, string> = {};
      for (const prod of products) {
        const url = await generateQrDataUrl(prod.qrPayload, 160);
        cache[prod.id] = url;
      }
      if (isMounted) {
        setQrCache(cache);
        setLoadingQr(false);
      }
    };

    generateAllQrs();
    return () => {
      isMounted = false;
    };
  }, [products]);

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedProducts = products.filter((p) => selectedIds.includes(p.id));

  return (
    <div className="space-y-6">
      
      {/* Top Header Controls (Hidden during print) */}
      <div className="print:hidden bg-white border border-neutral-200 rounded-xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToInventory}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Impresión de Etiquetas QR para Anaqueles & Gavetas
              </h2>
              <p className="text-xs text-neutral-500">
                Selecciona los artículos para generar la plantilla adhesiva para estanterías
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              {selectedIds.length === products.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
            </button>

            <button
              disabled={selectedProducts.length === 0}
              onClick={handlePrint}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer ${
                selectedProducts.length > 0
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-amber-400'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir {selectedProducts.length} Etiquetas</span>
            </button>
          </div>
        </div>

        {/* Selection chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-neutral-100 text-xs">
          <span className="text-neutral-500 font-semibold mr-1">Selección rápida:</span>
          {products.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleSelectProduct(p.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-amber-400 text-neutral-950 font-bold'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {p.sku}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid de Etiquetas Imprimibles */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
        
        {loadingQr ? (
          <div className="py-16 text-center text-neutral-400 text-sm">
            Generando códigos QR de alta resolución para impresión...
          </div>
        ) : selectedProducts.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 text-sm">
            No has seleccionado ningún producto. Marca los artículos en la barra superior.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3 print:gap-3">
            {selectedProducts.map((prod) => {
              const qrUrl = qrCache[prod.id];
              return (
                <div
                  key={prod.id}
                  className="border-2 border-neutral-800 rounded-lg p-3 bg-white text-neutral-900 flex flex-col justify-between space-y-2 relative overflow-hidden shadow-xs print:shadow-none print:border-black"
                >
                  {/* Header etiqueta */}
                  <div className="flex items-center justify-between border-b border-neutral-300 pb-1.5 text-[10px] font-mono">
                    <span className="font-extrabold uppercase tracking-wider text-neutral-900">
                      FERRETERÍA CENTRAL
                    </span>
                    <span className="font-bold bg-neutral-900 text-white px-1.5 py-0.2 rounded print:bg-black">
                      {prod.location.hall}
                    </span>
                  </div>

                  {/* QR y Detalles */}
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 shrink-0 bg-white p-1 border border-neutral-200 rounded">
                      {qrUrl ? (
                        <img src={qrUrl} alt={prod.sku} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full bg-neutral-100 animate-pulse" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="font-mono font-black text-xs text-neutral-950 truncate">
                        {prod.sku}
                      </div>
                      <div className="font-bold text-[11px] leading-tight line-clamp-2 text-neutral-900">
                        {prod.name}
                      </div>
                      <div className="text-[10px] text-neutral-600 font-medium">
                        {prod.brand}
                      </div>
                      <div className="font-mono text-[9px] text-neutral-500">
                        {prod.barcode}
                      </div>
                    </div>
                  </div>

                  {/* Ubicación y PVP */}
                  <div className="pt-1.5 border-t border-neutral-300 flex items-end justify-between">
                    <div className="text-[9px] font-mono text-neutral-600 leading-tight">
                      <div>Est: <strong>{prod.location.shelf}</strong> · Gav: <strong>{prod.location.bin}</strong></div>
                      <div>Stock mín: {prod.minStock} {prod.unit}</div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-neutral-500 font-mono block text-[9px]">PVP CON IVA</span>
                      <span className="text-sm font-black font-mono text-neutral-950">
                        ${prod.salePrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
