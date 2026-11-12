import React from 'react';
import { 
  Package, 
  LayoutDashboard, 
  Boxes, 
  ShoppingCart, 
  ArrowLeftRight, 
  Printer, 
  Smartphone, 
  QrCode, 
  Code2, 
  Menu, 
  X,
  Radio
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'inventory' | 'pos' | 'movements' | 'labels' | 'code';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openScannerModal: () => void;
  isMobileSimulatorOpen: boolean;
  setIsMobileSimulatorOpen: (open: boolean) => void;
  realtimePulse: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openScannerModal,
  isMobileSimulatorOpen,
  setIsMobileSimulatorOpen,
  realtimePulse,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Tablero', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventario', icon: Boxes },
    { id: 'pos', label: 'Mostrador POS', icon: ShoppingCart },
    { id: 'movements', label: 'Kardex Movimientos', icon: ArrowLeftRight },
    { id: 'labels', label: 'Etiquetas QR', icon: Printer },
    { id: 'code', label: 'Código Laravel & Android', icon: Code2 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-neutral-900 border-b border-neutral-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-neutral-950 font-bold shadow-md">
              <Package className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                FerreStock <span className="text-amber-400 font-extrabold">PRO</span>
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                <span className="text-neutral-400">Ferretería & Sincronización</span>
                <span aria-hidden="true" className="text-neutral-600">·</span>
                <span className={`inline-flex items-center text-[10px] font-mono ${realtimePulse ? 'text-amber-400' : 'text-emerald-400'}`}>
                  <Radio className={`w-3 h-3 mr-1 ${realtimePulse ? 'animate-ping' : ''}`} />
                  MySQL Live
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-neutral-800 text-amber-400 shadow-inner'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Actions (Escáner QR + App Móvil Simulator) */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Botón Lector QR */}
            <button
              onClick={openScannerModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-900 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg transition-all shadow-sm whitespace-nowrap cursor-pointer"
              title="Abrir escáner QR de cámara o prueba rápida"
            >
              <QrCode className="w-4 h-4" />
              <span>Escanear QR</span>
            </button>

            {/* Botón Simulador App Móvil Android */}
            <button
              onClick={() => setIsMobileSimulatorOpen(!isMobileSimulatorOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                isMobileSimulatorOpen
                  ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-300'
                  : 'bg-neutral-800 hover:bg-neutral-700/80 border-neutral-700 text-neutral-200'
              }`}
              title="Abrir o cerrar la terminal Android de Bodega (React Native)"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">App Android</span>
              <span className="text-[10px] bg-neutral-900 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                {isMobileSimulatorOpen ? 'Ocultar' : 'Probar'}
              </span>
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-neutral-400 hover:text-white rounded-md focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile dropdown navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-neutral-800 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    setActiveTab(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-md text-left ${
                    isActive
                      ? 'bg-neutral-800 text-amber-400 font-semibold'
                      : 'text-neutral-300 hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
