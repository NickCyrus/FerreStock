import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { QuickSaleView } from './components/QuickSaleView';
import { StockMovementsView } from './components/StockMovementsView';
import { LabelPrintingView } from './components/LabelPrintingView';
import { QRScannerModal } from './components/QRScannerModal';
import { MobileAppSimulator } from './components/MobileAppSimulator';
import { CodeExportModal } from './components/CodeExportModal';

import { Product, StockMovement, Category, Supplier, CartItem } from './types/inventory';
import { INITIAL_PRODUCTS, INITIAL_CATEGORIES, INITIAL_SUPPLIERS, INITIAL_MOVEMENTS } from './data/initialData';
import { playScannerBeep } from './utils/audio';

export default function App() {
  // Estado con persistencia en localStorage para que cualquier cambio persista
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('ferrestock_products');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read products from localStorage', e);
    }
    return INITIAL_PRODUCTS;
  });

  const [movements, setMovements] = useState<StockMovement[]>(() => {
    try {
      const saved = localStorage.getItem('ferrestock_movements');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read movements from localStorage', e);
    }
    return INITIAL_MOVEMENTS;
  });

  const [categories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [suppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);

  // Tab activo
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modales y simuladores
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isMobileSimulatorOpen, setIsMobileSimulatorOpen] = useState(false);

  // Indicador de pulso en tiempo real
  const [realtimePulse, setRealtimePulse] = useState(false);

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ferrestock_products', JSON.stringify(products));
    } catch (e) {
      console.warn(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('ferrestock_movements', JSON.stringify(movements));
    } catch (e) {
      console.warn(e);
    }
  }, [movements]);

  // Disparar pulso visual de tiempo real
  const triggerRealtimeEvent = () => {
    setRealtimePulse(true);
    setTimeout(() => setRealtimePulse(false), 1200);
  };

  // Registrar un movimiento de stock (Kardex + Actualización de Producto)
  const handleRecordStockMovement = (movementData: Omit<StockMovement, 'id' | 'timestamp'>) => {
    const newMovement: StockMovement = {
      ...movementData,
      id: `mov-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toISOString(),
    };

    // Actualizar producto en el estado central
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === movementData.productId) {
          return {
            ...p,
            stock: movementData.newStock,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    // Agregar al Kardex
    setMovements((prev) => [newMovement, ...prev]);
    triggerRealtimeEvent();
  };

  // Agregar nuevo producto
  const handleAddProduct = (newProdData: Omit<Product, 'id' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...newProdData,
      id: `prod-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => [newProduct, ...prev]);

    // Registrar entrada inicial en el Kardex si tiene stock inicial
    if (newProduct.stock > 0) {
      handleRecordStockMovement({
        productId: newProduct.id,
        productName: newProduct.name,
        productSku: newProduct.sku,
        type: 'ENTRADA',
        quantity: newProduct.stock,
        previousStock: 0,
        newStock: newProduct.stock,
        reason: 'Alta de producto nuevo en catálogo',
        performedBy: 'Administrador (Panel Web)',
        device: 'PANEL_WEB',
        referenceDoc: 'ALTA-CATALOGO',
      });
    }

    playScannerBeep('success');
    triggerRealtimeEvent();
  };

  // Actualizar datos de producto
  const handleUpdateProduct = (updatedProd: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
    );
    triggerRealtimeEvent();
  };

  // Eliminar producto
  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    triggerRealtimeEvent();
  };

  // Completar venta rápida en mostrador
  const handleCompleteSale = (
    items: CartItem[],
    customerName: string,
    paymentMethod: string,
    ticketNum: string
  ) => {
    const newMovements: StockMovement[] = [];

    setProducts((prevProducts) => {
      const updated = [...prevProducts];

      items.forEach((item) => {
        const prodIndex = updated.findIndex((p) => p.id === item.product.id);
        if (prodIndex !== -1) {
          const prod = updated[prodIndex];
          const previousStock = prod.stock;
          const newStock = Math.max(0, previousStock - item.quantity);

          updated[prodIndex] = {
            ...prod,
            stock: newStock,
            updatedAt: new Date().toISOString(),
          };

          newMovements.push({
            id: `mov-${Date.now()}-${item.product.id}`,
            productId: prod.id,
            productName: prod.name,
            productSku: prod.sku,
            type: 'SALIDA',
            quantity: -item.quantity,
            previousStock,
            newStock,
            reason: `Venta Mostrador Ticket ${ticketNum} (${customerName} - ${paymentMethod})`,
            performedBy: 'Carlos Mostrador (POS)',
            device: 'POS_MOSTRADOR',
            referenceDoc: ticketNum,
            timestamp: new Date().toISOString(),
          });
        }
      });

      return updated;
    });

    setMovements((prev) => [...newMovements, ...prev]);
    triggerRealtimeEvent();
  };

  // Reabastecimiento rápido desde el dashboard (+10 unidades)
  const handleQuickReplenish = (product: Product) => {
    const replenishQty = Math.max(10, product.minStock * 2);
    const previousStock = product.stock;
    const newStock = previousStock + replenishQty;

    handleRecordStockMovement({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      type: 'ENTRADA',
      quantity: replenishQty,
      previousStock,
      newStock,
      reason: `Reabastecimiento rápido orden de compra urgente (+${replenishQty})`,
      performedBy: 'Administrador (Panel Web)',
      device: 'PANEL_WEB',
      referenceDoc: `OC-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    playScannerBeep('success');
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans">
      
      {/* Barra de Navegación Superior */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openScannerModal={() => setIsScannerModalOpen(true)}
        isMobileSimulatorOpen={isMobileSimulatorOpen}
        setIsMobileSimulatorOpen={setIsMobileSimulatorOpen}
        realtimePulse={realtimePulse}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'dashboard' && (
          <DashboardView
            products={products}
            movements={movements}
            categories={categories}
            onOpenQuickSale={() => setActiveTab('pos')}
            onOpenScanner={() => setIsScannerModalOpen(true)}
            onSelectProduct={(p) => setActiveTab('inventory')}
            onQuickReplenish={handleQuickReplenish}
            onOpenMobileSim={() => setIsMobileSimulatorOpen(true)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
            categories={categories}
            suppliers={suppliers}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onRecordStockMovement={handleRecordStockMovement}
            onOpenLabelPrinting={() => setActiveTab('labels')}
          />
        )}

        {activeTab === 'pos' && (
          <QuickSaleView
            products={products}
            onCompleteSale={handleCompleteSale}
            onOpenScanner={() => setIsScannerModalOpen(true)}
          />
        )}

        {activeTab === 'movements' && (
          <StockMovementsView movements={movements} />
        )}

        {activeTab === 'labels' && (
          <LabelPrintingView
            products={products}
            categories={categories}
            onBackToInventory={() => setActiveTab('inventory')}
          />
        )}

        {activeTab === 'code' && (
          <CodeExportModal />
        )}

      </main>

      {/* Footer Industrial Discreto */}
      <footer className="print:hidden bg-neutral-900 border-t border-neutral-800 py-6 text-neutral-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">FerreStock PRO</span>
            <span aria-hidden="true">·</span>
            <span>Sistema Integral de Inventario para Ferreterías</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-400">
            <span>Laravel 11 REST API</span>
            <span aria-hidden="true">·</span>
            <span>Base de Datos MySQL</span>
            <span aria-hidden="true">·</span>
            <span>React Native Android</span>
          </div>
        </div>
      </footer>

      {/* Modal de Escáner QR de Cámara y Pruebas */}
      <QRScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        products={products}
        onStockChange={handleRecordStockMovement}
      />

      {/* Simulador Android Companion App */}
      <MobileAppSimulator
        isOpen={isMobileSimulatorOpen}
        onClose={() => setIsMobileSimulatorOpen(false)}
        products={products}
        onStockChange={handleRecordStockMovement}
        onEmitSyncEvent={(msg) => triggerRealtimeEvent()}
      />

    </div>
  );
}
