"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Folder,
  ChevronRight,
  FileText,
  Search,
  Grid,
  List,
  Upload,
  Bell,
  Download,
  Share2,
  MoreHorizontal,
  X,
  Lock,
  Info,
  Loader2,
  Edit3,
  Trash2,
  FolderPlus,
  ChevronsLeft,
  Tag,
  Check,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { usePermission } from "@/hooks/usePermission";
import {
  fetchFolders,
  fetchDocuments,
  createDocument,
  deleteDocument,
  updateDocument,
  createFolder,
  deleteFolder,
  type DocumentFolder,
  type DocumentItem,
} from "@/lib/documents-api";
import { DocumentPreviewDialog } from "./document-preview-dialog";
import { UploadDialog } from "./upload-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DocumentVaultPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const canWrite = usePermission("documents:write");

  // State
  const [selectedFile, setSelectedFile] = useState<DocumentItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedFolderPath, setSelectedFolderPath] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [dirCollapsed, setDirCollapsed] = useState(false);

  // Dialogs
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editDocOpen, setEditDocOpen] = useState(false);
  const [editDoc, setEditDoc] = useState<DocumentItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTags, setEditTags] = useState("");

  // Queries
  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ["document-folders"],
    queryFn: fetchFolders,
  });

  const { data: docsResult, isLoading: docsLoading } = useQuery({
    queryKey: ["documents", selectedFolderId, searchQuery, fileTypeFilter, selectedTags],
    queryFn: () =>
      fetchDocuments({
        folderId: selectedFolderId ?? undefined,
        search: searchQuery || undefined,
        fileType: fileTypeFilter ?? undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        limit: 100,
      }),
  });

  const documents = docsResult?.items ?? [];

  // Global tag universe (independent of active tag filter so options stay stable)
  const { data: tagSource = [] } = useQuery({
    queryKey: ["document-tags"],
    queryFn: async () => {
      const result = await fetchDocuments({ limit: 100 });
      return result.items;
    },
  });

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    tagSource.forEach((doc) => doc.tags?.forEach((t) => set.add(t)));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [tagSource]);

  // Mutations
  const createDocMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-folders"] });
      queryClient.invalidateQueries({ queryKey: ["document-tags"] });
      toast({ title: "Document uploaded successfully" });
      setUploadOpen(false);
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.details || err?.response?.data?.error;
      console.error('Upload error:', err?.response?.data);
      toast({ title: `Upload failed: ${detail || 'Unknown error'}`, variant: "destructive" });
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-folders"] });
      toast({ title: "Document deleted" });
      if (selectedFile && documents.findIndex((d) => d.id === selectedFile.id) === -1) {
        setSelectedFile(null);
      }
    },
    onError: () => toast({ title: "Failed to delete document", variant: "destructive" }),
  });

  const updateDocMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string; title?: string; description?: string | null; tags?: string[] }) =>
      updateDocument(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document-tags"] });
      toast({ title: "Document updated" });
      setEditDocOpen(false);
    },
    onError: () => toast({ title: "Failed to update document", variant: "destructive" }),
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) =>
      createFolder({ name, parentId: selectedFolderId ?? null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-folders"] });
      toast({ title: "Folder created" });
      setCreateFolderOpen(false);
      setNewFolderName("");
    },
    onError: () => toast({ title: "Failed to create folder", variant: "destructive" }),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: deleteFolder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-folders"] });
      toast({ title: "Folder deleted" });
    },
    onError: (err: any) =>
      toast({
        title: err?.response?.data?.error || "Failed to delete folder",
        variant: "destructive",
      }),
  });

  // Handlers
  const toggleFolderExpand = useCallback((folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  }, []);

  const handleFolderSelect = useCallback((folderId: string, path: string) => {
    setSelectedFolderId(folderId);
    setSelectedFolderPath(path);
    setSelectedFile(null);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const handleUploadComplete = useCallback(
    (result: Parameters<typeof createDocMutation.mutate>[0]) => {
      createDocMutation.mutate(result);
    },
    [createDocMutation],
  );

  const handlePreview = useCallback((doc: DocumentItem) => {
    setPreviewDoc(doc);
    setPreviewOpen(true);
  }, []);

  const handleEdit = useCallback((doc: DocumentItem) => {
    setEditDoc(doc);
    setEditTitle(doc.title);
    setEditDescription(doc.description ?? "");
    setEditTags((doc.tags ?? []).join(", "));
    setEditDocOpen(true);
  }, []);

  const handleDelete = useCallback(
    (docId: string) => {
      if (confirm("Are you sure you want to delete this document?")) {
        deleteDocMutation.mutate(docId);
      }
    },
    [deleteDocMutation],
  );

  const handleEditSave = useCallback(() => {
    if (!editDoc) return;
    updateDocMutation.mutate({
      id: editDoc.id,
      title: editTitle,
      description: editDescription || null,
      tags: editTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  }, [editDoc, editTitle, editDescription, editTags, updateDocMutation]);

  // Derived
  const findFolderPath = useCallback(
    (folderId: string): string => {
      const find = (list: DocumentFolder[], parentPath = ""): string | null => {
        for (const f of list) {
          const currentPath = parentPath ? `${parentPath} / ${f.name}` : f.name;
          if (f.id === folderId) return currentPath;
          if (f.children) {
            const found = find(f.children, currentPath);
            if (found) return found;
          }
        }
        return null;
      };
      return find(folders) || "";
    },
    [folders],
  );

  const allFoldersFlat = useMemo(() => {
    const flatten = (list: DocumentFolder[]): DocumentFolder[] => {
      const result: DocumentFolder[] = [];
      for (const f of list) {
        result.push(f);
        if (f.children) result.push(...flatten(f.children));
      }
      return result;
    };
    return flatten(folders);
  }, [folders]);

  const currentFolderName = useMemo(() => {
    if (!selectedFolderId) return "All Documents";
    const folder = allFoldersFlat.find((f) => f.id === selectedFolderId);
    return folder?.name || "All Documents";
  }, [selectedFolderId, allFoldersFlat]);

  const fileTypes = useMemo(() => {
    const types = new Set(documents.map((d) => d.fileType));
    return Array.from(types);
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((file) => {
      const matchesSearch =
        file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = fileTypeFilter ? file.fileType === fileTypeFilter : true;
      return matchesSearch && matchesType;
    });
  }, [documents, searchQuery, fileTypeFilter]);

  // Render folder tree recursively
  const renderFolderTree = (items: DocumentFolder[], level = 0) => {
    return items.map((folder) => {
      const hasChildren = folder.children && folder.children.length > 0;
      const isExpanded = expandedFolders[folder.id];
      const isSelected = selectedFolderId === folder.id;

      return (
        <div key={folder.id}>
          <div
            onClick={() => handleFolderSelect(folder.id, findFolderPath(folder.id))}
            className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer transition text-sm ${
              isSelected
                ? "bg-secondary text-secondary-foreground font-semibold"
                : "text-muted-foreground hover:bg-muted"
            }`}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              {hasChildren ? (
                <button
                  onClick={(e) => toggleFolderExpand(folder.id, e)}
                  className="p-0.5 rounded hover:bg-muted-foreground/10 shrink-0"
                >
                  <ChevronRight
                    className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                </button>
              ) : (
                <div className="w-5 shrink-0" />
              )}
              {folder.isLocked ? (
                <Lock className="h-4 w-4 text-destructive shrink-0" />
              ) : (
                <Folder
                  className={`h-4 w-4 shrink-0 ${
                    isSelected ? "text-primary fill-primary/10" : ""
                  }`}
                />
              )}
              <span className="truncate">{folder.name}</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium ml-1 shrink-0">
              {folder._count?.documents ?? 0}
            </span>
          </div>

          {hasChildren && isExpanded && (
            <div className="border-l border-border/60 ml-3.5">
              {renderFolderTree(folder.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex -m-8 h-[calc(100vh-var(--topbar-height))] overflow-hidden bg-background text-foreground">
      {/* 1. FOLDERS SIDEBAR */}
      <aside
        className={`border-r border-border bg-card flex-col hidden md:flex shrink-0 transition-[width] duration-200 ${
          dirCollapsed ? "w-12" : "w-64"
        }`}
      >
        <div
          className={`h-14 border-b border-border flex items-center gap-1 ${
            dirCollapsed ? "justify-center px-0" : "justify-between px-4"
          }`}
        >
          {!dirCollapsed && (
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
              Directories
            </span>
          )}
          <div className="flex items-center gap-1">
            {!dirCollapsed && canWrite && (
              <button
                onClick={() => setCreateFolderOpen(true)}
                className="p-1 rounded hover:bg-muted text-muted-foreground"
                title="New Folder"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => setDirCollapsed((v) => !v)}
              className="p-1 rounded hover:bg-muted text-muted-foreground"
              title={dirCollapsed ? "Expand directories" : "Collapse directories"}
            >
              <ChevronsLeft
                className={`h-4 w-4 transition-transform ${dirCollapsed ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {!dirCollapsed && (
          <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto text-sm">
            {foldersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : folders.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">
                No folders yet
              </div>
            ) : (
              renderFolderTree(folders)
            )}
          </nav>
        )}
      </aside>

      {/* 2. MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-background">
        {/* Header */}
        <header className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-card">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 tracking-wide font-medium">
              <span>Document Vault</span>
              {selectedFolderPath && (
                <>
                  <span>/</span>
                  <span className="text-foreground/80">{selectedFolderPath || "All"}</span>
                </>
              )}
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {currentFolderName}
            </h1>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button className="p-2 rounded-md hover:bg-muted text-muted-foreground border border-border relative transition">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-primary rounded-full" />
            </button>
            {canWrite && (
              <button
                onClick={() => setUploadOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition shadow-sm"
              >
                <Upload className="h-4 w-4" />
                <span>Upload File</span>
              </button>
            )}
          </div>
        </header>

        {/* Filters */}
        <div className="p-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40 backdrop-blur-sm">
          <div className="flex flex-1 items-center gap-2 max-w-md bg-card border border-border rounded-md px-3 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search by title or filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/70 text-foreground"
            />
            {searchQuery && (
              <X
                className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                onClick={() => setSearchQuery("")}
              />
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap justify-end">
            {selectedTags.map((tag) => (
              <div
                key={tag}
                className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md text-xs font-semibold border border-primary/10"
              >
                <Tag className="h-3 w-3" />
                <span>{tag}</span>
                <X
                  className="h-3 w-3 cursor-pointer hover:opacity-80"
                  onClick={() => toggleTag(tag)}
                />
              </div>
            ))}
            {availableTags.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={`flex items-center gap-1.5 text-xs border rounded-md px-2.5 py-1.5 font-medium transition ${
                      selectedTags.length > 0
                        ? "border-primary/30 text-primary bg-primary/5"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    <span>Tags</span>
                    {selectedTags.length > 0 && (
                      <span className="ml-0.5 h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {selectedTags.length}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 max-h-72 overflow-y-auto">
                  {selectedTags.length > 0 && (
                    <>
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          setSelectedTags([]);
                        }}
                        className="text-xs text-muted-foreground"
                      >
                        <X className="h-3.5 w-3.5 mr-2" />
                        Clear all
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {availableTags.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <DropdownMenuItem
                        key={tag}
                        onSelect={(e) => {
                          e.preventDefault();
                          toggleTag(tag);
                        }}
                        className="text-xs justify-between"
                      >
                        <span className="truncate">{tag}</span>
                        {active && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {fileTypeFilter && (
              <div className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-2.5 py-1 rounded-md text-xs font-semibold border border-primary/10">
                <span>Type: {fileTypeFilter}</span>
                <X
                  className="h-3 w-3 cursor-pointer hover:opacity-80"
                  onClick={() => setFileTypeFilter(null)}
                />
              </div>
            )}
            {fileTypes.length > 0 && !fileTypeFilter && (
              <select
                onChange={(e) => setFileTypeFilter(e.target.value || null)}
                className="text-xs bg-card border border-border rounded-md px-2 py-1.5 text-foreground"
                defaultValue=""
              >
                <option value="">All types</option>
                {fileTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            )}

            <div className="border-l border-border h-5 mx-1" />

            <div className="flex items-center border border-border rounded-md p-0.5 bg-card">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition ${
                  viewMode === "grid"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition ${
                  viewMode === "list"
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Document Grid/List */}
        <div className="flex-1 p-6 overflow-y-auto">
          {docsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="h-64 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-6 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/60 mb-2.5" />
              <h3 className="font-semibold text-sm">No documents found</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                {searchQuery || selectedTags.length > 0 || fileTypeFilter
                  ? "Try adjusting your search or filters"
                  : "Upload a document to get started"}
              </p>
              {(selectedTags.length > 0 || fileTypeFilter) && (
                <button
                  onClick={() => {
                    setSelectedTags([]);
                    setFileTypeFilter(null);
                  }}
                  className="mt-3 text-xs font-medium text-primary hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
              {filteredDocuments.map((file) => {
                const isSelected = selectedFile?.id === file.id;
                return (
                  <div
                    key={file.id}
                    onClick={() => {
                      setSelectedFile(file);
                      handlePreview(file);
                    }}
                    className={`group relative p-4 rounded-xl border bg-card cursor-pointer transition-all flex flex-col gap-4 ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20 shadow-sm"
                        : "border-border hover:border-muted-foreground/30 hover:shadow-sm"
                    }`}
                  >
                    {file.isConfidential && (
                      <span className="absolute top-3 left-3 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20">
                        Confidential
                      </span>
                    )}

                    <div className="flex flex-col items-center justify-center pt-6 pb-2">
                      <div
                        className={`p-4 rounded-xl mb-3 transition-colors ${
                          file.fileType === "PDF"
                            ? "bg-destructive/5 text-destructive group-hover:bg-destructive/10"
                            : "bg-primary/5 text-primary group-hover:bg-primary/10"
                        }`}
                      >
                        <FileText className="h-9 w-9" />
                      </div>
                      <h3 className="font-semibold text-sm text-center line-clamp-1 group-hover:text-primary transition px-2 text-foreground">
                        {file.title}
                      </h3>
                      <span className="text-xs text-muted-foreground mt-1 font-medium">
                        {file.fileType} &bull; {file.fileSize}
                      </span>
                    </div>

                    <div className="border-t border-border/80 pt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="font-medium text-[11px]">
                          {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {canWrite && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(file);
                              }}
                            >
                              <Edit3 className="h-3.5 w-3.5 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(file.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden bg-card divide-y divide-border">
              {filteredDocuments.map((file) => {
                const isSelected = selectedFile?.id === file.id;
                return (
                  <div
                    key={file.id}
                    onClick={() => {
                      setSelectedFile(file);
                      handlePreview(file);
                    }}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition gap-4 ${
                      isSelected
                        ? "bg-secondary/60 text-foreground"
                        : "hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText
                        className={`h-5 w-5 shrink-0 ${
                          file.fileType === "PDF" ? "text-destructive" : "text-primary"
                        }`}
                      />
                      <div className="truncate">
                        <span className="font-semibold text-sm block truncate">
                          {file.title}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {file.fileName}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-xs">
                      {file.isConfidential && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-bold uppercase">
                          Confidential
                        </span>
                      )}
                      <span className="text-muted-foreground hidden sm:inline font-medium">
                        {file.fileType}
                      </span>
                      <span className="text-muted-foreground font-medium">
                        {file.fileSize}
                      </span>
                      {canWrite && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded hover:bg-muted text-muted-foreground"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(file);
                              }}
                            >
                              <Edit3 className="h-3.5 w-3.5 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(file.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* 3. RIGHT SIDEBAR - Document Details */}
      {selectedFile && (
        <aside className="w-72 border-l border-border bg-card hidden xl:flex flex-col shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              Details
            </h2>
          </div>

          <div className="p-4 flex flex-col items-center text-center border-b border-border bg-muted/20">
            <div
              className={`p-3.5 rounded-xl mb-3 relative ${
                selectedFile.fileType === "PDF"
                  ? "bg-destructive/5 text-destructive"
                  : "bg-primary/5 text-primary"
              }`}
            >
              <FileText className="h-10 w-10" />
            </div>
            <h3 className="font-bold text-sm text-foreground px-1 line-clamp-2 leading-tight">
              {selectedFile.title}
            </h3>
            <span className="text-xs font-mono text-muted-foreground/80 mt-1">
              {selectedFile.id}
            </span>

            <div className="grid grid-cols-2 gap-2 w-full mt-4">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={selectedFile.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(selectedFile.fileUrl);
                  toast({ title: "Link copied to clipboard" });
                }}
                className="flex items-center justify-center gap-1.5"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Copy Link</span>
              </Button>
            </div>
          </div>

          <div className="p-4 border-b border-border">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-2">
              Information
            </span>
            {selectedFile.description && (
              <p className="text-[11px] text-muted-foreground/90 mb-3 italic leading-relaxed">
                &ldquo;{selectedFile.description}&rdquo;
              </p>
            )}
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Type</span>
              <span className="font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded text-[10px] uppercase">
                {selectedFile.fileType}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground font-medium">Size</span>
              <span className="font-semibold text-foreground">{selectedFile.fileSize}</span>
            </div>
            <div className="flex justify-between items-start text-right">
              <span className="text-muted-foreground font-medium pt-0.5">Created</span>
              <span className="font-semibold text-foreground">
                {new Date(selectedFile.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between items-start text-right">
              <span className="text-muted-foreground font-medium pt-0.5">Uploaded by</span>
              <span className="font-semibold text-foreground">
                {selectedFile.uploadedBy?.email || "N/A"}
              </span>
            </div>
            {selectedFile.employee && (
              <div className="flex justify-between items-start text-right">
                <span className="text-muted-foreground font-medium pt-0.5">Employee</span>
                <span className="font-semibold text-foreground">
                  {selectedFile.employee.firstName} {selectedFile.employee.lastName}
                </span>
              </div>
            )}
            {selectedFile.client && (
              <div className="flex justify-between items-start text-right">
                <span className="text-muted-foreground font-medium pt-0.5">Client</span>
                <span className="font-semibold text-foreground">{selectedFile.client.name}</span>
              </div>
            )}
            {selectedFile.isConfidential && (
              <div className="flex items-center gap-1.5 text-[10px] text-destructive font-semibold bg-destructive/5 px-2 py-1 rounded mt-2">
                <Lock className="h-3 w-3" />
                Confidential
              </div>
            )}
            {selectedFile.tags && selectedFile.tags.length > 0 && (
              <div className="pt-2 border-t border-border">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-1.5">
                  Tags
                </span>
                <div className="flex flex-wrap gap-1">
                  {selectedFile.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        folders={allFoldersFlat}
        currentFolderId={selectedFolderId || allFoldersFlat[0]?.id || ""}
        onUploadComplete={handleUploadComplete}
      />

      {/* Preview Dialog */}
      <DocumentPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        document={previewDoc}
      />

      {/* Create Folder Dialog */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Contracts, Reports..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && newFolderName.trim()) {
                  createFolderMutation.mutate(newFolderName.trim());
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateFolderOpen(false);
                setNewFolderName("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => createFolderMutation.mutate(newFolderName.trim())}
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={editDocOpen} onOpenChange={setEditDocOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <textarea
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-tags"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="e.g. contract, legal, signed"
              />
              {editTags.trim() && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {editTags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDocOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={!editTitle.trim() || updateDocMutation.isPending}
            >
              {updateDocMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
