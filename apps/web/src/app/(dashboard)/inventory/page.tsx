"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronDown, 
  Barcode, 
  Download, 
  Plus, 
  LayoutGrid, 
  List, 
  MapPin,
  Laptop,
  Mouse,
  Armchair,
  Book,
  Printer,
  AlertTriangle,
  Bell,
  ArrowRight,
  X,
  Package,
  Monitor,
  HardDrive,
  Sofa,
  PenTool,
  Wrench,
  Shirt,
  Cpu,
  Smartphone,
  Headphones,
  Camera,
  Watch,
  Dumbbell,
  Car,
  Bike,
  Utensils,
  GlassWater,
  Shrub,
  Gem,
  Gift,
  Loader2,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

interface DashboardStats {
  totalValue: string;
  lowStock: number;
  outOfStock: number;
  turnoverRatio: string;
  stockDistribution: { label: string; percent: number; color: string }[];
  totalSkuCount: number;
  locationCount: number;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  categoryId: string;
  location: string;
  qty: number;
  minStockLevel: number;
  maxStockLevel: number;
  supplier: string;
  unitCost: number;
  leadTime: string;
  stockLevelPercent: number;
  status: 'normal' | 'low_stock' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  name: string;
}

interface ReorderItem {
  id: string;
  name: string;
  sku: string;
  current: number;
  recommendedOrder: number;
  unitCost: number;
}

const categoryIconMap: Record<string, React.ElementType> = {
  'IT hardware': Laptop,
  'Office equipment': Monitor,
  'Furniture': Armchair,
  'Consumables': Book,
};

function getItemIcon(category: string): React.ElementType {
  return categoryIconMap[category] || Package;
}

const HeaderActions = ({ onOpenReorder, reorderCount }: { onOpenReorder: () => void; reorderCount: number }) => (
  <div className="flex flex-wrap items-center gap-3">
    <button className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-[var(--radius)] text-sm font-medium hover:bg-muted/50 transition-colors shrink-0">
      All Locations <ChevronDown className="w-4 h-4 text-muted-foreground" />
    </button>
    
    <button 
      onClick={onOpenReorder}
      className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-[var(--radius)] text-sm font-medium hover:bg-muted/50 transition-colors shrink-0 relative"
    >
      <Bell className="w-4 h-4 text-[#F5A623]" /> 
      Reorders
      {reorderCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
          {reorderCount}
        </span>
      )}
    </button>

    <div className="flex gap-2 shrink-0">
      <button className="p-2 bg-card border border-border rounded-[var(--radius)] text-muted-foreground hover:text-foreground transition-colors">
        <Barcode className="w-4 h-4" />
      </button>
      <button className="p-2 bg-card border border-border rounded-[var(--radius)] text-muted-foreground hover:text-foreground transition-colors">
        <Download className="w-4 h-4" />
      </button>
    </div>
    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] text-sm font-medium hover:opacity-90 transition-opacity shrink-0">
      <Plus className="w-4 h-4" /> Add item
    </button>
  </div>
);

const StatsCard = ({ stats }: { stats: DashboardStats }) => (
  <div className="bg-card border border-border rounded-xl p-6 shadow-sm w-full mb-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-0 mb-8">
      <div className="flex flex-col md:pr-6 md:border-r border-border/60 pb-4 md:pb-0">
        <p className="text-[13px] font-medium text-muted-foreground mb-3">Total stock value</p>
        <div className="flex flex-col">
          <span className="text-base font-medium text-foreground leading-tight">PKR</span>
          <span className="text-[26px] font-mono leading-tight tracking-tight text-foreground mt-1">
            {stats.totalValue}
          </span>
        </div>
      </div>
      <div className="flex flex-col md:px-6 md:border-r border-border/60 pb-4 md:pb-0">
        <p className="text-[13px] font-medium text-muted-foreground mb-3">Low stock alerts</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-[#F5A623] shrink-0" />
          <span className="text-[24px] font-medium text-foreground leading-none">{stats.lowStock}</span>
        </div>
      </div>
      <div className="flex flex-col md:px-6 md:border-r border-border/60 pb-4 md:pb-0">
        <p className="text-[13px] font-medium text-muted-foreground mb-3">Out of stock</p>
        <div className="mt-1">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full border-[2px] border-destructive text-destructive text-xl font-medium shrink-0">
            {stats.outOfStock}
          </div>
        </div>
      </div>
      <div className="flex flex-col md:pl-6 pb-4 md:pb-0">
        <p className="text-[13px] font-medium text-muted-foreground mb-3">Turnover ratio</p>
        <div className="mt-1">
          <span className="text-[24px] font-medium text-foreground leading-none">{stats.turnoverRatio}</span>
        </div>
      </div>
    </div>
    
    <div className="h-2.5 w-full flex gap-1.5">
      {stats.stockDistribution?.map((seg, i) => (
        <div
          key={i}
          className="h-full rounded-full"
          style={{ width: `${seg.percent}%`, backgroundColor: seg.color }}
        />
      ))}
    </div>
  </div>
);

const FilterSection = ({ filters, activeFilter, onFilterChange }: { filters: Category[]; activeFilter: string; onFilterChange: (id: string) => void }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
    <div className="flex gap-2 overflow-x-auto min-w-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        onClick={() => onFilterChange('all')}
        className={`px-4 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap shrink-0 ${
          activeFilter === 'all'
            ? 'bg-secondary text-secondary-foreground border-secondary' 
            : 'bg-card text-muted-foreground border-border hover:bg-muted/50'
        } transition-colors`}
      >
        All
      </button>
      {filters.map(filter => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap shrink-0 ${
            activeFilter === filter.id
              ? 'bg-secondary text-secondary-foreground border-secondary' 
              : 'bg-card text-muted-foreground border-border hover:bg-muted/50'
          } transition-colors`}
        >
          {filter.name}
        </button>
      ))}
    </div>
    <div className="flex bg-card border border-border rounded-[var(--radius)] overflow-hidden shrink-0">
      <button className="p-2 border-r border-border text-muted-foreground hover:bg-muted/50"><LayoutGrid className="w-4 h-4" /></button>
      <button className="p-2 border-r border-border bg-secondary/50 text-foreground"><List className="w-4 h-4" /></button>
      <button className="p-2 text-muted-foreground hover:bg-muted/50"><MapPin className="w-4 h-4" /></button>
    </div>
  </div>
);

interface InventoryTableProps {
  items: InventoryItem[];
  selectedItemId: string | null;
  onRowClick: (id: string) => void;
}

const InventoryTable = ({ items, selectedItemId, onRowClick }: InventoryTableProps) => (
  <div className="bg-card border border-border rounded-[var(--radius)] overflow-x-auto shadow-sm w-full">
    <table className="w-full text-sm text-left min-w-[700px]">
      <thead className="text-xs font-semibold text-muted-foreground uppercase border-b border-border bg-card">
        <tr>
          <th className="px-6 py-4">ITEM</th>
          <th className="px-6 py-4">SKU</th>
          <th className="px-6 py-4">CATEGORY</th>
          <th className="px-6 py-4">LOCATION</th>
          <th className="px-6 py-4 text-right">QTY</th>
        </tr>
      </thead>
      <tbody>
        {items.map((row) => {
          const Icon = getItemIcon(row.category);
          const isCritical = row.status === 'out_of_stock';
          const isWarning = row.status === 'low_stock';
          const isSelected = selectedItemId === row.id;
          
          return (
            <tr 
              key={row.id} 
              onClick={() => onRowClick(row.id)}
              className={`border-b border-border relative cursor-pointer hover:bg-muted/30 transition-colors ${
                isSelected ? 'bg-muted/50' : ''
              } ${isCritical && !isSelected ? 'bg-destructive/5' : ''} ${isWarning && !isSelected ? 'bg-[#F5A623]/5' : ''}`}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                isCritical ? 'bg-destructive' : isWarning ? 'bg-[#F5A623]' : 'bg-transparent'
              }`} />
              
              <td className="px-6 py-4 flex items-center gap-3">
                <div className={`p-2 rounded-[var(--radius)] shrink-0 ${isCritical ? 'bg-destructive/10 text-destructive' : isWarning ? 'bg-[#F5A623]/10 text-[#F5A623]' : 'bg-muted text-muted-foreground'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-medium text-foreground flex items-center gap-2 truncate">
                  {row.name}
                  {isCritical && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
                </span>
              </td>
              <td className="px-6 py-4 text-muted-foreground font-mono whitespace-nowrap">{row.sku}</td>
              <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{row.category}</td>
              <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">{row.location}</td>
              <td className={`px-6 py-4 text-right font-semibold ${isCritical ? 'text-destructive' : isWarning ? 'text-[#F5A623]' : 'text-foreground'}`}>
                {row.qty}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

const ReorderSidebar = ({ items, onClose }: { items: ReorderItem[]; onClose: () => void }) => {
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.id, true]))
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.recommendedOrder]))
  );

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const estimatedTotal = items
    .filter((i) => selected[i.id])
    .reduce((sum, i) => sum + (quantities[i.id] || 0) * i.unitCost, 0);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-background border-l border-border shadow-2xl z-50 p-6 flex flex-col animate-in slide-in-from-right duration-300">
        
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#F5A623]" />
            <h2 className="text-lg font-semibold text-foreground">Reorder alerts</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2">
          {items.map(item => (
            <div key={item.id} className="border border-border rounded-[var(--radius)] p-3 bg-muted/20">
              <div className="flex justify-between items-start mb-2 gap-2">
                <h4 className="font-medium text-sm text-foreground leading-tight">{item.name}</h4>
                <input
                  type="checkbox"
                  checked={selected[item.id] ?? true}
                  onChange={() => setSelected(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                  className="accent-primary w-4 h-4 rounded border-border shrink-0"
                />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Cur: <strong className={item.current === 0 ? 'text-destructive' : 'text-[#F5A623]'}>{item.current}</strong></span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">+</span>
                  <input 
                    type="number" 
                    value={quantities[item.id] ?? item.recommendedOrder}
                    onChange={(e) => setQuantities(prev => ({ ...prev, [item.id]: parseInt(e.target.value) || 0 }))}
                    className="w-14 text-center border border-border rounded bg-card py-1 text-foreground"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4 mt-auto">
          <div className="flex justify-between items-center mb-4 text-sm">
            <span className="text-muted-foreground">{selectedCount} selected</span>
            <span className="text-foreground">Est. total: <strong>PKR {estimatedTotal.toLocaleString()}</strong></span>
          </div>
          <button className="w-full py-2.5 bg-secondary text-secondary-foreground font-medium rounded-[var(--radius)] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm">
            Generate PO <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </>
  );
};

const ItemDetailsSidebar = ({ item, onClose }: { item: InventoryItem; onClose: () => void }) => {
  const Icon = getItemIcon(item.category);
  const isCritical = item.status === 'out_of_stock';
  const isWarning = item.status === 'low_stock';

  const percent = item.stockLevelPercent;
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-background border-l border-border shadow-2xl z-50 p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
        
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Item Details</h2>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 shadow-sm w-full">
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-3 rounded-[var(--radius)] shrink-0 ${isCritical ? 'bg-destructive/10 text-destructive' : isWarning ? 'bg-[#F5A623]/10 text-[#F5A623]' : 'bg-primary/10 text-primary'}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
              <span className="inline-block mt-1 px-2 py-0.5 bg-muted text-muted-foreground text-xs font-mono rounded-[var(--radius)] border border-border">
                {item.sku}
              </span>
            </div>
          </div>
          
          <div className="border-t border-border pt-6 grid grid-cols-[auto_1fr] gap-6 items-center">
            
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg className="w-full h-full absolute inset-0 -rotate-90 transform" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className="stroke-muted fill-none"
                  strokeWidth="6"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className={`fill-none opacity-80 ${isCritical ? 'stroke-destructive' : isWarning ? 'stroke-[#F5A623]' : 'stroke-primary'}`}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-xs font-semibold text-foreground relative z-10">{percent}%</span>
            </div>
            
            <div className="text-sm space-y-2 min-w-0">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Supplier</span>
                <span className="font-medium text-foreground truncate">{item.supplier}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Unit cost</span>
                <span className="font-medium text-foreground truncate">PKR {item.unitCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Lead time</span>
                <span className="font-medium text-foreground truncate">{item.leadTime}</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </>
  );
};

export default function InventoryDashboard() {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isReorderOpen, setIsReorderOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reorderItems, setReorderItems] = useState<ReorderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [totalItems, setTotalItems] = useState(0);
  const [totalSkuCount, setTotalSkuCount] = useState(0);
  const [locationCount, setLocationCount] = useState(0);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await apiClient.get('/inventory/dashboard');
      const data = res.data.data;
      setDashboardStats(data);
      setTotalSkuCount(data.totalSkuCount);
      setLocationCount(data.locationCount);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    }
  }, []);

  const fetchItems = useCallback(async (categoryId?: string) => {
    try {
      const params: Record<string, string> = { limit: '100' };
      if (categoryId && categoryId !== 'all') params.categoryId = categoryId;
      const res = await apiClient.get('/inventory', { params });
      setItems(res.data.data.items);
      setTotalItems(res.data.data.total);
    } catch (err) {
      console.error('Failed to fetch items', err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiClient.get('/inventory/categories', { params: { limit: '100' } });
      setCategories(res.data.data.categories);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  }, []);

  const fetchReorderItems = useCallback(async () => {
    try {
      const res = await apiClient.get('/inventory/reorder');
      setReorderItems(res.data.data);
    } catch (err) {
      console.error('Failed to fetch reorder items', err);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetchDashboard(),
      fetchItems(),
      fetchCategories(),
      fetchReorderItems(),
    ]).finally(() => setLoading(false));
  }, [fetchDashboard, fetchItems, fetchCategories, fetchReorderItems]);

  const selectedItem = items.find(item => item.id === selectedItemId) || null;

  const handleOpenReorder = () => {
    setSelectedItemId(null);
    setIsReorderOpen(true);
  };

  const handleRowClick = (id: string) => {
    setIsReorderOpen(false);
    setSelectedItemId(id);
  };

  const handleFilterChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    fetchItems(categoryId !== 'all' ? categoryId : undefined);
  };

  if (loading) {
    return (
      <div className="w-full bg-background min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-background min-h-screen flex items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-background min-h-screen">
      <div className="w-full max-w-[1600px] mx-auto relative">
        
        <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-6 pb-4 border-b border-border">
          <div className="min-w-0">
            <nav className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <span>Operations</span>
              <ChevronDown className="w-3 h-3 -rotate-90" />
              <span className="text-foreground">Inventory</span>
            </nav>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-xl font-bold text-foreground">Inventory management</h1>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {totalSkuCount.toLocaleString()} SKUs • {locationCount} locations • {new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}
              </span>
            </div>
          </div>
          <HeaderActions onOpenReorder={handleOpenReorder} reorderCount={reorderItems.length} />
        </header>

        <div className="pb-12 w-full">
          {dashboardStats && <StatsCard stats={dashboardStats} />}
          <FilterSection filters={categories} activeFilter={activeCategory} onFilterChange={handleFilterChange} />
          <InventoryTable 
            items={items} 
            selectedItemId={selectedItemId}
            onRowClick={handleRowClick} 
          />
        </div>
        
      </div>

      {isReorderOpen && (
        <ReorderSidebar 
          items={reorderItems} 
          onClose={() => setIsReorderOpen(false)} 
        />
      )}

      {selectedItem && (
        <ItemDetailsSidebar 
          item={selectedItem} 
          onClose={() => setSelectedItemId(null)} 
        />
      )}
    </div>
  );
}