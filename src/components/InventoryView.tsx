import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Download, 
  QrCode, 
  ArrowUpDown, 
  SlidersHorizontal, 
  Trash2, 
  Edit3, 
  MapPin, 
  Layers, 
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Printer,
  X
} from 'lucide-react';
import { Product, Category, CategoryId, Supplier, StockMovement, UnitType } from '../types/inventory';
import { generateQrDataUrl } from '../utils/qr';

interface InventoryViewProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  onAddProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onRecordStockMovement: (movement: Omit<StockMovement, 'id' | 'timestamp'>) => void;
  onOpenLabelPrinting: (selectedProductIds?: string[]) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  categories,
  suppliers,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRecordStockMovement,
  onOpenLabelPrinting,
}) => {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState<'all' | 'low' | 'normal'>('all');
  
  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementTargetProduct, setMovementTargetProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'ENTRADA' | 'SALIDA' | 'AJUSTE'>('ENTRADA');
  const [movementQty, setMovementQty] = useState<number>(1);
  const [movementReason, setMovementReason] = useState<string>('Reabastecimiento regular');
  const [movementRef, setMovementRef] = useState<string>('');

  const [qrModalProduct, setQrModalProduct] = useState<Product | null>(null);
  const [qrModalDataUrl, setQrModalDataUrl] = useState<string>('');

  // Form state for product create / edit
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    brand: '',
    category: 'herramientas_electricas' as CategoryId,
    description: '',
    purchasePrice: 100,
    salePrice: 150,
    stock: 10,
    minStock: 5,
    maxStock: 50,
    unit: 'Pza' as UnitType,
    hall: 'P-01',
    shelf: 'E-A',
    bin: 'G-01',
    supplierId: suppliers[0]?.id || 'sup-1',
  });

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Category filter
      if (selectedCategory !== 'all' && prod.category !== selectedCategory) {
        return false;
      }

      // Stock status filter
      if (selectedStockFilter === 'low' && prod.stock > prod.minStock) {
        return false;
      }
      if (selectedStockFilter === 'normal' && prod.stock <= prod.minStock) {
        return false;
      }

      // Text search
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesSku = prod.sku.toLowerCase().includes(query);
        const matchesBarcode = prod.barcode.toLowerCase().includes(query);
        const matchesName = prod.name.toLowerCase().includes(query);
        const matchesBrand = prod.brand.toLowerCase().includes(query);
        const matchesLocation = `${prod.location.hall} ${prod.location.shelf} ${prod.location.bin}`.toLowerCase().includes(query);
        return matchesSku || matchesBarcode || matchesName || matchesBrand || matchesLocation;
      }

      return true;
    });
  }, [products, selectedCategory, selectedStockFilter, searchQuery]);

  // Open QR modal
  const handleOpenQrModal = async (prod: Product) => {
    setQrModalProduct(prod);
    const url = await generateQrDataUrl(prod.qrPayload, 260);
    setQrModalDataUrl(url);
  };

  // Open Create Modal with auto-generated SKU
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    const randomNum = Math.floor(100 + Math.random() * 900);
    const generatedSku = `FER-NUEVO-${randomNum}`;
    const generatedBarcode = `75012345${randomNum}1`;

    setFormData({
      sku: generatedSku,
      barcode: generatedBarcode,
      name: '',
      brand: 'Truper',
      category: 'herramientas_manuales',
      description: '',
      purchasePrice: 150,
      salePrice: 220,
      stock: 12,
      minStock: 5,
      maxStock: 40,
      unit: 'Pza',
      hall: 'P-02',
      shelf: 'E-A',
      bin: 'G-01',
      supplierId: suppliers[0]?.id || 'sup-1',
    });
    setIsProductModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      sku: prod.sku,
      barcode: prod.barcode,
      name: prod.name,
      brand: prod.brand,
      category: prod.category,
      description: prod.description,
      purchasePrice: prod.purchasePrice,
      salePrice: prod.salePrice,
      stock: prod.stock,
      minStock: prod.minStock,
      maxStock: prod.maxStock,
      unit: prod.unit,
      hall: prod.location.hall,
      shelf: prod.location.shelf,
      bin: prod.location.bin,
      supplierId: prod.supplierId,
    });
    setIsProductModalOpen(true);
  };

  // Save product (create or edit)
  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) return;

    const qrPayload = `${formData.sku}|${formData.barcode}|${formData.name}`;

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        sku: formData.sku,
        barcode: formData.barcode,
        qrPayload,
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        description: formData.description,
        purchasePrice: Number(formData.purchasePrice),
        salePrice: Number(formData.salePrice),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        maxStock: Number(formData.maxStock),
        unit: formData.unit,
        location: {
          hall: formData.hall,
          shelf: formData.shelf,
          bin: formData.bin,
        },
        supplierId: formData.supplierId,
        updatedAt: new Date().toISOString(),
      });
    } else {
      onAddProduct({
        sku: formData.sku,
        barcode: formData.barcode,
        qrPayload,
        name: formData.name,
        brand: formData.brand,
        category: formData.category,
        description: formData.description,
        purchasePrice: Number(formData.purchasePrice),
        salePrice: Number(formData.salePrice),
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        maxStock: Number(formData.maxStock),
        unit: formData.unit,
        location: {
          hall: formData.hall,
          shelf: formData.shelf,
          bin: formData.bin,
        },
        supplierId: formData.supplierId,
      });
    }

    setIsProductModalOpen(false);
  };

  // Open movement modal
  const handleOpenMovement = (prod: Product, defaultType: 'ENTRADA' | 'SALIDA' | 'AJUSTE' = 'ENTRADA') => {
    setMovementTargetProduct(prod);
    setMovementType(defaultType);
    setMovementQty(defaultType === 'ENTRADA' ? 10 : 1);
    setMovementReason(defaultType === 'ENTRADA' ? 'Reabastecimiento de pedido' : defaultType === 'SALIDA' ? 'Venta mostrador' : 'Ajuste por conteo físico');
    setMovementRef(`DOC-${Math.floor(1000 + Math.random() * 9000)}`);
    setIsMovementModalOpen(true);
  };

  // Submit stock movement
  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementTargetProduct || movementQty <= 0) return;

    let delta = movementQty;
    if (movementType === 'SALIDA') {
      delta = -movementQty;
    }

    const previousStock = movementTargetProduct.stock;
    const newStock = Math.max(0, previousStock + (movementType === 'AJUSTE' ? movementQty - previousStock : delta));

    onRecordStockMovement({
      productId: movementTargetProduct.id,
      productName: movementTargetProduct.name,
      productSku: movementTargetProduct.sku,
      type: movementType,
      quantity: movementType === 'AJUSTE' ? newStock - previousStock : delta,
      previousStock,
      newStock,
      reason: movementReason,
      performedBy: 'Administrador (Panel Web)',
      device: 'PANEL_WEB',
      referenceDoc: movementRef,
    });

    setIsMovementModalOpen(false);
  };

  // Export inventory CSV
  const handleExportCsv = () => {
    const headers = ['SKU', 'Codigo_Barras', 'Nombre', 'Marca', 'Categoria', 'Costo_Compra', 'PVP_Venta', 'Stock_Actual', 'Stock_Minimo', 'Unidad', 'Pasillo', 'Estante', 'Gaveta'];
    const rows = filteredProducts.map((p) => [
      p.sku,
      p.barcode,
      `"${p.name.replace(/"/g, '""')}"`,
      p.brand,
      p.category,
      p.purchasePrice,
      p.salePrice,
      p.stock,
      p.minStock,
      p.unit,
      p.location.hall,
      p.location.shelf,
      p.location.bin,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventario_ferreteria_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      
      {/* Barra de Filtros, Búsqueda y Acciones */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por SKU, Nombre, Marca, Código de Barras o Ubicación (ej: P-02)..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onOpenLabelPrinting()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
              title="Generar hoja de etiquetas QR para imprimir en anaqueles"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir QR Lote</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
              title="Descargar base de datos en archivo CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar CSV</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Producto</span>
            </button>
          </div>

        </div>

        {/* Secondary Filters: Categories & Stock Status */}
        <div className="pt-2 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2">
          
          {/* Segmented Category Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 max-w-full">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Todas ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-neutral-900 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Stock Level Selector */}
          <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg shrink-0">
            <button
              onClick={() => setSelectedStockFilter('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedStockFilter === 'all' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedStockFilter('low')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedStockFilter === 'low' ? 'bg-white text-amber-700 font-semibold shadow-xs' : 'text-neutral-600'
              }`}
            >
              Bajo / Crítico
            </button>
            <button
              onClick={() => setSelectedStockFilter('normal')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedStockFilter === 'normal' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-600'
              }`}
            >
              Normal
            </button>
          </div>

        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase font-mono tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">SKU / QR</th>
                <th className="py-3 px-4">Producto & Marca</th>
                <th className="py-3 px-4">Familia</th>
                <th className="py-3 px-4">Ubicación Bodega</th>
                <th className="py-3 px-4 text-right">Costo / PVP</th>
                <th className="py-3 px-4 text-center">Stock Actual</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    <p className="font-medium text-sm">No se encontraron productos con estos criterios de búsqueda.</p>
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedCategory('all'); setSelectedStockFilter('all'); }}
                      className="mt-2 text-amber-600 hover:underline text-xs"
                    >
                      Restablecer todos los filtros
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const isLow = prod.stock <= prod.minStock;
                  const isCritical = prod.stock <= Math.ceil(prod.minStock / 2);
                  const marginPct = prod.salePrice > 0 ? ((prod.salePrice - prod.purchasePrice) / prod.salePrice) * 100 : 0;
                  const categoryObj = categories.find((c) => c.id === prod.category);

                  return (
                    <tr key={prod.id} className="hover:bg-neutral-50/70 transition-colors">
                      
                      {/* SKU & QR trigger */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenQrModal(prod)}
                            className="p-1.5 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-700 transition-colors cursor-pointer"
                            title="Ver y ampliar Código QR para escanear"
                          >
                            <QrCode className="w-4 h-4 text-neutral-900" />
                          </button>
                          <div className="flex flex-col">
                            <span className="font-mono font-bold text-neutral-900">
                              {prod.sku}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {prod.barcode}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Name & Brand */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-neutral-900 truncate" title={prod.name}>
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {prod.brand} <span aria-hidden="true">·</span> {prod.description.slice(0, 45)}...
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 whitespace-nowrap text-neutral-600">
                        <span className="text-xs">
                          {categoryObj?.name || prod.category}
                        </span>
                      </td>

                      {/* Location in warehouse */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-[11px] text-neutral-700">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{prod.location.hall}</span>
                          <span className="text-neutral-400">/</span>
                          <span>{prod.location.shelf}</span>
                          <span className="text-neutral-400">/</span>
                          <span>{prod.location.bin}</span>
                        </div>
                      </td>

                      {/* Cost / Sale Price */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="font-mono font-bold text-neutral-900 tabular-nums">
                          ${prod.salePrice.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-neutral-400 font-mono tabular-nums">
                          Costo: ${prod.purchasePrice.toFixed(2)} ({marginPct.toFixed(0)}%)
                        </div>
                      </td>

                      {/* Stock current with status */}
                      <td className="py-3 px-4 whitespace-nowrap text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`font-mono font-bold tabular-nums text-sm ${
                            isCritical ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-neutral-900'
                          }`}>
                            {prod.stock} {prod.unit}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            mín: {prod.minStock} | máx: {prod.maxStock}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Botón rápido entrada stock */}
                          <button
                            onClick={() => handleOpenMovement(prod, 'ENTRADA')}
                            className="px-2 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded transition-colors cursor-pointer"
                            title="Registrar entrada de mercancía"
                          >
                            + Entrada
                          </button>

                          {/* Botón rápido salida stock */}
                          <button
                            onClick={() => handleOpenMovement(prod, 'SALIDA')}
                            className="px-2 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 rounded transition-colors cursor-pointer"
                            title="Registrar salida o venta"
                          >
                            - Salida
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                            title="Editar ficha de producto"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Eliminar */}
                          <button
                            onClick={() => {
                              if (confirm(`¿Estás seguro de eliminar "${prod.name}" del catálogo?`)) {
                                onDeleteProduct(prod.id);
                              }
                            }}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with counts */}
        <div className="p-3 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-500 flex items-center justify-between">
          <div>
            Mostrando <span className="font-mono font-bold text-neutral-800">{filteredProducts.length}</span> de <span className="font-mono font-bold text-neutral-800">{products.length}</span> productos totales
          </div>
          <div className="text-[11px] text-neutral-400">
            Sincronización en tiempo real habilitada con base de datos MySQL
          </div>
        </div>
      </div>

      {/* MODAL: QR DETALLADO DEL PRODUCTO */}
      {qrModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-neutral-900">Código QR de Producto</h3>
              </div>
              <button
                onClick={() => setQrModalProduct(null)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center space-y-3">
              <div className="p-4 bg-white border border-neutral-200 rounded-lg inline-block shadow-xs">
                {qrModalDataUrl ? (
                  <img src={qrModalDataUrl} alt="QR Code" className="w-48 h-48 mx-auto" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-neutral-100 text-xs text-neutral-400">
                    Generando QR...
                  </div>
                )}
              </div>

              <div>
                <p className="font-bold text-sm text-neutral-900">{qrModalProduct.name}</p>
                <p className="font-mono text-xs text-neutral-500">{qrModalProduct.sku} · {qrModalProduct.brand}</p>
                <p className="text-xs text-neutral-600 mt-1 font-mono">
                  Ubicación: Pasillo {qrModalProduct.location.hall} / Estante {qrModalProduct.location.shelf} / Gaveta {qrModalProduct.location.bin}
                </p>
                <p className="text-xs font-bold text-neutral-900 font-mono mt-1">
                  PVP: ${qrModalProduct.salePrice.toFixed(2)} (Stock: {qrModalProduct.stock} {qrModalProduct.unit})
                </p>
              </div>

              <div className="p-2.5 bg-neutral-50 rounded text-[11px] font-mono text-neutral-600 break-all text-left border border-neutral-200">
                <span className="font-semibold text-neutral-800">Payload QR: </span>
                {qrModalProduct.qrPayload}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  const printWin = window.open('', '_blank');
                  if (printWin) {
                    printWin.document.write(`
                      <html>
                        <head><title>Etiqueta QR - ${qrModalProduct.sku}</title></head>
                        <body style="font-family: sans-serif; text-align: center; padding: 20px;">
                          <h3 style="margin: 0;">${qrModalProduct.name}</h3>
                          <p style="font-family: monospace; font-size: 14px; margin: 4px 0;">SKU: ${qrModalProduct.sku} | ${qrModalProduct.brand}</p>
                          <img src="${qrModalDataUrl}" style="width: 180px; height: 180px; margin: 10px auto;" />
                          <p style="font-family: monospace; margin: 0; font-size: 16px; font-weight: bold;">$${qrModalProduct.salePrice.toFixed(2)}</p>
                          <p style="font-size: 12px; margin: 2px 0;">Ubicación: ${qrModalProduct.location.hall} - ${qrModalProduct.location.shelf} - ${qrModalProduct.location.bin}</p>
                          <script>window.onload = function() { window.print(); }<\/script>
                        </body>
                      </html>
                    `);
                    printWin.document.close();
                  }
                }}
                className="flex-1 py-2 text-xs font-semibold text-neutral-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
              >
                Imprimir Etiqueta
              </button>
              <button
                onClick={() => setQrModalProduct(null)}
                className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MOVIMIENTO DE STOCK (ENTRADA / SALIDA / AJUSTE) */}
      {isMovementModalOpen && movementTargetProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-sm text-neutral-900">
                Registrar Movimiento de Inventario
              </h3>
              <button
                onClick={() => setIsMovementModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/80 space-y-1">
              <div className="text-xs font-mono font-bold text-amber-700">{movementTargetProduct.sku}</div>
              <div className="text-xs font-semibold text-neutral-900">{movementTargetProduct.name}</div>
              <div className="text-xs text-neutral-500 font-mono">
                Stock actual en sistema: <strong className="text-neutral-900 font-bold">{movementTargetProduct.stock} {movementTargetProduct.unit}</strong>
              </div>
            </div>

            <form onSubmit={handleSubmitMovement} className="space-y-4">
              
              {/* Selector de Tipo */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Tipo de Movimiento
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('ENTRADA');
                      setMovementReason('Recepción de pedido con factura');
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      movementType === 'ENTRADA'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    + Entrada (Compra)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('SALIDA');
                      setMovementReason('Venta mostrador / despacho a cliente');
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      movementType === 'SALIDA'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    - Salida (Venta)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('AJUSTE');
                      setMovementReason('Conteo físico de auditoría / merma');
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      movementType === 'AJUSTE'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    ± Ajuste
                  </button>
                </div>
              </div>

              {/* Cantidad */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  {movementType === 'AJUSTE' ? 'Nuevo Stock Físico Total' : `Cantidad de ${movementType === 'ENTRADA' ? 'Entrada' : 'Salida'}`} ({movementTargetProduct.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  value={movementQty}
                  onChange={(e) => setMovementQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm font-mono font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Motivo / Concepto
                </label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Documento de referencia */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  N° Factura / Remisión / Ticket
                </label>
                <input
                  type="text"
                  value={movementRef}
                  onChange={(e) => setMovementRef(e.target.value)}
                  placeholder="FAC-1234 o REM-5678"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs"
                >
                  Confirmar y Actualizar Stock
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: ALTA / EDICIÓN DE PRODUCTO */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 border border-neutral-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-bold text-sm text-neutral-900">
                {editingProduct ? 'Editar Producto del Catálogo' : 'Registrar Nuevo Artículo de Ferretería'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              
              {/* Fila 1: SKU y Código de barras */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Código SKU Interno *
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono font-bold text-neutral-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Código de Barras EAN-13 *
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900"
                    required
                  />
                </div>
              </div>

              {/* Fila 2: Nombre y Marca */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej. Martillo de Uña 16oz Mango Fibra"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Marca / Fabricante *
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Truper, DeWalt, Stanley..."
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900"
                    required
                  />
                </div>
              </div>

              {/* Fila 3: Categoría y Proveedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Familia / Categoría
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as CategoryId })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Proveedor Habitual
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fila 4: Precios y Unidad */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Precio Compra ($ Costo)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Precio Venta ($ PVP)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono font-bold text-neutral-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value as UnitType })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900"
                  >
                    <option value="Pza">Pza (Pieza)</option>
                    <option value="Metro">Metro</option>
                    <option value="Kg">Kg (Kilogramo)</option>
                    <option value="Rollo">Rollo</option>
                    <option value="Caja">Caja</option>
                    <option value="Litro">Litro</option>
                    <option value="Galón">Galón</option>
                  </select>
                </div>
              </div>

              {/* Fila 5: Niveles de Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Stock Inicial / Actual
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono font-bold text-neutral-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Stock Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Stock Máximo
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxStock}
                    onChange={(e) => setFormData({ ...formData, maxStock: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-mono text-neutral-900"
                    required
                  />
                </div>
              </div>

              {/* Fila 6: Ubicación Física en Almacén */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Ubicación Física en Almacén / Bodega
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Pasillo (ej: P-03)"
                      value={formData.hall}
                      onChange={(e) => setFormData({ ...formData, hall: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Estante (ej: E-A)"
                      value={formData.shelf}
                      onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Gaveta (ej: G-12)"
                      value={formData.bin}
                      onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Descripción Técnica & Especificaciones
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detalles sobre potencia, calibre, material, voltajes..."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Registrar Producto y Generar QR'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
