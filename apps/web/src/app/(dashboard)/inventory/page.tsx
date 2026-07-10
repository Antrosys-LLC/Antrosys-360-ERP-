"use client";

import React, { useState } from 'react';
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
  X
} from 'lucide-react';

// ============================================================================
// MOCK DATA
// ============================================================================

const dashboardStats = {
  totalValue: '18,420,000',
  lowStock: 14,
  outOfStock: 3,
  turnoverRatio: '4.2x'
};

const filterCategories = [
  { id: 'all', label: 'All', active: true },
  { id: 'office', label: 'Office equipment', active: false },
  { id: 'hardware', label: 'IT hardware', active: false },
  { id: 'furniture', label: 'Furniture', active: false },
  { id: 'consumables', label: 'Consumables', active: false },
];

const inventoryItems = [
  { 
    id: 1, name: 'MacBook Pro 14"', sku: 'IT-MBP-14', category: 'IT hardware', location: 'HQ - Floor 3', qty: 4, status: 'warning', icon: Laptop,
    details: { supplier: 'TechStore Pk', unitCost: '550,000', leadTime: '14 days', stockLevelPercent: 20 } 
  },
  { 
    id: 2, name: 'Logitech MX Master 3S', sku: 'IT-PER-MX3', category: 'IT hardware', location: 'Branch A', qty: 0, status: 'critical', hasAlert: true, icon: Mouse,
    details: { supplier: 'LogiDist PK', unitCost: '25,000', leadTime: '7 days', stockLevelPercent: 0 } 
  },
  { 
    id: 3, name: 'Ergo Office Chair V2', sku: 'FN-CHR-E2', category: 'Furniture', location: 'HQ - Storage', qty: 45, status: 'normal', icon: Armchair,
    details: { supplier: 'Furnishings Co.', unitCost: '35,000', leadTime: '21 days', stockLevelPercent: 85 } 
  },
  { 
    id: 4, name: 'A4 Notebooks (Ruled)', sku: 'CS-NB-A4', category: 'Consumables', location: 'Branch B', qty: 340, status: 'normal', icon: Book,
    details: { supplier: 'Stationery Hub', unitCost: '850', leadTime: '3 days', stockLevelPercent: 60 } 
  },
  { 
    id: 5, name: 'HP LaserJet Toner Black', sku: 'CS-TN-HPB', category: 'Consumables', location: 'HQ - Storage', qty: 18, status: 'normal', icon: Printer,
    details: { supplier: 'TechStore Pk', unitCost: '14,500', leadTime: '5 days', stockLevelPercent: 45 } 
  },
];

const reorderRecommendations = [
  { id: 1, name: 'MacBook Pro 14"', current: 4, toAdd: 10, selected: true },
  { id: 2, name: 'Logitech MX Master', current: 0, toAdd: 20, selected: true },
  { id: 3, name: 'Dell U2720Q Monitor', current: 2, toAdd: 5, selected: true },
];

// ============================================================================
// COMPONENTS
// ============================================================================

const HeaderActions = ({ onOpenReorder }: { onOpenReorder: () => void }) => (
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
      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
        3
      </span>
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

const StatsCard = ({ stats }: { stats: typeof dashboardStats }) => (
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
      <div className="h-full bg-[#7C3AED] rounded-full" style={{ width: '70%' }} />
      <div className="h-full bg-[#F5A623] rounded-full" style={{ width: '15%' }} />
      <div className="h-full bg-destructive rounded-full" style={{ width: '5%' }} />
      <div className="h-full bg-[#60A5FA] rounded-full" style={{ width: '10%' }} />
    </div>
  </div>
);

const FilterSection = ({ filters }: { filters: typeof filterCategories }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
    <div className="flex gap-2 overflow-x-auto min-w-0 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {filters.map(filter => (
        <button
          key={filter.id}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap shrink-0 ${
            filter.active 
              ? 'bg-secondary text-secondary-foreground border-secondary' 
              : 'bg-card text-muted-foreground border-border hover:bg-muted/50'
          } transition-colors`}
        >
          {filter.label}
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
  items: typeof inventoryItems;
  selectedItemId: number | null;
  onRowClick: (id: number) => void;
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
          const Icon = row.icon;
          const isCritical = row.status === 'critical';
          const isWarning = row.status === 'warning';
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
                  {row.hasAlert && <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />}
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

// ============================================================================
// SIDEBAR COMPONENTS
// ============================================================================

const ReorderSidebar = ({ items, onClose }: { items: typeof reorderRecommendations, onClose: () => void }) => {
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
                <input type="checkbox" defaultChecked={item.selected} className="accent-primary w-4 h-4 rounded border-border shrink-0" />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Cur: <strong className={item.current === 0 ? 'text-destructive' : 'text-[#F5A623]'}>{item.current}</strong></span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">+</span>
                  <input 
                    type="number" 
                    defaultValue={item.toAdd} 
                    className="w-14 text-center border border-border rounded bg-card py-1 text-foreground"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-4 mt-auto">
          <div className="flex justify-between items-center mb-4 text-sm">
            <span className="text-muted-foreground">3 selected</span>
            <span className="text-foreground">Est. total: <strong>PKR 7,762,500</strong></span>
          </div>
          <button className="w-full py-2.5 bg-secondary text-secondary-foreground font-medium rounded-[var(--radius)] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm">
            Generate PO <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </>
  );
};

const ItemDetailsSidebar = ({ item, onClose }: { item: typeof inventoryItems[0], onClose: () => void }) => {
  const Icon = item.icon;
  const isCritical = item.status === 'critical';
  const isWarning = item.status === 'warning';

  // Mathematical variables for accurate SVG circle rendering
  const percent = item.details.stockLevelPercent;
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
            
            {/* ACCURATE SVG CIRCULAR PROGRESS INDICATOR */}
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
                <span className="font-medium text-foreground truncate">{item.details.supplier}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Unit cost</span>
                <span className="font-medium text-foreground truncate">{item.details.unitCost}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground shrink-0">Lead time</span>
                <span className="font-medium text-foreground truncate">{item.details.leadTime}</span>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </>
  );
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function InventoryDashboard() {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [isReorderOpen, setIsReorderOpen] = useState(false);

  const selectedItem = inventoryItems.find(item => item.id === selectedItemId);

  const handleOpenReorder = () => {
    setSelectedItemId(null);
    setIsReorderOpen(true);
  };

  const handleRowClick = (id: number) => {
    setIsReorderOpen(false);
    setSelectedItemId(id);
  };

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
                1,247 SKUs • 3 locations • May 2026
              </span>
            </div>
          </div>
          <HeaderActions onOpenReorder={handleOpenReorder} />
        </header>

        <div className="pb-12 w-full">
          <StatsCard stats={dashboardStats} />
          <FilterSection filters={filterCategories} />
          <InventoryTable 
            items={inventoryItems} 
            selectedItemId={selectedItemId}
            onRowClick={handleRowClick} 
          />
        </div>
        
      </div>

      {isReorderOpen && (
        <ReorderSidebar 
          items={reorderRecommendations} 
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