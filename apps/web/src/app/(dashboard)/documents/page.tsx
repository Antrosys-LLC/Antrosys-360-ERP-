"use client";

import React, { useState, useMemo } from "react";
import { 
  Folder, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Search, 
  SlidersHorizontal, 
  Grid, 
  List, 
  Upload, 
  Bell, 
  Download, 
  Share2, 
  MoreHorizontal, 
  X, 
  CheckCircle2, 
  MessageSquare, 
  User, 
  Lock,
  Plus,
  Info
} from "lucide-react";

/* ==========================================================================
   REALISTIC MOCK DATA STRUCTURES
   ========================================================================== */
const INITIAL_DIRECTORIES = [
  { id: "finance", name: "Finance", hasChildren: true, path: "Finance" },
  { 
    id: "hr-people", 
    name: "HR & People", 
    hasChildren: true, 
    path: "HR & People",
    children: [
      { id: "all-hr", name: "Overview Documents", path: "HR & People / Overview" },
      { 
        id: "contracts", 
        name: "Contracts", 
        path: "HR & People / Contracts",
        children: [
          { id: "employment-conts", name: "Employment conts", path: "HR & People / Contracts / Employment conts" },
          { id: "vendor-agreements", name: "Vendor agreements", path: "HR & People / Contracts / Vendor agreements" },
        ]
      },
      { id: "confidential-hr", name: "Confidential HR", path: "HR & People / Confidential HR", isLocked: true },
    ]
  },
  { id: "operations", name: "Operations", hasChildren: true, path: "Operations" },
];

const MOCK_FILES = [
  {
    id: "HR-23-0891",
    name: "Sara Javed contract",
    type: "PDF",
    size: "2.4 MB",
    isConfidential: true,
    updatedAt: "2 hrs ago",
    createdAt: "Oct 12, 2023",
    createdBy: "HR System",
    modifiedAt: "Today, 08:41 AM",
    modifiedBy: "John Doe",
    location: "HR & People / Contracts",
    folderId: "contracts",
    previewText: "EMPLOYMENT AGREEMENT entry code 4091. This document certifies the contractual standing of internal software engineering systems operations personnel..."
  },
  {
    id: "VN-23-0112",
    name: "Q3 Vendor Agreement",
    type: "PDF",
    size: "1.1 MB",
    isConfidential: false,
    updatedAt: "Updated yesterday",
    createdAt: "Oct 11, 2023",
    createdBy: "Finance System",
    modifiedAt: "Yesterday, 04:15 PM",
    modifiedBy: "Sarah Jenkins",
    location: "HR & People / Contracts",
    folderId: "contracts",
    previewText: "VENDOR SERVICE LEVEL AGREEMENT (SLA). Clauses defined underneath section 4(b) outline explicit runtime expectations and server multi-tenant parameters..."
  },
  {
    id: "TMP-45-804",
    name: "Contract Template v4",
    type: "DOCX",
    size: "45 KB",
    isConfidential: false,
    updatedAt: "Updated Oct 12",
    createdAt: "Oct 10, 2023",
    createdBy: "Legal Admin",
    modifiedAt: "Oct 10, 2023",
    modifiedBy: "Legal Admin",
    location: "HR & People / Contracts",
    folderId: "contracts",
    previewText: "STANDARD SYSTEM BLANK TEMPLATE. Authorized reuse only. Please populate variable fields marked with double braces before passing downstream to client..."
  },
  {
    id: "FIN-26-001",
    name: "Q2 Financial Statements",
    type: "PDF",
    size: "4.8 MB",
    isConfidential: true,
    updatedAt: "Updated 3 days ago",
    createdAt: "May 15, 2026",
    createdBy: "Finance automated ledger",
    modifiedAt: "May 18, 2026",
    modifiedBy: "Haider Ali",
    location: "Finance",
    folderId: "finance",
    previewText: "BALANCE SHEETS & FISCAL REVENUES. Consolidated layout map across corporate structure accounts, balancing localized asset distribution matrix."
  }
];

const INITIAL_UPLOADS = [
  { id: 1, name: "ND_Agreement_Signed.pdf", size: "1.2 MB", progress: 100, isDone: true },
  { id: 2, name: "Bonus_Structure_2024.docx", size: "840 KB", progress: 68, isDone: false },
];

const MOCK_EMPLOYEES: Record<string, any> = {
  "Sara Javed contract": {
    name: "Zara Khan",
    role: "Director of Engineering",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    department: "Engineering",
    location: "Dubai, UAE",
    manager: "Dawood Akhtar",
    tenure: "3 yrs, 2 mos",
    directReports: [
      { name: "Omar Mirza", role: "Frontend Lead", initials: "OM" },
      { name: "Sara Javed", role: "Backend Lead", initials: "SJ", isActiveContext: true },
      { name: "Fawad Khan", role: "DevOps Manager", initials: "FK" },
    ]
  },
  "Q3 Vendor Agreement": {
    name: "Sarah Jenkins",
    role: "Procurement Lead",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop",
    department: "Finance Ops",
    location: "London, UK",
    manager: "CEO Office",
    tenure: "1 yr, 8 mos",
    directReports: [
      { name: "Alex Mercer", role: "Sourcing Associate", initials: "AM" }
    ]
  }
};

export default function DocumentVaultPage() {
  // State variables for core interactions
  const [selectedFile, setSelectedFile] = useState(MOCK_FILES[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("contracts");
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>("HR & People / Contracts");
  
  // Interface filters & layout states
  const [fileTypeFilter, setFileTypeFilter] = useState<string | null>("PDF");
  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(true);
  const [isUploadPanelCollapsed, setIsUploadPanelCollapsed] = useState(false);
  const [uploads, setUploads] = useState(INITIAL_UPLOADS);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ "hr-people": true, "contracts": true });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Toggle folder expansion tree
  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Switch active directory filtering
  const handleFolderSelect = (folderId: string, path: string) => {
    setSelectedFolderId(folderId);
    setSelectedFolderPath(path);
    
    // Auto select first file of that folder if available
    const folderFiles = MOCK_FILES.filter(f => f.folderId === folderId);
    if (folderFiles.length > 0) {
      setSelectedFile(folderFiles[0]);
    }
  };

  // Simulating localized ad-hoc uploads for demo functionality
  const handleSimulateUpload = () => {
    setIsUploadPanelOpen(true);
    setIsUploadPanelCollapsed(false);
    const newId = uploads.length + 1;
    const newUpload = {
      id: newId,
      name: `Signed_Document_Ref_${Math.floor(Math.random() * 900 + 100)}.pdf`,
      size: "1.4 MB",
      progress: 0,
      isDone: false
    };
    setUploads(prev => [...prev, newUpload]);

    // Interval animation tick simulation
    const interval = setInterval(() => {
      setUploads(currentUploads => 
        currentUploads.map(up => {
          if (up.id === newId) {
            const nextProgress = up.progress + 20;
            return {
              ...up,
              progress: nextProgress >= 100 ? 100 : nextProgress,
              isDone: nextProgress >= 100
            };
          }
          return up;
        })
      );
    }, 400);

    setTimeout(() => clearInterval(interval), 3000);
  };

  // Computes active dynamic file layout listing
  const filteredFiles = useMemo(() => {
    return MOCK_FILES.filter(file => {
      const matchesFolder = selectedFolderId ? file.folderId === selectedFolderId : true;
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) || file.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = fileTypeFilter ? file.type === fileTypeFilter : true;
      return matchesFolder && matchesSearch && matchesType;
    });
  }, [selectedFolderId, searchQuery, fileTypeFilter]);

  // Derived contextual employee side-panel mapping
  const currentEmployeeDetail = useMemo(() => {
    return MOCK_EMPLOYEES[selectedFile?.name] || MOCK_EMPLOYEES["Sara Javed contract"];
  }, [selectedFile]);

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20">
      
      {/* 1. DIRECTORIES DYNAMIC SIDEBAR */}
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex shrink-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Directories</span>
          <button className="p-1 rounded hover:bg-muted text-muted-foreground" title="Filter Settings">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
        
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto text-sm">
          {INITIAL_DIRECTORIES.map((dir) => {
            const isDirExpanded = expandedFolders[dir.id];
            return (
              <div key={dir.id} className="space-y-0.5">
                <div 
                  onClick={() => handleFolderSelect(dir.id, dir.path)}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition ${selectedFolderId === dir.id ? "bg-secondary text-secondary-foreground font-medium" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <button 
                      onClick={(e) => toggleFolderExpand(dir.id, e)} 
                      className="p-0.5 rounded hover:bg-muted-foreground/10 transition"
                    >
                      <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isDirExpanded ? "rotate-90" : ""}`} />
                    </button>
                    <Folder className={`h-4 w-4 shrink-0 ${selectedFolderId === dir.id ? "text-primary fill-primary/10" : ""}`} />
                    <span className="truncate">{dir.name}</span>
                  </div>
                </div>
                
                {dir.children && isDirExpanded && (
                  <div className="pl-4 space-y-0.5 border-l border-border/60 ml-3.5">
                    {dir.children.map((subDir) => {
                      const isSubExpanded = expandedFolders[subDir.id];
                      return (
                        <div key={subDir.id} className="space-y-0.5">
                          <div 
                            onClick={() => handleFolderSelect(subDir.id, subDir.path)}
                            className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer transition ${selectedFolderId === subDir.id ? "bg-secondary text-secondary-foreground font-semibold" : "text-muted-foreground hover:bg-muted"}`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {subDir.children ? (
                                <button onClick={(e) => toggleFolderExpand(subDir.id, e)} className="p-0.5 rounded">
                                  <ChevronRight className={`h-3 w-3 transition-transform ${isSubExpanded ? "rotate-90" : ""}`} />
                                </button>
                              ) : (
                                <div className="w-4" />
                              )}
                              {subDir.isLocked ? <Lock className="h-3.5 w-3.5 text-destructive shrink-0" /> : <Folder className={`h-3.5 w-3.5 shrink-0 ${selectedFolderId === subDir.id ? "text-primary fill-primary/10" : ""}`} />}
                              <span className="truncate">{subDir.name}</span>
                            </div>
                          </div>

                          {subDir.children && isSubExpanded && (
                            <div className="pl-4 space-y-0.5 border-l border-border/60 ml-3">
                              {subDir.children.map((nested) => (
                                <div 
                                  key={nested.id} 
                                  onClick={() => handleFolderSelect(nested.id, nested.path)}
                                  className={`p-1.5 text-xs rounded-md cursor-pointer transition block truncate ${selectedFolderId === nested.id ? "bg-secondary text-secondary-foreground font-medium" : "text-muted-foreground/80 hover:bg-muted"}`}
                                >
                                  {nested.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* 2. MAIN WORKSPACE / FILE GRID */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-background">
        
        {/* Dynamic Nav Header */}
        <header className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 tracking-wide font-medium">
              <span>Document Vault</span>
              <span>/</span>
              <span className="text-foreground/80">{selectedFolderPath}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              {INITIAL_DIRECTORIES.find(d => d.id === selectedFolderId)?.name || 
               INITIAL_DIRECTORIES.flatMap(d => d.children || []).find(s => s.id === selectedFolderId)?.name || "Vault"}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button className="p-2 rounded-md hover:bg-muted text-muted-foreground border border-border relative transition">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full" />
            </button>
            <button 
              onClick={handleSimulateUpload}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition shadow-sm"
            >
              <Upload className="h-4 w-4" />
              <span>Upload File</span>
            </button>
          </div>
        </header>

        {/* Filter Configuration Controls */}
        <div className="p-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40 backdrop-blur-sm">
          <div className="flex flex-1 items-center gap-2 max-w-md bg-card border border-border rounded-md px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search by keyword or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/70 text-foreground"
            />
            {searchQuery && (
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer" onClick={() => setSearchQuery("")} />
            )}
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-center">
            {fileTypeFilter && (
              <div className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md text-xs font-semibold border border-primary/10">
                <span>Format: {fileTypeFilter}</span>
                <X className="h-3 w-3 cursor-pointer hover:opacity-80" onClick={() => setFileTypeFilter(null)} />
              </div>
            )}
            {!fileTypeFilter && (
              <button 
                onClick={() => setFileTypeFilter("PDF")} 
                className="text-xs text-primary font-semibold hover:underline bg-primary/5 px-2.5 py-1 rounded-md"
              >
                + Filter to PDFs
              </button>
            )}
            
            <div className="border-l border-border h-5 mx-1" />
            
            <div className="flex items-center border border-border rounded-md p-0.5 bg-card">
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition ${viewMode === "grid" ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition ${viewMode === "list" ? "bg-muted text-foreground font-medium" : "text-muted-foreground hover:bg-muted"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Core Grid / List Viewer */}
        <div className="flex-1 p-6 overflow-y-auto">
          {filteredFiles.length === 0 ? (
            <div className="h-64 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-6 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/60 mb-2.5" />
              <h3 className="font-semibold text-sm">No documents found</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">Try relaxing your keyword query search parameters or toggling active directory selections.</p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
              {filteredFiles.map((file) => {
                const isSelected = selectedFile?.id === file.id;
                return (
                  <div 
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`group relative p-4 rounded-xl border bg-card cursor-pointer transition-all flex flex-col gap-4 ${isSelected ? "border-primary ring-2 ring-primary/20 shadow-sm" : "border-border hover:border-muted-foreground/30 hover:shadow-sm"}`}
                  >
                    {file.isConfidential && (
                      <span className="absolute top-3 left-3 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                        Confidential
                      </span>
                    )}
                    
                    <div className="flex flex-col items-center justify-center pt-6 pb-2">
                      <div className={`p-4 rounded-xl mb-3 transition-colors ${file.type === "PDF" ? "bg-destructive/5 text-destructive group-hover:bg-destructive/10" : "bg-primary/5 text-primary group-hover:bg-primary/10"}`}>
                        <FileText className="h-9 w-9" />
                      </div>
                      <h3 className="font-semibold text-sm text-center line-clamp-1 group-hover:text-primary transition px-2 text-foreground">
                        {file.name}
                      </h3>
                      <span className="text-xs text-muted-foreground mt-1 font-medium">{file.id} • {file.size}</span>
                    </div>

                    <div className="border-t border-border/80 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-medium text-[11px]">{file.updatedAt}</span>
                      </div>
                      <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Alternate List Row UI View Mode
            <div className="border border-border rounded-xl overflow-hidden bg-card divide-y divide-border">
              {filteredFiles.map((file) => {
                const isSelected = selectedFile?.id === file.id;
                return (
                  <div 
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition gap-4 ${isSelected ? "bg-secondary/60 text-foreground" : "hover:bg-muted/40"}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className={`h-5 w-5 shrink-0 ${file.type === "PDF" ? "text-destructive" : "text-primary"}`} />
                      <div className="truncate">
                        <span className="font-semibold text-sm block truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{file.id}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0 text-xs">
                      {file.isConfidential && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-bold uppercase">Confidential</span>}
                      <span className="text-muted-foreground hidden sm:inline font-medium">{file.size}</span>
                      <span className="text-muted-foreground font-medium">{file.updatedAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. FLOATING REAL-TIME ACTIVE UPLOAD SYSTEM DRAWER */}
        {isUploadPanelOpen && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-card border border-border shadow-xl rounded-xl z-50 overflow-hidden transition-all duration-300">
            <div className="bg-muted/80 backdrop-blur px-4 py-2.5 border-b border-border flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
                Processing Repository Transfers ({uploads.filter(u=>!u.isDone).length} active)
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsUploadPanelCollapsed(!isUploadPanelCollapsed)} 
                  className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground text-xs font-semibold px-2"
                >
                  {isUploadPanelCollapsed ? "Expand" : "Collapse"}
                </button>
                <button onClick={() => setIsUploadPanelOpen(false)} className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            
            {!isUploadPanelCollapsed && (
              <div className="p-3 space-y-3 max-h-44 overflow-y-auto bg-card">
                {uploads.map((upload) => (
                  <div key={upload.id} className="text-xs space-y-1.5">
                    <div className="flex items-center justify-between font-medium">
                      <span className="truncate max-w-[220px] font-medium text-foreground">{upload.name}</span>
                      <span>{upload.isDone ? <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/10" /> : `${upload.progress}%`}</span>
                    </div>
                    {!upload.isDone && (
                      <div className="w-full bg-muted h-1 rounded-full overflow-hidden">
                        <div className="bg-primary h-1 transition-all duration-200" style={{ width: `${upload.progress}%` }} />
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground font-medium">{upload.size}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* 4. RIGHT SIDEBAR - INTERACTIVE METADATA INSPECTOR */}
      {selectedFile && (
        <aside className="w-72 border-l border-border bg-card hidden xl:flex flex-col shrink-0 animate-in fade-in duration-200">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Document Attributes
            </h2>
          </div>

          <div className="p-4 flex flex-col items-center text-center border-b border-border bg-muted/20">
            <div className={`p-3.5 rounded-xl mb-3 relative ${selectedFile.type === "PDF" ? "bg-destructive/5 text-destructive" : "bg-primary/5 text-primary"}`}>
              <FileText className="h-10 w-10" />
            </div>
            <h3 className="font-bold text-sm text-foreground px-1 line-clamp-2 leading-tight">{selectedFile.name}</h3>
            <span className="text-xs font-mono text-muted-foreground/80 mt-1">{selectedFile.id}</span>

            <div className="grid grid-cols-2 gap-2 w-full mt-4">
              <button 
                onClick={() => alert(`Initiating direct pipeline download file: ${selectedFile.name}`)}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 border border-border bg-card rounded-md text-xs font-semibold text-foreground hover:bg-muted active:scale-[0.97] transition"
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Download</span>
              </button>
              <button 
                onClick={() => alert(`Generated temporary secure shared link to clipboard.`)}
                className="flex items-center justify-center gap-1.5 py-1.5 px-3 border border-border bg-card rounded-md text-xs font-semibold text-foreground hover:bg-muted active:scale-[0.97] transition"
              >
                <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {/* Contextual Document Inner Strings Snippet */}
          <div className="p-4 border-b border-border">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">Secure Content Snippet</span>
            <div className="border border-border/80 rounded-lg p-3 bg-background text-[11px] text-muted-foreground/90 leading-relaxed font-serif italic select-none h-24 overflow-hidden relative">
              "{selectedFile.previewText}"
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
            </div>
          </div>

          {/* Parametric Data Rows */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
            <div className="space-y-2.5">
              <div className="flex justify-between items-center"><span className="text-muted-foreground font-medium">Extension</span><span className="font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded text-[10px]">{selectedFile.type}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground font-medium">Memory Footprint</span><span className="font-semibold text-foreground">{selectedFile.size}</span></div>
              <div className="flex justify-between items-start text-right"><span className="text-muted-foreground font-medium pt-0.5">Created Target</span><span className="font-semibold text-foreground">{selectedFile.createdAt}<br/><span className="text-muted-foreground font-normal text-[10px]">via {selectedFile.createdBy}</span></span></div>
              <div className="flex justify-between items-start text-right"><span className="text-muted-foreground font-medium pt-0.5">Last Mutation</span><span className="font-semibold text-foreground">{selectedFile.modifiedAt}<br/><span className="text-muted-foreground font-normal text-[10px]">by {selectedFile.modifiedBy}</span></span></div>
            </div>
          </div>
        </aside>
      )}

      {/* 5. SLIDE-OVER CONTEXT DESIGN ASSIGNMENTS (Dynamic Employee Profile Tracking) */}
      <aside className="w-80 border-l border-border bg-card hidden 2xl:flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b border-border bg-muted/30">
          <span className="text-[10px] text-primary uppercase tracking-wider block font-bold">Metadata Association</span>
          <h2 className="text-sm font-bold text-foreground mt-0.5">Responsible Account</h2>
        </div>

        <div className="p-6 flex flex-col items-center text-center border-b border-border bg-gradient-to-b from-secondary/20 to-transparent">
          <img 
            src={currentEmployeeDetail.avatarUrl} 
            alt={currentEmployeeDetail.name} 
            className="w-14 h-14 rounded-full object-cover ring-4 ring-card mb-3 shadow-sm"
          />
          <h3 className="font-bold text-base text-foreground leading-tight">{currentEmployeeDetail.name}</h3>
          <span className="text-xs text-muted-foreground font-medium mt-0.5">{currentEmployeeDetail.role}</span>

          <div className="flex items-center gap-2 mt-4 w-full justify-center">
            <button 
              onClick={() => alert(`Opening workspace instant messaging thread with ${currentEmployeeDetail.name}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:opacity-90 active:scale-[0.96] transition shadow-xs"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Message</span>
            </button>
            <button 
              onClick={() => alert(`Redirecting to profile configuration overview ledger.`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-foreground text-xs font-semibold rounded-md hover:bg-muted active:scale-[0.96] transition"
            >
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Profile</span>
            </button>
          </div>
        </div>

        <div className="p-4 text-xs border-b border-border bg-card">
          <div className="grid grid-cols-2 gap-y-3.5 gap-x-2">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">Department</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {currentEmployeeDetail.department}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">Location</span>
              <span className="font-semibold text-foreground block mt-0.5">{currentEmployeeDetail.location}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">Supervisor</span>
              <span className="font-semibold text-primary block mt-0.5 hover:underline cursor-pointer">{currentEmployeeDetail.manager}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase font-medium block">Tenure Vector</span>
              <span className="font-semibold text-foreground block mt-0.5">{currentEmployeeDetail.tenure}</span>
            </div>
          </div>
        </div>

        {/* Multi-layered direct reports structural tree link */}
        <div className="flex-1 p-4 flex flex-col min-h-0 bg-card/50">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Team Footprint</span>
            <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-bold border border-border text-foreground">{currentEmployeeDetail.directReports.length} members</span>
          </div>
          
          <div className="space-y-1.5 flex-1 overflow-y-auto pr-0.5">
            {currentEmployeeDetail.directReports.map((report: any, idx: number) => (
              <div 
                key={idx} 
                className={`p-2 rounded-lg border flex items-center justify-between transition ${report.name === selectedFile?.name.split(" ")[0] + " " + selectedFile?.name.split(" ")[1] || report.isActiveContext ? "bg-primary/5 border-primary/30 font-medium" : "bg-card border-border hover:bg-muted/80"}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 bg-muted border border-border rounded-full flex items-center justify-center text-[10px] font-bold tracking-wider text-muted-foreground uppercase shrink-0">
                    {report.initials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-foreground truncate flex items-center gap-1">
                      {report.name}
                    </h4>
                    <span className="text-[10px] text-muted-foreground block truncate">{report.role}</span>
                  </div>
                </div>
                {(report.name === selectedFile?.name.split(" ")[0] + " " + selectedFile?.name.split(" ")[1] || report.isActiveContext) && (
                  <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Active</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

    </div>
  );
}