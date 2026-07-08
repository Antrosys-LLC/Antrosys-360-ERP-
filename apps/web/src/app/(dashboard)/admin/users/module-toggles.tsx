"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, Loader2, Check } from "lucide-react";
import { formatRoleLabel } from "@antrosys/types";
import { useToast } from "@/hooks/use-toast";
import {
  fetchModuleAccess,
  setModuleAccess,
  type ModuleAccessMatrix,
  type ModuleAccessLevel,
} from "@/lib/admin-api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LEVELS: ModuleAccessLevel[] = ["OFF", "READ", "FULL"];

const LEVEL_STYLE: Record<ModuleAccessLevel, string> = {
  FULL: "bg-primary/10 text-primary border-primary/20",
  READ: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  OFF: "bg-muted text-muted-foreground border-border",
};

const LEVEL_LABEL: Record<ModuleAccessLevel, string> = {
  FULL: "FULL",
  READ: "READ",
  OFF: "OFF",
};

export function ModuleToggles() {
  const { toast } = useToast();
  const [matrix, setMatrix] = useState<ModuleAccessMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingCell, setSavingCell] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchModuleAccess();
        if (active) setMatrix(data);
      } catch {
        if (active) setError("Failed to load module access");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  function levelFor(role: string, moduleKey: string): ModuleAccessLevel {
    const row = matrix?.roles.find((r) => r.role === role);
    return row?.modules.find((m) => m.module === moduleKey)?.level ?? "OFF";
  }

  function isOverridden(role: string, moduleKey: string): boolean {
    const row = matrix?.roles.find((r) => r.role === role);
    return row?.modules.find((m) => m.module === moduleKey)?.isOverridden ?? false;
  }

  async function handleChange(role: string, moduleKey: string, level: ModuleAccessLevel) {
    if (!matrix) return;
    const cellKey = `${role}:${moduleKey}`;
    const previous = matrix;

    // Optimistic update
    setMatrix({
      ...matrix,
      roles: matrix.roles.map((r) =>
        r.role !== role
          ? r
          : {
              ...r,
              modules: r.modules.map((m) =>
                m.module === moduleKey ? { ...m, level, isOverridden: true } : m,
              ),
            },
      ),
    });
    setSavingCell(cellKey);

    try {
      await setModuleAccess({ role, module: moduleKey, accessLevel: level });
      toast({ title: `${formatRoleLabel(role)} · ${moduleKey} set to ${level}` });
    } catch {
      setMatrix(previous);
      toast({ title: "Failed to update access", variant: "destructive" });
    } finally {
      setSavingCell(null);
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" /> Module Toggles
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Control module access per role. Changes apply to all users of that role.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="py-8 text-center text-destructive text-xs">{error}</div>
      ) : matrix ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 font-bold">
                <th className="p-3 pl-4 sticky left-0 bg-muted/40 z-10 min-w-[180px]">Module</th>
                {matrix.roles.map((r) => (
                  <th key={r.role} className="p-3 text-center whitespace-nowrap">
                    {formatRoleLabel(r.role)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {matrix.modules.map((mod) => (
                <tr key={mod.key} className="hover:bg-muted/30 transition">
                  <td className="p-3 pl-4 sticky left-0 bg-card z-10 font-semibold text-xs text-foreground whitespace-nowrap">
                    {mod.label}
                    {!mod.writeCapable && (
                      <span className="ml-1.5 text-[9px] text-muted-foreground font-medium">(read-only)</span>
                    )}
                  </td>
                  {matrix.roles.map((r) => {
                    const level = levelFor(r.role, mod.key);
                    const overridden = isOverridden(r.role, mod.key);
                    const cellKey = `${r.role}:${mod.key}`;
                    const saving = savingCell === cellKey;
                    return (
                      <td key={cellKey} className="p-2 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              className={`relative inline-flex items-center justify-center gap-1 min-w-[58px] px-2 py-1 rounded-md text-[10px] font-bold border transition hover:opacity-80 ${LEVEL_STYLE[level]}`}
                              title={overridden ? "Overridden from default" : "Default"}
                            >
                              {saving ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  {LEVEL_LABEL[level]}
                                  {overridden && <span className="h-1 w-1 rounded-full bg-current opacity-70" />}
                                </>
                              )}
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="center" className="w-28">
                            {LEVELS.filter((l) => mod.writeCapable || l !== "FULL").map((l) => (
                              <DropdownMenuItem
                                key={l}
                                onSelect={(e) => {
                                  e.preventDefault();
                                  if (l !== level) handleChange(r.role, mod.key, l);
                                }}
                                className="text-xs justify-between"
                              >
                                <span>{LEVEL_LABEL[l]}</span>
                                {l === level && <Check className="h-3.5 w-3.5 text-primary" />}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground mt-3">
            <span className="font-bold">FULL</span> = read &amp; write · <span className="font-bold">READ</span> = view only · <span className="font-bold">OFF</span> = no access. A dot indicates a value changed from the role default.
          </p>
        </div>
      ) : null}
    </div>
  );
}
