"use client";

import React, { useState, useEffect, useCallback, useRef, FormEvent } from 'react';
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
  Search,
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

const LocationDropdown = ({
  selectedLocation,
  onLocationChange,
}: {
  selectedLocation: string;
  onLocationChange: (location: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [customLocations, setCustomLocations] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const LOCATIONS_STORAGE_KEY = 'inventory_custom_locations';

  useEffect(() => {
    const stored = localStorage.getItem(LOCATIONS_STORAGE_KEY);
    if (stored) {
      try { setCustomLocations(JSON.parse(stored)); } catch { /* ignore */ }
    }
    apiClient.get('/inventory/locations').then(res => {
      setLocations(res.data.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setNewLocation('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddLocation = () => {
    if (!newLocation.trim()) return;
    const updated = [...new Set([...customLocations, newLocation.trim()])];
    setCustomLocations(updated);
    localStorage.setItem(LOCATIONS_STORAGE_KEY, JSON.stringify(updated));
    onLocationChange(newLocation.trim());
    setIsAdding(false);
    setNewLocation('');
    setIsOpen(false);
  };

  const allLocations = [...new Set([...locations, ...customLocations])];
  const displayName = selectedLocation || 'All Locations';

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-[var(--radius)] text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        {displayName} <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-card border border-border rounded-[var(--radius)] shadow-lg z-30 py-1">
          <button
            onClick={() => { onLocationChange(''); setIsOpen(false); }}
            className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${!selectedLocation ? 'bg-muted/30 font-medium' : ''}`}
          >
            All Locations
          </button>
          {allLocations.map(loc => (
            <button
              key={loc}
              onClick={() => { onLocationChange(loc); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors ${selectedLocation === loc ? 'bg-muted/30 font-medium' : ''}`}
            >
              {loc}
            </button>
          ))}
          <div className="border-t border-border my-1" />
          {isAdding ? (
            <div className="px-3 py-2 flex gap-2">
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                placeholder="Location name"
                className="flex-1 px-2 py-1 text-xs border border-border rounded bg-background text-foreground"
                autoFocus
              />
              <button onClick={handleAddLocation} className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90">
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-muted/50 transition-colors"
            >
              + Add location
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const AddItemModal = ({
  isOpen,
  onClose,
  categories,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSuccess: () => void;
}) => {
  const [form, setForm] = useState({
    name: '', sku: '', categoryId: '', location: '', qty: 0,
    minStockLevel: 10, maxStockLevel: 100, supplier: '', unitCost: 0, leadTime: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.sku || !form.categoryId || !form.supplier || !form.leadTime) return;
    setSubmitting(true);
    try {
      await apiClient.post('/inventory', {
        ...form,
        unitCost: Number(form.unitCost),
        qty: Number(form.qty),
        minStockLevel: Number(form.minStockLevel),
        maxStockLevel: Number(form.maxStockLevel),
      });
      onSuccess();
      onClose();
      setForm({ name: '', sku: '', categoryId: '', location: '', qty: 0, minStockLevel: 10, maxStockLevel: 100, supplier: '', unitCost: 0, leadTime: '' });
    } catch (err) {
      console.error('Failed to create item', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Add Inventory Item</h2>
            <button onClick={onClose} className="p-1 -mr-1 text-muted-foreground hover:text-foreground rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} required className="w-full px-3 py-2 text-sm border border-border rounded-[var(--radius)] bg-card text-foreground" placeholder="Item name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">SKU *</label>
                <input type="text" value={form.sku} onChange={e => setForm(p => ({...p, sku: e.target.value}))} required className="w-full px-3 py-2 text-sm border border-border rounded-[var(--radius)] bg-card text-foreground" placeholder="e.g. ITM-001" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Category *</label>
                <select value={form.categoryId} onChange={e => setForm(p => ({...p, categoryId: e.target.value}))} required className="w-full px-3 py-2 text-sm border border-border rounded-[var(--radius)] bg-card text-foreground">
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Location</label>
                <input type="text" value={form.location} onChange={e => setForm(p => ({...p, location: e.target.value}))} className="w-full px-3 py-2 text-sm border border-border rounded-[var(--radius)] bg-card text-foreground" placeholder="e.g. HQ - Floor 3" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Supplier *</label>
                <input type="text" value={form.supplier} onChange={e => setForm(p => ({...p, supplier: e.target.value}))} required className="w-full px-3 py-2 text-sm border border-border rounded-[var(--radius)] bg-card text-foreground" placeholder="Supplier name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Lead time *</label>
                <input type="text" value={form.leadTime} onChange={e => setForm(p => ({...p, leadTime: e.target.value}))} required className="w-full px-3 py-2 text-sm border border-border rounded-[var(--radius)] bg-card text-foreground" placeholder="e.g. 2-3 weeks" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity</label>
                <input type="number" value={form.qty} onChange={e => setForm(p => ({...p, qty: Number(e.target.value)}))} min="0" className="w-full px-3 py-2 text-sm border border-border rounded-[var(--radius)] bg-card text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Unit cost (PKR) *</label>
                <input type="number" value={form.unitCost || ''} onChange={e => setForm(p => ({...p, unitCost: Number(e.target.value)}))} required min="0" step="0.01" className="w-full px-3 py-2 text-sm border border-border rounded-[var(--radius)] bg-card text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Min stock level</label>
                <input type="number" value={form.minStockLevel} onChange={e => setForm(p => ({...p, minStockLevel: Number(e.target.value)}))} min="0" className="w-full px-3 py-2 text-sm border border-border rounded-[var(--radius)] bg-card text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Max stock level</label>
                <input type="number" value={form.maxStockLevel} onChange={e => setForm(p => ({...p, maxStockLevel: Number(e.target.value)}))} min="0" className="w-full px-3 py-2 text-sm border border-border rounded-[var(--radius)] bg-card text-foreground" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium border border-border rounded-[var(--radius)] hover:bg-muted/50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-[var(--radius)] hover:opacity-90 transition-opacity disabled:opacity-50">
                {submitting ? 'Creating...' : 'Create Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

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

const FilterSection = ({ filters, activeFilter, onFilterChange, viewMode, onViewModeChange }: {
  filters: Category[];
  activeFilter: string;
  onFilterChange: (id: string) => void;
  viewMode: 'grid' | 'list' | 'map';
  onViewModeChange: (mode: 'grid' | 'list' | 'map') => void;
}) => (
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
      <button
        onClick={() => onViewModeChange('grid')}
        className={`p-2 border-r border-border transition-colors ${viewMode === 'grid' ? 'bg-secondary/50 text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        className={`p-2 border-r border-border transition-colors ${viewMode === 'list' ? 'bg-secondary/50 text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => onViewModeChange('map')}
        className={`p-2 transition-colors ${viewMode === 'map' ? 'bg-secondary/50 text-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
      >
        <MapPin className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const InventoryTable = ({ items, selectedItemId, onRowClick }: { items: InventoryItem[]; selectedItemId: string | null; onRowClick: (id: string) => void }) => (
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

const InventoryGrid = ({ items, onItemClick }: { items: InventoryItem[]; onItemClick: (id: string) => void }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {items.map(item => {
      const Icon = getItemIcon(item.category);
      const isCritical = item.status === 'out_of_stock';
      const isWarning = item.status === 'low_stock';
      return (
        <div
          key={item.id}
          onClick={() => onItemClick(item.id)}
          className={`bg-card border border-border rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${isCritical ? 'border-destructive/30' : isWarning ? 'border-[#F5A623]/30' : ''}`}
        >
          <div className="flex items-start gap-3 mb-3">
            <div className={`p-2 rounded-[var(--radius)] ${isCritical ? 'bg-destructive/10 text-destructive' : isWarning ? 'bg-[#F5A623]/10 text-[#F5A623]' : 'bg-muted text-muted-foreground'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-foreground truncate flex items-center gap-1">
                {item.name}
                {isCritical && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />}
              </p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{item.sku}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {item.location}
            </span>
            <span className={`text-sm font-semibold ${isCritical ? 'text-destructive' : isWarning ? 'text-[#F5A623]' : 'text-foreground'}`}>
              {item.qty}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);

const InventoryMapView = ({ items, onItemClick }: { items: InventoryItem[]; onItemClick: (id: string) => void }) => {
  const grouped = items.reduce<Record<string, InventoryItem[]>>((acc, item) => {
    const loc = item.location || 'Unassigned';
    if (!acc[loc]) acc[loc] = [];
    acc[loc].push(item);
    return acc;
  }, {});

  const sortedLocations = Object.keys(grouped).sort();

  return (
    <div className="space-y-6">
      {sortedLocations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">No items found for the selected location filter.</div>
      )}
      {sortedLocations.map(location => (
        <div key={location}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-sm text-foreground">{location}</h3>
            <span className="text-xs text-muted-foreground">({grouped[location].length} items)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {grouped[location].map(item => {
              const Icon = getItemIcon(item.category);
              const isCritical = item.status === 'out_of_stock';
              const isWarning = item.status === 'low_stock';
              return (
                <div
                  key={item.id}
                  onClick={() => onItemClick(item.id)}
                  className={`bg-card border border-border rounded-xl p-3 cursor-pointer hover:shadow-md transition-all ${isCritical ? 'border-destructive/30' : isWarning ? 'border-[#F5A623]/30' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded ${isCritical ? 'bg-destructive/10 text-destructive' : isWarning ? 'bg-[#F5A623]/10 text-[#F5A623]' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-sm font-medium text-foreground truncate flex-1 flex items-center gap-1">
                      {item.name}
                      {isCritical && <AlertTriangle className="w-3 h-3 text-destructive shrink-0" />}
                    </p>
                    <span className={`text-xs font-semibold ${isCritical ? 'text-destructive' : isWarning ? 'text-[#F5A623]' : 'text-foreground'}`}>
                      {item.qty}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

const ReorderSidebar = ({ items, onClose }: { items: ReorderItem[]; onClose: () => void }) => {
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map((i) => [i.id, true]))
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(items.map((i) => [i.id, i.recommendedOrder]))
  );
  const [generating, setGenerating] = useState(false);
  const [poResult, setPoResult] = useState<{ poNumber: string; grandTotal: number } | null>(null);
  const [poError, setPoError] = useState<string | null>(null);

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const estimatedTotal = items
    .filter((i) => selected[i.id])
    .reduce((sum, i) => sum + (quantities[i.id] || 0) * i.unitCost, 0);

  const handleGeneratePO = async () => {
    const selectedItems = items.filter(i => selected[i.id]);
    if (selectedItems.length === 0) return;
    setPoError(null);
    setGenerating(true);
    try {
      const res = await apiClient.post('/inventory/purchase-order', {
        items: selectedItems.map(i => ({
          itemId: i.id,
          itemName: i.name,
          sku: i.sku,
          quantity: quantities[i.id] || i.recommendedOrder,
          unitCost: i.unitCost,
          totalCost: (quantities[i.id] || i.recommendedOrder) * i.unitCost,
        })),
      });
      setPoResult(res.data.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to generate PO. Check your connection and permissions.';
      setPoError(msg);
      console.error('Failed to generate PO', err);
    } finally {
      setGenerating(false);
    }
  };

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
        
        {poError && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-[var(--radius)] flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-destructive/20 text-destructive flex items-center justify-center shrink-0 mt-0.5">
              <X className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-destructive">PO Generation Failed</p>
              <p className="text-xs text-muted-foreground mt-0.5">{poError}</p>
            </div>
          </div>
        )}
        {poResult && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-[var(--radius)] flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
              <Package className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">PO Generated Successfully</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                PO <strong className="text-foreground font-mono">{poResult.poNumber}</strong> — PKR {poResult.grandTotal.toLocaleString()}
              </p>
            </div>
          </div>
        )}

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
          <button
            onClick={handleGeneratePO}
            disabled={generating || selectedCount === 0 || !!poResult}
            className="w-full py-2.5 bg-secondary text-secondary-foreground font-medium rounded-[var(--radius)] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm disabled:opacity-40"
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : poResult ? (
              <><Package className="w-4 h-4" /> PO Generated</>
            ) : (
              <>Generate PO <ArrowRight className="w-4 h-4" /></>
            )}
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
  const [selectedLocation, setSelectedLocation] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('list');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [isBarcodeSearch, setIsBarcodeSearch] = useState(false);
  const [barcodeQuery, setBarcodeQuery] = useState('');

  const fetchDashboard = useCallback(async (location?: string) => {
    try {
      const params: Record<string, string> = {};
      if (location) params.location = location;
      const res = await apiClient.get('/inventory/dashboard', { params });
      const data = res.data.data;
      setDashboardStats(data);
      setTotalSkuCount(data.totalSkuCount);
      setLocationCount(data.locationCount);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    }
  }, []);

  const fetchItems = useCallback(async (categoryId?: string, location?: string, search?: string) => {
    try {
      const params: Record<string, string> = { limit: '100' };
      if (categoryId && categoryId !== 'all') params.categoryId = categoryId;
      if (location) params.location = location;
      if (search) params.search = search;
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

  const refreshItems = useCallback((categoryId?: string, location?: string, search?: string) => {
    fetchItems(categoryId, location, search);
    fetchDashboard(location);
  }, [fetchItems, fetchDashboard]);

  const handleFilterChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    refreshItems(categoryId !== 'all' ? categoryId : undefined, selectedLocation || undefined);
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
    refreshItems(activeCategory !== 'all' ? activeCategory : undefined, location || undefined);
  };

  const handleViewModeChange = (mode: 'grid' | 'list' | 'map') => {
    setViewMode(mode);
  };

  const handleDownloadCSV = () => {
    if (items.length === 0) return;
    const headers = ['Name', 'SKU', 'Category', 'Location', 'Quantity', 'Min Stock', 'Max Stock', 'Supplier', 'Unit Cost', 'Lead Time', 'Status'];
    const csvContent = [
      headers.join(','),
      ...items.map(row =>
        `"${row.name}","${row.sku}","${row.category}","${row.location}",${row.qty},${row.minStockLevel},${row.maxStockLevel},"${row.supplier}",${row.unitCost},"${row.leadTime}","${row.status}"`
      ),
    ].join('\n');
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const displayItems = isBarcodeSearch && barcodeQuery.trim()
    ? items.filter(item => item.sku.toLowerCase().includes(barcodeQuery.toLowerCase()))
    : items;

  const handleRefresh = () => {
    refreshItems(activeCategory !== 'all' ? activeCategory : undefined, selectedLocation || undefined);
  };

  if (loading && items.length === 0) {
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
          <div className="flex flex-wrap items-center gap-3">
            <LocationDropdown
              selectedLocation={selectedLocation}
              onLocationChange={handleLocationChange}
            />
            <button
              onClick={handleOpenReorder}
              className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-[var(--radius)] text-sm font-medium hover:bg-muted/50 transition-colors shrink-0 relative"
            >
              <Bell className="w-4 h-4 text-[#F5A623]" /> 
              Reorders
              {reorderItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                  {reorderItems.length}
                </span>
              )}
            </button>
            <div className="flex gap-2 shrink-0">
              {isBarcodeSearch ? (
                <div className="flex items-center gap-1 bg-card border border-border rounded-[var(--radius)] px-2">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={barcodeQuery}
                    onChange={(e) => setBarcodeQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { setIsBarcodeSearch(false); setBarcodeQuery(''); }
                    }}
                    placeholder="Search by SKU..."
                    className="w-28 py-2 text-xs bg-transparent text-foreground outline-none border-none"
                    autoFocus
                  />
                  {barcodeQuery && (
                    <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                      {displayItems.length}
                    </span>
                  )}
                  <button
                    onClick={() => { setIsBarcodeSearch(false); setBarcodeQuery(''); }}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsBarcodeSearch(true)}
                  className="p-2 bg-card border border-border rounded-[var(--radius)] text-muted-foreground hover:text-foreground transition-colors"
                  title="Search by SKU"
                >
                  <Barcode className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={handleDownloadCSV}
                className="p-2 bg-card border border-border rounded-[var(--radius)] text-muted-foreground hover:text-foreground transition-colors"
                title="Download as CSV"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => setShowAddItemModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-[var(--radius)] text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
            >
              <Plus className="w-4 h-4" /> Add item
            </button>
          </div>
        </header>

        <div className="pb-12 w-full">
          {dashboardStats && <StatsCard stats={dashboardStats} />}
          <FilterSection
            filters={categories}
            activeFilter={activeCategory}
            onFilterChange={handleFilterChange}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          />
          {viewMode === 'list' && (
            <InventoryTable
              items={displayItems}
              selectedItemId={selectedItemId}
              onRowClick={handleRowClick}
            />
          )}
          {viewMode === 'grid' && (
            <InventoryGrid items={displayItems} onItemClick={handleRowClick} />
          )}
          {viewMode === 'map' && (
            <InventoryMapView items={displayItems} onItemClick={handleRowClick} />
          )}
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

      <AddItemModal
        isOpen={showAddItemModal}
        onClose={() => setShowAddItemModal(false)}
        categories={categories}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
