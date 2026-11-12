import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Database, 
  Smartphone, 
  Layers, 
  Server,
  FileCode,
  FolderTree
} from 'lucide-react';

interface CodeSnippet {
  id: string;
  name: string;
  category: 'laravel' | 'mysql' | 'react-native';
  path: string;
  language: string;
  code: string;
}

const CODE_FILES: CodeSnippet[] = [
  // 1. MySQL Schema Migration
  {
    id: 'laravel-migration',
    name: 'Migración MySQL (Tablas Ferretería)',
    category: 'mysql',
    path: 'database/migrations/2026_01_01_000001_create_hardware_store_tables.php',
    language: 'php',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Tablas completas para Ferretería: Categorías, Proveedores, Productos y Kardex
     */
    public function up(): void
    {
        // 1. Categorías de ferretería
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique(); // e.g. herramientas_electricas
            $table->string('name');
            $table->string('icon')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // 2. Proveedores ferreteros (Truper, DeWalt, Sika, etc.)
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('contact_person')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->integer('lead_time_days')->default(2);
            $table->timestamps();
        });

        // 3. Productos e Inventario
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('sku')->unique()->index();          // FER-EL-001
            $table->string('barcode')->unique()->index();      // EAN-13: 7501234560012
            $table->string('qr_payload')->unique();            // Texto codificado en el QR
            $table->string('name');
            $table->string('brand')->index();                  // DeWalt, Truper, Stanley...
            $table->foreignId('category_id')->constrained('categories')->cascadeOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            
            $table->text('description')->nullable();
            $table->decimal('purchase_price', 12, 2);          // Costo de compra
            $table->decimal('sale_price', 12, 2);              // PVP venta al público
            
            // Stock y métricas de seguridad
            $table->integer('stock')->default(0)->index();
            $table->integer('min_stock')->default(5);
            $table->integer('max_stock')->default(100);
            $table->enum('unit', ['Pza', 'Metro', 'Kg', 'Rollo', 'Caja', 'Litro', 'Galón'])->default('Pza');
            
            // Ubicación física en bodega / almacén
            $table->string('location_hall', 20)->default('P-01');   // Pasillo
            $table->string('location_shelf', 20)->default('E-A');   // Estante
            $table->string('location_bin', 20)->default('G-01');    // Gaveta
            
            $table->timestamps();
            $table->softDeletes();
        });

        // 4. Kardex de Movimientos (Entradas, Salidas y Ajustes)
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->enum('type', ['ENTRADA', 'SALIDA', 'AJUSTE'])->index();
            $table->integer('quantity');                       // Delta (+10 o -2)
            $table->integer('previous_stock');
            $table->integer('new_stock');
            $table->string('reason');
            $table->string('performed_by');                    // Nombre del bodeguero o cajero
            $table->enum('device', ['PANEL_WEB', 'APP_ANDROID_QR', 'POS_MOSTRADOR'])->default('PANEL_WEB');
            $table->string('reference_doc')->nullable();       // Factura o Ticket
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('products');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('categories');
    }
};`,
  },

  // 2. Laravel Product Model
  {
    id: 'laravel-model',
    name: 'Modelo Product.php (Eloquent)',
    category: 'laravel',
    path: 'app/Models/Product.php',
    language: 'php',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\SoftDeletes;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use App\\Events\\StockUpdatedEvent;

class Product extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'sku',
        'barcode',
        'qr_payload',
        'name',
        'brand',
        'category_id',
        'supplier_id',
        'description',
        'purchase_price',
        'sale_price',
        'stock',
        'min_stock',
        'max_stock',
        'unit',
        'location_hall',
        'location_shelf',
        'location_bin',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'stock' => 'integer',
        'min_stock' => 'integer',
        'max_stock' => 'integer',
    ];

    // Relaciones
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class)->latest();
    }

    // Scope para alertas de stock bajo
    public function scopeLowStock($query)
    {
        return $query->whereRaw('stock <= min_stock');
    }

    // Ajuste transaccional de stock con emisión de evento WebSocket en tiempo real
    public function adjustStock(int $delta, string $type, string $reason, string $user, string $device, ?string $doc = null): StockMovement
    {
        $previousStock = $this->stock;
        $newStock = max(0, $previousStock + $delta);

        $this->update(['stock' => $newStock]);

        $movement = $this->stockMovements()->create([
            'type' => $type,
            'quantity' => $delta,
            'previous_stock' => $previousStock,
            'new_stock' => $newStock,
            'reason' => $reason,
            'performed_by' => $user,
            'device' => $device,
            'reference_doc' => $doc,
        ]);

        // Emitir evento WebSocket en tiempo real a clientes conectados (Web y Android)
        broadcast(new StockUpdatedEvent($this, $movement))->toOthers();

        return $movement;
    }
}`,
  },

  // 3. Laravel API Controller
  {
    id: 'laravel-controller',
    name: 'Controlador API ProductController.php',
    category: 'laravel',
    path: 'app/Http/Controllers/Api/ProductController.php',
    language: 'php',
    code: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Product;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Validation\\Rule;

class ProductController extends Controller
{
    // Listado con filtros y paginación
    public function index(Request $request)
    {
        $query = Product::with(['category', 'supplier']);

        if ($request->has('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('sku', 'like', "%{$s}%")
                  ->orWhere('barcode', 'like', "%{$s}%")
                  ->orWhere('name', 'like', "%{$s}%")
                  ->orWhere('brand', 'like', "%{$s}%");
            });
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->boolean('low_stock_only')) {
            $query->lowStock();
        }

        return response()->json($query->paginate(25));
    }

    // Búsqueda instantánea por Código QR o Código de Barras (Usada por la App Android)
    public function findByQr(Request $request)
    {
        $payload = $request->validate([
            'payload' => 'required|string',
        ])['payload'];

        // Se busca por payload completo, por SKU o por código de barras EAN-13
        $product = Product::with(['category', 'supplier'])
            ->where('qr_payload', $payload)
            ->orWhere('sku', $payload)
            ->orWhere('barcode', $payload)
            ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Producto no encontrado en inventario ferretero.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $product
        ]);
    }

    // Actualización de stock desde App Android o Panel Web
    public function updateStock(Request $request, Product $product)
    {
        $data = $request->validate([
            'delta' => 'required|integer|not_in:0',
            'type' => ['required', Rule::in(['ENTRADA', 'SALIDA', 'AJUSTE'])],
            'reason' => 'required|string|max:255',
            'device' => ['required', Rule::in(['PANEL_WEB', 'APP_ANDROID_QR', 'POS_MOSTRADOR'])],
            'reference_doc' => 'nullable|string|max:100',
        ]);

        return DB::transaction(function () use ($product, $data, $request) {
            $user = $request->user()?->name ?? 'Operador Móvil Bodega';
            
            $movement = $product->adjustStock(
                delta: (int) $data['delta'],
                type: $data['type'],
                reason: $data['reason'],
                user: $user,
                device: $data['device'],
                doc: $data['reference_doc'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Stock sincronizado correctamente en tiempo real.',
                'product' => $product->fresh(),
                'movement' => $movement,
            ]);
        });
    }
}`,
  },

  // 4. WebSocket Event Broadcast
  {
    id: 'laravel-event',
    name: 'Evento Tiempo Real StockUpdatedEvent.php',
    category: 'laravel',
    path: 'app/Events/StockUpdatedEvent.php',
    language: 'php',
    code: `<?php

namespace App\\Events;

use App\\Models\\Product;
use App\\Models\\StockMovement;
use Illuminate\\Broadcasting\\Channel;
use Illuminate\\Broadcasting\\InteractsWithSockets;
use Illuminate\\Contracts\\Broadcasting\\ShouldBroadcastNow;
use Illuminate\\Foundation\\Events\\Dispatchable;
use Illuminate\\Queue\\SerializesModels;

class StockUpdatedEvent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Product $product,
        public StockMovement $movement
    ) {}

    /**
     * Canal público/privado de inventario en tiempo real (Pusher / Laravel Reverb)
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('ferreteria-inventory'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'stock.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'product_id' => $this->product->id,
            'sku' => $this->product->sku,
            'new_stock' => $this->product->stock,
            'min_stock' => $this->product->min_stock,
            'is_low' => $this->product->stock <= $this->product->min_stock,
            'movement' => [
                'type' => $this->movement->type,
                'quantity' => $this->movement->quantity,
                'device' => $this->movement->device,
                'timestamp' => $this->movement->created_at->toISOString(),
            ],
        ];
    }
}`,
  },

  // 5. React Native App.tsx
  {
    id: 'rn-app',
    name: 'React Native: App.tsx Principal',
    category: 'react-native',
    path: 'android-app/App.tsx',
    language: 'tsx',
    code: `import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, StatusBar, SafeAreaView, TouchableOpacity } from 'react-native';
import { QRScannerScreen } from './screens/QRScannerScreen';
import { InventoryListScreen } from './screens/InventoryListScreen';
import { SyncQueueScreen } from './screens/SyncQueueScreen';
import { syncOfflineQueue } from './services/offlineQueue';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'scan' | 'inventory' | 'sync'>('scan');
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Escucha de conexión para sincronización en segundo plano
  useEffect(() => {
    const timer = setInterval(async () => {
      const remaining = await syncOfflineQueue();
      setPendingSyncCount(remaining);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header móvil */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>FerreStock Móvil</Text>
        <Text style={styles.headerSubtitle}>Terminal Android · Lectura QR & Bodega</Text>
      </View>

      {/* Pantalla activa */}
      <View style={styles.content}>
        {currentTab === 'scan' && <QRScannerScreen />}
        {currentTab === 'inventory' && <InventoryListScreen />}
        {currentTab === 'sync' && <SyncQueueScreen />}
      </View>

      {/* Barra de navegación inferior */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tabButton, currentTab === 'scan' && styles.tabButtonActive]}
          onPress={() => setCurrentTab('scan')}
        >
          <Text style={[styles.tabText, currentTab === 'scan' && styles.tabTextActive]}>
            Escanear QR
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, currentTab === 'inventory' && styles.tabButtonActive]}
          onPress={() => setCurrentTab('inventory')}
        >
          <Text style={[styles.tabText, currentTab === 'inventory' && styles.tabTextActive]}>
            Inventario
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tabButton, currentTab === 'sync' && styles.tabButtonActive]}
          onPress={() => setCurrentTab('sync')}
        >
          <Text style={[styles.tabText, currentTab === 'sync' && styles.tabTextActive]}>
            Sincronizar {pendingSyncCount > 0 ? \`(\${pendingSyncCount})\` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { padding: 14, backgroundColor: '#18181b', borderBottomWidth: 1, borderColor: '#27272a' },
  headerTitle: { color: '#f59e0b', fontSize: 18, fontWeight: 'bold' },
  headerSubtitle: { color: '#a1a1aa', fontSize: 11 },
  content: { flex: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: '#18181b', borderTopWidth: 1, borderColor: '#27272a' },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabButtonActive: { borderTopWidth: 2, borderTopColor: '#f59e0b' },
  tabText: { color: '#71717a', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#f59e0b' },
});`,
  },

  // 6. React Native QR Scanner Screen
  {
    id: 'rn-scanner',
    name: 'React Native: QRScannerScreen.tsx',
    category: 'react-native',
    path: 'android-app/screens/QRScannerScreen.tsx',
    language: 'tsx',
    code: `import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '../services/api';
import { queueOfflineMovement } from '../services/offlineQueue';

export const QRScannerScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Se requiere permiso para usar la cámara</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Conceder Permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    Vibration.vibrate(100);

    try {
      // 1. Consultar API de Laravel
      const res = await api.post('/products/scan-qr', { payload: data });
      if (res.data.success) {
        setProduct(res.data.data);
      }
    } catch (err) {
      Alert.alert('Error', 'No se encontró el producto con ese código QR');
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (type: 'ENTRADA' | 'SALIDA', qty: number) => {
    if (!product) return;
    const delta = type === 'ENTRADA' ? qty : -qty;

    try {
      // Intento en línea
      await api.post(\`/products/\${product.id}/stock\`, {
        delta,
        type,
        reason: 'Despacho móvil desde terminal Android',
        device: 'APP_ANDROID_QR',
      });
      Alert.alert('Éxito', \`Stock actualizado: \${product.stock + delta} unidades\`);
    } catch (error) {
      // Si falla la red, guardar en SQLite/AsyncStorage offline
      await queueOfflineMovement({
        productId: product.id,
        sku: product.sku,
        delta,
        type,
      });
      Alert.alert('Guardado Offline', 'Sin conexión a internet. Guardado en cola local.');
    } finally {
      setProduct(null);
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13'] }}
      >
        <View style={styles.overlay}>
          <View style={styles.reticle} />
          <Text style={styles.hint}>Apunta la cámara a la etiqueta QR del anaquel</Text>
        </View>
      </CameraView>

      {product && (
        <View style={styles.card}>
          <Text style={styles.sku}>{product.sku} · {product.brand}</Text>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.stock}>Stock actual: {product.stock} {product.unit}</Text>
          <Text style={styles.location}>
            Ubicación: Pasillo {product.location_hall} / Estante {product.location_shelf}
          </Text>

          <View style={styles.btnRow}>
            <TouchableOpacity 
              style={[styles.actionBtn, styles.btnOut]}
              onPress={() => handleStockUpdate('SALIDA', 1)}
            >
              <Text style={styles.btnLabel}>- Despachar 1</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.btnIn]}
              onPress={() => handleStockUpdate('ENTRADA', 5)}
            >
              <Text style={styles.btnLabel}>+ Recibir 5</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  reticle: { width: 220, height: 220, borderWidth: 2, borderColor: '#f59e0b', borderRadius: 16 },
  hint: { color: '#fff', marginTop: 16, fontSize: 12, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 6 },
  card: { padding: 16, backgroundColor: '#18181b', borderTopWidth: 1, borderColor: '#27272a' },
  sku: { color: '#f59e0b', fontSize: 12, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginVertical: 4 },
  stock: { color: '#10b981', fontSize: 13, fontWeight: 'bold' },
  location: { color: '#a1a1aa', fontSize: 12, marginBottom: 12 },
  btnRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnOut: { backgroundColor: '#e11d48' },
  btnIn: { backgroundColor: '#059669' },
  btnLabel: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { color: '#fff', marginBottom: 14 },
  btn: { backgroundColor: '#f59e0b', padding: 10, borderRadius: 8 },
  btnText: { color: '#000', fontWeight: 'bold' },
});`,
  },
];

export const CodeExportModal: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'laravel' | 'mysql' | 'react-native'>('all');
  const [activeFileId, setActiveFileId] = useState<string>(CODE_FILES[0].id);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeSnippet = CODE_FILES.find((f) => f.id === activeFileId) || CODE_FILES[0];

  const handleCopyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadZipNotice = () => {
    const blob = new Blob([activeSnippet.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeSnippet.path.split('/').pop() || 'archivo.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredFiles = CODE_FILES.filter(
    (f) => selectedCategory === 'all' || f.category === selectedCategory
  );

  return (
    <div className="space-y-5">
      
      {/* Banner de Arquitectura */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-neutral-900">
              Arquitectura de Producción: Laravel 11 + MySQL + React Native (Android)
            </h2>
            <p className="text-xs text-neutral-500">
              Código fuente nativo y limpio listo para desplegar en tu servidor PHP/MySQL y compilar con Expo / Gradle
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopyCode(activeSnippet.code, 'full')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              {copiedId === 'full' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedId === 'full' ? '¡Copiado!' : 'Copiar Archivo Actual'}</span>
            </button>
            <button
              onClick={handleDownloadZipNotice}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Archivo</span>
            </button>
          </div>
        </div>

        {/* Filter categories */}
        <div className="pt-2 border-t border-neutral-100 flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              selectedCategory === 'all' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            Todos los Archivos ({CODE_FILES.length})
          </button>
          <button
            onClick={() => setSelectedCategory('laravel')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
              selectedCategory === 'laravel' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            <Server className="w-3 h-3 text-red-500" />
            Backend Laravel 11
          </button>
          <button
            onClick={() => setSelectedCategory('mysql')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
              selectedCategory === 'mysql' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            <Database className="w-3 h-3 text-blue-500" />
            Base de Datos MySQL
          </button>
          <button
            onClick={() => setSelectedCategory('react-native')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
              selectedCategory === 'react-native' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            <Smartphone className="w-3 h-3 text-emerald-500" />
            App Android (React Native)
          </button>
        </div>
      </div>

      {/* Explorer layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* File tree sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-neutral-200 rounded-xl p-3 shadow-xs space-y-2">
          <div className="text-xs font-bold text-neutral-500 uppercase px-2 py-1 tracking-wider font-mono">
            Estructura del Proyecto
          </div>

          <div className="space-y-1">
            {filteredFiles.map((file) => {
              const isActive = file.id === activeSnippet.id;
              return (
                <button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-amber-400/20 text-amber-950 font-bold border border-amber-300'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <FileCode className={`w-3.5 h-3.5 shrink-0 ${
                        file.category === 'laravel' ? 'text-red-500' : file.category === 'mysql' ? 'text-blue-500' : 'text-emerald-500'
                      }`} />
                      <span className="truncate">{file.name}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 font-mono truncate mt-0.5">
                      {file.path}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-neutral-50 rounded-lg text-[11px] text-neutral-600 border border-neutral-200 mt-4 space-y-1">
            <div className="font-bold text-neutral-800">Pasos Rápidos de Despliegue:</div>
            <div>1. <code className="font-mono bg-neutral-200 px-1 rounded">php artisan migrate</code></div>
            <div>2. <code className="font-mono bg-neutral-200 px-1 rounded">php artisan reverb:start</code></div>
            <div>3. <code className="font-mono bg-neutral-200 px-1 rounded">npx expo run:android</code></div>
          </div>
        </div>

        {/* Code viewer (8 cols) */}
        <div className="lg:col-span-8 bg-neutral-950 rounded-xl border border-neutral-800 shadow-md flex flex-col overflow-hidden">
          
          {/* Code Header */}
          <div className="bg-neutral-900 px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-amber-400 font-bold">{activeSnippet.language.toUpperCase()}</span>
              <span>·</span>
              <span className="text-neutral-200 truncate">{activeSnippet.path}</span>
            </div>

            <button
              onClick={() => handleCopyCode(activeSnippet.code, activeSnippet.id)}
              className="text-neutral-300 hover:text-white p-1 rounded hover:bg-neutral-800 flex items-center gap-1 text-[11px]"
            >
              {copiedId === activeSnippet.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === activeSnippet.id ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>

          {/* Code body */}
          <pre className="p-4 overflow-x-auto text-xs font-mono text-neutral-200 leading-relaxed max-h-[600px] select-all">
            <code>{activeSnippet.code}</code>
          </pre>
        </div>

      </div>

    </div>
  );
};
