export type CategoryId = 
  | 'herramientas_electricas'
  | 'herramientas_manuales'
  | 'fontaneria'
  | 'electricidad'
  | 'tornilleria'
  | 'pinturas'
  | 'construccion'
  | 'seguridad';

export interface Category {
  id: CategoryId;
  name: string;
  iconName: string;
  description: string;
  color: string;
}

export type UnitType = 'Pza' | 'Metro' | 'Kg' | 'Rollo' | 'Litro' | 'Caja' | 'Galón';

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  qrPayload: string;
  name: string;
  brand: string;
  category: CategoryId;
  description: string;
  purchasePrice: number; // Costo
  salePrice: number;     // Precio de Venta
  stock: number;
  minStock: number;
  maxStock: number;
  unit: UnitType;
  location: {
    hall: string;   // Pasillo (e.g. "P-03")
    shelf: string;  // Estante (e.g. "E-2")
    bin: string;    // Gaveta / Nivel (e.g. "G-14")
  };
  supplierId: string;
  updatedAt: string;
}

export type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  performedBy: string;
  device: 'PANEL_WEB' | 'APP_ANDROID_QR' | 'POS_MOSTRADOR';
  referenceDoc?: string;
  timestamp: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  leadTimeDays: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SyncEvent {
  id: string;
  type: 'STOCK_UPDATED' | 'PRODUCT_CREATED' | 'OFFLINE_DISPATCH_SYNCED';
  source: 'Android App (Bodega)' | 'Panel Web (Admin)' | 'Terminal Mostrador';
  message: string;
  timestamp: string;
}
