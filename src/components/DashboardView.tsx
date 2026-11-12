import React from 'react';
import { 
  DollarSign, 
  AlertTriangle, 
  Boxes, 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  Smartphone, 
  RefreshCw, 
  QrCode, 
  ShieldCheck,
  ChevronRight,
  Layers,
  MapPin
} from 'lucide-react';
import { Product, StockMovement, Category } from '../types/inventory';

interface DashboardViewProps {
  products: Product[];
  movements: StockMovement[];
  categories: Category[];
  onOpenQuickSale: () => void;
  onOpenScanner: () => void;
  onSelectProduct: (product: Product) => void;
  onQuickReplenish: (product: Product) => void;
  onOpenMobileSim: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  movements,
  categories,
  onOpenQuickSale,
  onOpenScanner,
  onSelectProduct,
  onQuickReplenish,
  onOpenMobileSim,
}) => {
  // Calculos de inventario
  const totalStockItems = products.reduce((acc, p) => acc + p.stock, 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + p.stock * p.purchasePrice, 0);
  const totalPotentialSales = products.reduce((acc, p) => acc + p.stock * p.salePrice, 0);
  const potentialProfitMargin = totalInventoryValue > 0 
    ? ((totalPotentialSales - totalInventoryValue) / totalPotentialSales) * 100 
    : 0;

  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);
  const criticalStockProducts = products.filter((p) => p.stock <= Math.ceil(p.minStock / 2));

  const todayMovements = movements.filter((m) => {
    const today = new Date().toDateString();
    return new Date(m.timestamp).toDateString() === today;
  });

  const totalTodayEntries = todayMovements
    .filter((m) => m.type === 'ENTRADA')
    .reduce((acc, m) => acc + m.quantity, 0);

  const totalTodayExits = todayMovements
    .filter((m) => m.type === 'SALIDA')
    .reduce((acc, m) => acc + m.quantity, 0);

  return (
    <div className="space-y-6">
      
      {/* Banner de Sincronización en Tiempo Real Ferretería */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-850 to-neutral-900 border border-neutral-800 rounded-xl p-5 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-xs uppercase font-mono tracking-wider text-emerald-400 font-semibold">
              Ecosistema Ferretero Sincronizado
            </span>
            <span className="text-xs text-neutral-500">·</span>
            <span className="text-xs text-neutral-400">Laravel 11 REST API + MySQL + Android React Native</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Control de Bodega, Mostrador y Lector de Códigos QR
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl">
            Sincronización bidireccional instantánea: cualquier despacho escaneado con la app móvil descuenta el stock en el panel web de inmediato, garantizando inventario real sin desfases.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
          <button
            onClick={onOpenScanner}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            Escanear Mercancía
          </button>
          <button
            onClick={onOpenMobileSim}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            Ver App Bodeguero
          </button>
        </div>
      </div>

      {/* KPI Stat Cards (4 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Valor Inventario */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Valor Total en Bodega (Costo)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
              ${totalInventoryValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
            <span>PVP Estimado: ${totalPotentialSales.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 font-medium">+{potentialProfitMargin.toFixed(1)}% margen</span>
          </div>
        </div>

        {/* KPI 2: Unidades en Stock */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Productos Registrados</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
              {products.length}
            </span>
            <span className="text-xs text-neutral-500">artículos ({totalStockItems} unidades físicas)</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
            <span>8 categorías de ferretería</span>
            <span aria-hidden="true">·</span>
            <span className="text-neutral-700 font-medium">100% con QR generado</span>
          </div>
        </div>

        {/* KPI 3: Alertas de Stock Bajo */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Alertas Stock Mínimo</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              lowStockProducts.length > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums ${
              lowStockProducts.length > 0 ? 'text-amber-700' : 'text-neutral-900'
            }`}>
              {lowStockProducts.length}
            </span>
            <span className="text-xs text-neutral-500">
              {criticalStockProducts.length > 0 ? `(${criticalStockProducts.length} en nivel crítico)` : 'todos bajo control'}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
            <span>Reposición urgente requerida</span>
          </div>
        </div>

        {/* KPI 4: Movimientos Hoy */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Flujo de Hoy (Entradas/Salidas)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900 font-mono tabular-nums">
              {todayMovements.length}
            </span>
            <span className="text-xs text-neutral-500">movimientos auditados</span>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="text-emerald-700 font-mono tabular-nums flex items-center">
              <ArrowDownLeft className="w-3 h-3 mr-0.5" /> +{totalTodayEntries} ent.
            </span>
            <span aria-hidden="true" className="text-neutral-300">·</span>
            <span className="text-rose-700 font-mono tabular-nums flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> -{totalTodayExits} sal.
            </span>
          </div>
        </div>

      </div>

      {/* Grid Principal: Alertas de Reabastecimiento + Actividad en Tiempo Real */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda (2 cols): Productos por Agotarse con acción rápida */}
        <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Alertas de Stock Bajo & Reposición Urgente
              </h3>
              <p className="text-xs text-neutral-500">
                Productos que han alcanzado o perforado su umbral de inventario mínimo en anaqueles.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md font-semibold border border-amber-200">
              {lowStockProducts.length} productos críticos
            </span>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-8 text-center text-neutral-500 text-sm">
              <ShieldCheck className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
              Todo el inventario se encuentra por encima del stock mínimo establecido.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100 overflow-x-auto">
              {lowStockProducts.map((product) => {
                const stockPercent = Math.min(100, Math.round((product.stock / product.minStock) * 100));
                const isCritical = product.stock <= Math.ceil(product.minStock / 2);

                return (
                  <div key={product.id} className="py-3.5 flex items-center justify-between gap-4 hover:bg-neutral-50/60 rounded-lg px-2 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded">
                          {product.sku}
                        </span>
                        <span className="text-xs font-semibold text-neutral-800 truncate">
                          {product.name}
                        </span>
                        <span className="text-[11px] text-neutral-500 hidden sm:inline">
                          ({product.brand})
                        </span>
                      </div>

                      <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <MapPin className="w-3 h-3 text-neutral-400" />
                          {product.location.hall} / {product.location.shelf} / {product.location.bin}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Costo: ${product.purchasePrice.toFixed(2)}</span>
                        <span aria-hidden="true">·</span>
                        <span>PVP: ${product.salePrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Stock gauge & numbers */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className={`text-sm font-bold font-mono tabular-nums ${
                            isCritical ? 'text-rose-600' : 'text-amber-600'
                          }`}>
                            {product.stock} {product.unit}
                          </span>
                          <span className="text-xs text-neutral-400 font-mono">
                            / mín {product.minStock}
                          </span>
                        </div>
                        {/* Barra de progreso */}
                        <div className="w-24 bg-neutral-200 h-1.5 rounded-full overflow-hidden mt-1">
                          <div 
                            className={`h-full ${isCritical ? 'bg-rose-500' : 'bg-amber-500'}`} 
                            style={{ width: `${stockPercent}%` }}
                          />
                        </div>
                      </div>

                      {/* Botón Reabastecer */}
                      <button
                        onClick={() => onQuickReplenish(product)}
                        className="px-3 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-white rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1"
                        title="Registrar entrada de mercancía"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reabastecer</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Columna Derecha (1 col): Auditoría y Movimientos Recientes */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Movimientos en Vivo (Kardex)
              </h3>
              <p className="text-xs text-neutral-500">
                Auditoría en tiempo real desde Web y App Android
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {movements.slice(0, 5).map((mov) => {
              const isEntry = mov.type === 'ENTRADA';
              const isExit = mov.type === 'SALIDA';

              return (
                <div key={mov.id} className="p-3 bg-neutral-50/80 border border-neutral-100 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-neutral-700">
                      {mov.productSku}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {new Date(mov.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-neutral-900 truncate">
                    {mov.productName}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-neutral-200/60">
                    <span className="text-[11px] text-neutral-500">
                      {mov.device === 'APP_ANDROID_QR' ? '📱 Android QR' : mov.device === 'POS_MOSTRADOR' ? '🛒 Mostrador' : '💻 Panel Web'}
                    </span>

                    <span className={`font-mono font-bold tabular-nums ${
                      isEntry ? 'text-emerald-700' : isExit ? 'text-rose-700' : 'text-blue-700'
                    }`}>
                      {isEntry ? `+${mov.quantity}` : `${mov.quantity}`} unid.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={onOpenQuickSale}
              className="w-full py-2.5 px-3 text-xs font-semibold text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Abrir Terminal Mostrador / Venta Exprés</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Resumen de Categorías de Ferretería */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Distribución de Catálogo por Familia Ferretera
            </h3>
            <p className="text-xs text-neutral-500">
              Desglose de artículos y ubicaciones en almacén central
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Layers className="w-4 h-4 text-neutral-400" />
            <span>8 Departamentos</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat.id).length;
            const categoryStock = products
              .filter((p) => p.category === cat.id)
              .reduce((acc, p) => acc + p.stock, 0);

            return (
              <div 
                key={cat.id} 
                className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-lg text-center space-y-1 hover:border-amber-400 hover:bg-amber-50/20 transition-colors"
              >
                <div className="text-xs font-semibold text-neutral-800 line-clamp-1" title={cat.name}>
                  {cat.name}
                </div>
                <div className="text-lg font-bold font-mono text-neutral-900 tabular-nums">
                  {count}
                </div>
                <div className="text-[11px] text-neutral-500 font-mono">
                  {categoryStock} en stock
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
