import React from 'react';
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
  ArrowRight
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
  { id: 1, name: 'MacBook Pro 14"', sku: 'IT-MBP-14', category: 'IT hardware', location: 'HQ - Floor 3', qty: 4, status: 'warning', icon: Laptop },
  { id: 2, name: 'Logitech MX Master 3S', sku: 'IT-PER-MX3', category: 'IT hardware', location: 'Branch A', qty: 0, status: 'critical', hasAlert: true, icon: Mouse },
  { id: 3, name: 'Ergo Office Chair V2', sku: 'FN-CHR-E2', category: 'Furniture', location: 'HQ - Storage', qty: 45, status: 'normal', icon: Armchair },
  { id: 4, name: 'A4 Notebooks (Ruled)', sku: 'CS-NB-A4', category: 'Consumables', location: 'Branch B', qty: 340, status: 'normal', icon: Book },
  { id: 5, name: 'HP LaserJet Toner Black', sku: 'CS-TN-HPB', category: 'Consumables', location: 'HQ - Storage', qty: 18, status: 'normal', icon: Printer },
];

const reorderRecommendations = [
  { id: 1, name: 'MacBook Pro 14"', current: 4, toAdd: 10, selected: true },
  { id: 2, name: 'Logitech MX Master', current: 0, toAdd: 20, selected: true },
  { id: 3, name: 'Dell U2720Q Monitor', current: 2, toAdd: 5, selected: true },
];

const itemDetails = {
  name: 'MacBook Pro 14"',
  sku: 'IT-MBP-14',
  supplier: 'TechStore Pk',
  unitCost: '550,000',
  leadTime: '14 days',
  stockLevelPercent: 20
};

// ============================================================================
// COMPONENTS
// ============================================================================

const HeaderActions = () => (
  <div className="flex flex-wrap items-center gap-3">
    <button className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-[var(--radius)] text-sm font-medium hover:bg-muted/50 transition-colors shrink-0">
      All Locations <ChevronDown className="w-4 h-4 text-muted-foreground" />
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
  <div className="bg-card border border-border rounded-[var(--radius)] p-6 shadow-sm w-full">
    {/* Switched to grid-cols-2 on medium screens, 4 on extra large, removed right borders to prevent squishing */}
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-y-6 gap-x-4 mb-6">
      
      <div className="flex flex-col min-w-0">
        <p className="text-sm font-medium text-muted-foreground mb-1 truncate">Total stock value</p>
        <div className="flex items-baseline gap-1 truncate">
          <span className="text-sm font-medium text-muted-foreground">PKR</span>
          <span className="text-2xl font-semibold text-foreground truncate" title={stats.totalValue}>
            {stats.totalValue}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col min-w-0 xl:pl-4 xl:border-l border-border">
        <p className="text-sm font-medium text-muted-foreground mb-1 truncate">Low stock alerts</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#F5A623] shrink-0" />
          <span className="text-2xl font-semibold text-foreground truncate">{stats.lowStock}</span>
        </div>
      </div>
      
      <div className="flex flex-col min-w-0 xl:pl-4 xl:border-l border-border">
        <p className="text-sm font-medium text-muted-foreground mb-1 truncate">Out of stock</p>
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-destructive text-destructive text-lg font-semibold shrink-0">
          {stats.outOfStock}
        </div>
      </div>
      
      <div className="flex flex-col min-w-0 xl:pl-4 xl:border-l border-border">
        <p className="text-sm font-medium text-muted-foreground mb-1 truncate">Turnover ratio</p>
        <span className="text-2xl font-semibold text-foreground truncate">{stats.turnoverRatio}</span>
      </div>

    </div>
    
    {/* Segmented Progress Bar */}
    <div className="h-2 w-full flex gap-1 rounded-full overflow-hidden">
      <div className="h-full bg-primary" style={{ width: '65%' }} />
      <div className="h-full bg-[#F5A623]" style={{ width: '20%' }} />
      <div className="h-full bg-destructive" style={{ width: '5%' }} />
      <div className="h-full bg-[#4A90E2]" style={{ width: '10%' }} />
    </div>
  </div>
);

const FilterSection = ({ filters }: { filters: typeof filterCategories }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 mt-6">
    <div className="flex gap-2 flex-wrap">
      {filters.map(filter => (
        <button
          key={filter.id}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
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

const InventoryTable = ({ items }: { items: typeof inventoryItems }) => (
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
          
          return (
            <tr key={row.id} className={`border-b border-border relative ${isCritical ? 'bg-destructive/5' : isWarning ? 'bg-[#F5A623]/5' : ''}`}>
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

const ReorderRecommendations = ({ items }: { items: typeof reorderRecommendations }) => (
  <div className="bg-card border border-border rounded-[var(--radius)] p-5 shadow-sm w-full">
    <div className="flex items-center gap-2 mb-4">
      <Bell className="w-5 h-5 text-[#F5A623] shrink-0" />
      <h3 className="font-semibold text-foreground">Reorder recommendations</h3>
    </div>
    
    <div className="space-y-3 mb-6">
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

    <div className="border-t border-border pt-4">
      <div className="flex justify-between items-center mb-4 text-sm">
        <span className="text-muted-foreground">5 selected</span>
        <span className="text-foreground">Est. total: <strong>PKR 7,762,500</strong></span>
      </div>
      <button className="w-full py-2 bg-secondary text-secondary-foreground font-medium rounded-[var(--radius)] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-sm">
        Generate PO <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  </div>
);

const ItemDetails = ({ details }: { details: typeof itemDetails }) => (
  <div className="bg-card border border-border rounded-[var(--radius)] p-5 shadow-sm w-full">
    <div className="flex items-start gap-4 mb-6">
      <div className="p-3 bg-[#F5A623]/10 text-[#F5A623] rounded-[var(--radius)] shrink-0">
        <Laptop className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-foreground truncate">{details.name}</h3>
        <span className="inline-block mt-1 px-2 py-0.5 bg-muted text-muted-foreground text-xs font-mono rounded-[var(--radius)] border border-border">
          {details.sku}
        </span>
      </div>
    </div>
    
    <div className="border-t border-border pt-6 grid grid-cols-[auto_1fr] gap-6 items-center">
      <div className="relative w-16 h-16 rounded-full border-4 border-muted flex items-center justify-center shrink-0">
        <div className="absolute inset-0 rounded-full border-4 border-[#F5A623] opacity-50" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }} />
        <span className="text-xs font-semibold text-foreground">{details.stockLevelPercent}%</span>
      </div>
      
      <div className="text-sm space-y-2 min-w-0">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground shrink-0">Supplier</span>
          <span className="font-medium text-foreground truncate">{details.supplier}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground shrink-0">Unit cost</span>
          <span className="font-medium text-foreground truncate">{details.unitCost}</span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground shrink-0">Lead time</span>
          <span className="font-medium text-foreground truncate">{details.leadTime}</span>
        </div>
      </div>
    </div>
  </div>
);

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function InventoryDashboard() {
  return (
    // Removed `.erp-content` to prevent double-margining since your root app wrapper likely handles it.
    <div className="w-full bg-background">
      <div className="w-full max-w-[1600px] mx-auto">
        
        {/* Page Header */}
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
          
          <HeaderActions />
        </header>

        {/* Main Layout Grid - Changed lg:flex-row to xl:flex-row so sidebars drop down smoothly on standard screens */}
        <div className="flex flex-col xl:flex-row gap-6">
          
          {/* Left Column - Main Content */}
          <div className="flex-1 flex flex-col min-w-0 w-full">
            <StatsCard stats={dashboardStats} />
            <FilterSection filters={filterCategories} />
            <InventoryTable items={inventoryItems} />
          </div>

          {/* Right Column - Sidebars */}
          <aside className="w-full xl:w-[340px] flex flex-col md:flex-row xl:flex-col gap-6 shrink-0">
            <ReorderRecommendations items={reorderRecommendations} />
            <ItemDetails details={itemDetails} />
          </aside>
          
        </div>
        
      </div>
    </div>
  );
}