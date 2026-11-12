import React, { useState } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  Download, 
  ArrowDownLeft, 
  ArrowUpRight, 
  SlidersHorizontal,
  Smartphone,
  Laptop,
  ShoppingCart,
  FileText
} from 'lucide-react';
import { StockMovement, MovementType } from '../types/inventory';

interface StockMovementsViewProps {
  movements: StockMovement[];
}

export const StockMovementsView: React.FC<StockMovementsViewProps> = ({ movements }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDevice, setFilterDevice] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredMovements = movements.filter((m) => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (filterDevice !== 'all' && m.device !== filterDevice) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        m.productSku.toLowerCase().includes(q) ||
        m.productName.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q) ||
        (m.referenceDoc && m.referenceDoc.toLowerCase().includes(q)) ||
        m.performedBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportCsv = () => {
    const headers = ['Fecha_Hora', 'SKU', 'Producto', 'Tipo', 'Cantidad', 'Stock_Anterior', 'Stock_Nuevo', 'Dispositivo', 'Operador', 'Motivo', 'Documento'];
    const rows = filteredMovements.map((m) => [
      `"${new Date(m.timestamp).toLocaleString()}"`,
      m.productSku,
      `"${m.productName.replace(/"/g, '""')}"`,
      m.type,
      m.quantity,
      m.previousStock,
      m.newStock,
      m.device,
      `"${m.performedBy}"`,
      `"${m.reason.replace(/"/g, '""')}"`,
      m.referenceDoc || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kardex_movimientos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      
      {/* Header and filters */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              Kardex de Movimientos & Trazabilidad de Stock
            </h2>
            <p className="text-xs text-neutral-500">
              Bitácora inmutable de entradas, salidas y ajustes sincronizados en tiempo real
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer self-start md:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Kardex CSV</span>
          </button>
        </div>

        {/* Search & Selectors */}
        <div className="pt-2 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por SKU, producto, doc o usuario..."
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none"
            />
          </div>

          {/* Tipo de movimiento */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
            <button
              onClick={() => setFilterType('all')}
              className={`flex-1 py-1 text-xs font-medium rounded text-center transition-colors ${
                filterType === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('ENTRADA')}
              className={`flex-1 py-1 text-xs font-medium rounded text-center transition-colors ${
                filterType === 'ENTRADA' ? 'bg-white text-emerald-700 font-bold shadow-xs' : 'text-neutral-600'
              }`}
            >
              Entradas
            </button>
            <button
              onClick={() => setFilterType('SALIDA')}
              className={`flex-1 py-1 text-xs font-medium rounded text-center transition-colors ${
                filterType === 'SALIDA' ? 'bg-white text-rose-700 font-bold shadow-xs' : 'text-neutral-600'
              }`}
            >
              Salidas
            </button>
            <button
              onClick={() => setFilterType('AJUSTE')}
              className={`flex-1 py-1 text-xs font-medium rounded text-center transition-colors ${
                filterType === 'AJUSTE' ? 'bg-white text-amber-700 font-bold shadow-xs' : 'text-neutral-600'
              }`}
            >
              Ajustes
            </button>
          </div>

          {/* Origen del dispositivo */}
          <select
            value={filterDevice}
            onChange={(e) => setFilterDevice(e.target.value)}
            className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none"
          >
            <option value="all">Todos los dispositivos</option>
            <option value="APP_ANDROID_QR">📱 App Android (Lector QR)</option>
            <option value="POS_MOSTRADOR">🛒 Mostrador / POS</option>
            <option value="PANEL_WEB">💻 Panel Web Administrativo</option>
          </select>

        </div>
      </div>

      {/* Tabla Kardex */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase font-mono tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">SKU / Producto</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 text-center">Cantidad</th>
                <th className="py-3 px-4 text-center">Stock (Previo → Nuevo)</th>
                <th className="py-3 px-4">Canal / Dispositivo</th>
                <th className="py-3 px-4">Motivo & Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-neutral-500">
                    No se encontraron registros de movimiento con estos filtros.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isEntry = mov.type === 'ENTRADA';
                  const isExit = mov.type === 'SALIDA';

                  return (
                    <tr key={mov.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-neutral-500 text-[11px]">
                        {new Date(mov.timestamp).toLocaleString('es-MX', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-mono font-bold text-neutral-900">{mov.productSku}</div>
                        <div className="text-[11px] text-neutral-600 truncate">{mov.productName}</div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                          isEntry
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isExit
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {isEntry ? <ArrowDownLeft className="w-3 h-3" /> : isExit ? <ArrowUpRight className="w-3 h-3" /> : null}
                          {mov.type}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-center font-mono font-bold text-sm tabular-nums">
                        <span className={isEntry ? 'text-emerald-700' : isExit ? 'text-rose-700' : 'text-neutral-900'}>
                          {isEntry ? `+${mov.quantity}` : mov.quantity}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap text-center font-mono text-xs tabular-nums text-neutral-500">
                        {mov.previousStock} → <strong className="text-neutral-900 font-bold">{mov.newStock}</strong>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-700 font-medium">
                          {mov.device === 'APP_ANDROID_QR' ? (
                            <span className="flex items-center gap-1 text-emerald-700">
                              <Smartphone className="w-3.5 h-3.5" /> App Android
                            </span>
                          ) : mov.device === 'POS_MOSTRADOR' ? (
                            <span className="flex items-center gap-1 text-amber-700">
                              <ShoppingCart className="w-3.5 h-3.5" /> Mostrador
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-neutral-600">
                              <Laptop className="w-3.5 h-3.5" /> Panel Web
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400">
                          {mov.performedBy}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-neutral-900 text-xs font-medium truncate" title={mov.reason}>
                          {mov.reason}
                        </div>
                        {mov.referenceDoc && (
                          <div className="text-[10px] font-mono text-neutral-500">
                            Doc: {mov.referenceDoc}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
