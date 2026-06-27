"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
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
  Download, 
  Share2, 
  MoreHorizontal, 
  X, 
  CheckCircle2, 
  Lock,
  Plus,
  Info
} from "lucide-react";
import apiClient from "@/lib/api-client";

type Directory = {
  id: string;
  name: string;
  hasChildren?: boolean;
  path: string;
  children?: Directory[];
  isLocked?: boolean;
};

type DocumentFile = {
  id: string;
  name: string;
  type: string;
  size: string;
  isConfidential: boolean;
  updatedAt: string;
  createdAt: string;
  createdBy: string;
  modifiedAt: string;
  modifiedBy: string;
  location: string;
  folderId: string;
  previewText: string;
};

type UploadItem = {
  id: number;
  name: string;
  size: string;
  progress: number;
  isDone: boolean;
};



function mapDirectories(raw: any[]): Directory[] {
  return raw.map((d: any) => ({
    id: d.id,
    name: d.name,
    hasChildren: (d.children && d.children.length > 0) || d._count?.documents > 0,
    path: d.path,
    isLocked: d.isLocked,
    children: d.children ? mapDirectories(d.children) : undefined,
  }));
}

export default function DocumentVaultPage() {
  const [selectedFile, setSelectedFile] = useState<DocumentFile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [selectedFolderPath, setSelectedFolderPath] = useState<string>("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string | null>("PDF");
  const [isUploadPanelOpen, setIsUploadPanelOpen] = useState(false);
  const [isUploadPanelCollapsed, setIsUploadPanelCollapsed] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [files, setFiles] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchFolders() {
      try {
        const res = await apiClient.get('/documents/folders');
        const mapped = mapDirectories(res.data.data);
        setDirectories(mapped);
        if (mapped.length > 0) {
          setSelectedFolderId(mapped[0].id);
          setSelectedFolderPath(mapped[0].path);
        }
      } catch (err) {
        console.error('Failed to fetch folders', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFolders();
  }, []);

  useEffect(() => {
    if (!selectedFolderId) return;
    async function fetchFiles() {
      try {
        const params: Record<string, string> = { folderId: selectedFolderId };
        if (fileTypeFilter) params.type = fileTypeFilter;
        if (searchQuery) params.search = searchQuery;
        const res = await apiClient.get('/documents', { params });
        const items: DocumentFile[] = res.data.data.items || [];
        setFiles(items);
        if (items.length > 0 && (!selectedFile || !items.find((f) => f.id === selectedFile.id))) {
          setSelectedFile(items[0]);
        }
      } catch (err) {
        console.error('Failed to fetch documents', err);
      }
    }
    fetchFiles();
  }, [selectedFolderId, fileTypeFilter]);

  useEffect(() => {
    if (!selectedFile) return;
    const fileId = selectedFile.id;
    async function fetchDocumentDetails() {
      try {
        const res = await apiClient.get(`/documents/${fileId}`);
        setSelectedFile(res.data.data);
      } catch (err) {
        console.error('Failed to fetch document details', err);
      }
    }
    fetchDocumentDetails();
  }, [selectedFile?.id]);

  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const handleFolderSelect = (folderId: string, path: string) => {
    setSelectedFolderId(folderId);
    setSelectedFolderPath(path);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFolderId) return;

    const uploadItem: UploadItem = {
      id: Date.now(),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      progress: 0,
      isDone: false,
    };
    setUploads(prev => [...prev, uploadItem]);
    setIsUploadPanelOpen(true);
    setIsUploadPanelCollapsed(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', selectedFolderId);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/documents/upload`);
      
      const token = document.cookie.split('; ').find(row => row.startsWith('access-token='))?.split('=')[1];
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          setUploads(prev => prev.map(u => u.id === uploadItem.id ? { ...u, progress: pct } : u));
        }
      };

      xhr.onload = () => {
        setUploads(prev => prev.map(u => u.id === uploadItem.id ? { ...u, progress: 100, isDone: true } : u));
        const res = apiClient.get('/documents', { params: { folderId: selectedFolderId } });
        res.then(r => setFiles(r.data.data.items || []));
      };

      xhr.send(formData);
    } catch (err) {
      console.error('Upload failed', err);
      setUploads(prev => prev.map(u => u.id === uploadItem.id ? { ...u, isDone: true } : u));
    }
  };

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    return files.filter(file =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  if (loading) {
    return (
      <div className="flex bg-background text-foreground">
        <div className="animate-pulse flex-1 p-4 space-y-4">
          <div className="h-12 bg-muted rounded-lg w-64" />
          <div className="h-8 bg-muted rounded-lg" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-muted rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-background text-foreground selection:bg-primary/20">
      
      {/* 1. DIRECTORIES DYNAMIC SIDEBAR */}
      <aside className="w-64 border-r border-border bg-card flex flex-col hidden md:flex shrink-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Directories</span>
          <button className="p-1 rounded hover:bg-muted text-muted-foreground" title="Filter Settings">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
        
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto text-sm">
          {directories.map((dir) => {
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
              {directories.find(d => d.id === selectedFolderId)?.name || 
               directories.flatMap(d => d.children || []).find(s => s.id === selectedFolderId)?.name || "Vault"}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 self-end sm:self-center">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.docx,.doc,.xlsx,.png,.jpg"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
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



    </div>
  );
}
