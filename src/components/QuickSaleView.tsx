import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Printer, 
  CheckCircle2, 
  Search, 
  QrCode, 
  CreditCard, 
  Banknote, 
  Receipt,
  User,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { Product, CartItem, StockMovement } from '../types/inventory';
import { playScannerBeep } from '../utils/audio';

interface QuickSaleViewProps {
  products: Product[];
  onCompleteSale: (items: CartItem[], customerName: string, paymentMethod: string, ticketNum: string) => void;
  onOpenScanner: () => void;
}

export const QuickSaleView: React.FC<QuickSaleViewProps> = ({
  products,
  onCompleteSale,
  onOpenScanner,
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerName, setCustomerName] = useState('Público General');
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Crédito Obra'>('Efectivo');
  const [lastTicket, setLastTicket] = useState<{
    num: string;
    items: CartItem[];
    total: number;
    subtotal: number;
    iva: number;
    date: string;
    customer: string;
    payment: string;
  } | null>(null);

  // Add to cart
  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      playScannerBeep('error');
      alert(`El producto ${product.name} no tiene stock disponible.`);
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          playScannerBeep('warning');
          alert(`No puedes agregar más unidades que las disponibles en bodega (${product.stock}).`);
          return prevCart;
        }
        playScannerBeep('success');
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        playScannerBeep('success');
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  // Change quantity in cart
  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              alert(`Stock máximo disponible: ${item.product.stock}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Remove from cart
  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.product.salePrice * item.quantity, 0);
  const iva = subtotal * 0.16; // 16% IVA
  const total = subtotal + iva;

  // Process checkout
  const handleCheckout = () => {
    if (cart.length === 0) return;

    const ticketNumber = `T-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // Call parent handler to decrement stock in real time
    onCompleteSale(cart, customerName, paymentMethod, ticketNumber);

    // Save for receipt view
    setLastTicket({
      num: ticketNumber,
      items: [...cart],
      total,
      subtotal,
      iva,
      date: new Date().toLocaleString(),
      customer: customerName,
      payment: paymentMethod,
    });

    setCart([]);
    playScannerBeep('success');
  };

  const filteredCatalog = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-neutral-200 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-neutral-900">
            Terminal Punto de Venta & Mostrador Rápido
          </h2>
          <p className="text-xs text-neutral-500">
            Venta exprés de mostrador con descuento automático de inventario y emisión de ticket
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Escanear Artículo con Cámara</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Catálogo Rápido (7 columnas) */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar artículo para agregar al ticket (Nombre, SKU o Barcode)..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredCatalog.map((prod) => {
              const hasStock = prod.stock > 0;
              return (
                <div
                  key={prod.id}
                  className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                    hasStock
                      ? 'bg-neutral-50/70 border-neutral-200 hover:border-amber-400 hover:bg-amber-50/20'
                      : 'bg-neutral-100 border-neutral-200 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono font-bold text-neutral-700 bg-white px-1.5 py-0.5 rounded border border-neutral-200">
                        {prod.sku}
                      </span>
                      <span className={`font-mono text-[11px] font-semibold ${
                        prod.stock <= prod.minStock ? 'text-amber-700' : 'text-neutral-600'
                      }`}>
                        Stock: {prod.stock} {prod.unit}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-neutral-900 line-clamp-1" title={prod.name}>
                      {prod.name}
                    </h4>
                    <p className="text-[11px] text-neutral-500 font-mono mt-0.5">
                      {prod.brand} · Pasillo {prod.location.hall}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-neutral-200/60 flex items-center justify-between">
                    <span className="text-sm font-bold font-mono text-neutral-900 tabular-nums">
                      ${prod.salePrice.toFixed(2)}
                    </span>

                    <button
                      disabled={!hasStock}
                      onClick={() => handleAddToCart(prod)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1 ${
                        hasStock
                          ? 'bg-neutral-900 hover:bg-neutral-800 text-white cursor-pointer active:scale-95'
                          : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Agregar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carrito de Venta & Ticket (5 columnas) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-neutral-900">
                  Ticket de Venta en Mostrador
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                {cart.reduce((a, i) => a + i.quantity, 0)} artículos
              </span>
            </div>

            {/* Datos de cliente y pago */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-0.5">Cliente / Obra</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-900 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-0.5">Forma de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as unknown as typeof paymentMethod)}
                  className="w-full px-2 py-1.5 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-900 focus:outline-none"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                  <option value="Transferencia">Transferencia SPEI</option>
                  <option value="Crédito Obra">Crédito Contratista</option>
                </select>
              </div>
            </div>

            {/* Líneas del Carrito */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 divide-y divide-neutral-100">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-neutral-400 text-xs">
                  <Receipt className="w-8 h-8 mx-auto text-neutral-300 mb-1" />
                  El ticket está vacío. Selecciona artículos a la izquierda o escanea con la cámara.
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product.id} className="pt-2 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-neutral-900 truncate">
                        {item.product.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        ${item.product.salePrice.toFixed(2)} c/u
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center bg-neutral-100 rounded border border-neutral-200">
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, -1)}
                          className="px-1.5 py-0.5 text-neutral-600 hover:text-neutral-900"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-1.5 font-mono font-bold text-neutral-900 text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product.id, 1)}
                          className="px-1.5 py-0.5 text-neutral-600 hover:text-neutral-900"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-mono font-bold text-neutral-900 w-16 text-right tabular-nums">
                        ${(item.product.salePrice * item.quantity).toFixed(2)}
                      </span>

                      <button
                        onClick={() => handleRemoveFromCart(item.product.id)}
                        className="text-neutral-400 hover:text-rose-600 p-1"
                        title="Eliminar partida"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Totales */}
            <div className="pt-3 border-t border-neutral-200 space-y-1 text-xs">
              <div className="flex justify-between text-neutral-500">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>IVA (16%)</span>
                <span className="font-mono tabular-nums">${iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-900 text-base font-bold pt-1 border-t border-neutral-100">
                <span>Total a Cobrar</span>
                <span className="font-mono tabular-nums text-amber-600">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Botón Cobrar */}
            <button
              disabled={cart.length === 0}
              onClick={handleCheckout}
              className={`w-full py-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                cart.length > 0
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-amber-400 active:scale-98'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Confirmar Venta & Descontar de Bodega</span>
            </button>

          </div>

          {/* Último Ticket Emitido (Imprimible) */}
          {lastTicket && (
            <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between text-amber-900 font-bold">
                <span>Último Ticket Generado ({lastTicket.num})</span>
                <button
                  onClick={() => {
                    const printWin = window.open('', '_blank');
                    if (printWin) {
                      printWin.document.write(`
                        <html>
                          <head><title>Ticket ${lastTicket.num}</title></head>
                          <body style="font-family: monospace; padding: 20px; max-width: 300px; margin: auto;">
                            <h2 style="text-align: center; margin: 0;">FERRETERÍA EL MAESTRO</h2>
                            <p style="text-align: center; margin: 4px 0; font-size: 11px;">RFC: FER-920412-KK2 · Sucursal Central</p>
                            <p style="text-align: center; margin: 4px 0; font-size: 11px;">Tel: (55) 5541-2390</p>
                            <hr style="border: 1px dashed #000;" />
                            <p>Ticket: ${lastTicket.num}</p>
                            <p>Fecha: ${lastTicket.date}</p>
                            <p>Cliente: ${lastTicket.customer}</p>
                            <p>Pago: ${lastTicket.payment}</p>
                            <hr style="border: 1px dashed #000;" />
                            <table style="width: 100%; font-size: 11px;">
                              ${lastTicket.items.map(i => `
                                <tr>
                                  <td>${i.quantity}x ${i.product.name.slice(0, 18)}</td>
                                  <td style="text-align: right;">$${(i.product.salePrice * i.quantity).toFixed(2)}</td>
                                </tr>
                              `).join('')}
                            </table>
                            <hr style="border: 1px dashed #000;" />
                            <p style="font-size: 14px; font-weight: bold; text-align: right;">TOTAL: $${lastTicket.total.toFixed(2)}</p>
                            <p style="text-align: center; font-size: 11px; margin-top: 20px;">¡Gracias por su compra!<br/>Garantía de fábrica válida con este ticket.</p>
                            <script>window.onload = function() { window.print(); }<\/script>
                          </body>
                        </html>
                      `);
                      printWin.document.close();
                    }
                  }}
                  className="px-2.5 py-1 bg-amber-400 text-neutral-950 font-bold rounded hover:bg-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3 h-3" />
                  Imprimir Ticket
                </button>
              </div>
              <p className="text-[11px] text-amber-800">
                La venta de ${lastTicket.total.toFixed(2)} fue registrada en el Kardex y el stock se redujo en la base de datos MySQL en tiempo real.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
