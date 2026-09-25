"use client";

import { useMemo, useState } from "react";
import { Copy, Eye, EyeOff, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Variable } from "@/lib/variables";
import {
  useCreateEnvironment,
  useDeleteEnvironment,
  useDuplicateEnvironment,
  useEnvironments,
  useUpdateEnvironment,
} from "../hooks/environments";
import { useEnvironmentStore } from "../store";

interface Props {
  workspaceId: string;
  isOpen: boolean;
  onClose: () => void;
}

function parseVariables(raw: unknown): Variable[] {
  if (Array.isArray(raw)) {
    return (raw as Variable[])
      .filter((v) => v && typeof v === "object")
      .map((v) => ({
        key: String(v.key ?? ""),
        value: String(v.value ?? ""),
        enabled: v.enabled !== false,
        secret: v.secret === true,
      }));
  }
  return [];
}

const EnvironmentManager = ({ workspaceId, isOpen, onClose }: Props) => {
  const { data: environments } = useEnvironments(workspaceId);
  const createEnvironment = useCreateEnvironment(workspaceId);
  const updateEnvironment = useUpdateEnvironment(workspaceId);
  const deleteEnvironment = useDeleteEnvironment(workspaceId);
  const duplicateEnvironment = useDuplicateEnvironment(workspaceId);
  const setActiveEnvironment = useEnvironmentStore((s) => s.setActiveEnvironment);

  const [pickedId, setPickedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Variable[]>([]);
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [newName, setNewName] = useState("");

  // Derived rather than stored: the selection falls back to the first
  // environment once the list loads, with no effect needed to sync it.
  const selectedId =
    pickedId && environments?.some((e) => e.id === pickedId)
      ? pickedId
      : environments?.[0]?.id ?? null;

  const selected = useMemo(
    () => environments?.find((e) => e.id === selectedId) ?? null,
    [environments, selectedId]
  );

  // Load the selected environment into the editable draft. Comparing against
  // the previously loaded id during render is React's documented alternative to
  // mirroring props into state inside an effect.
  const [loadedId, setLoadedId] = useState<string | null>(null);
  if (selectedId !== loadedId) {
    setLoadedId(selectedId);
    setDraft(selected ? parseVariables(selected.variables) : []);
    setName(selected?.name ?? "");
    setRevealed({});
  }

  const dirty =
    Boolean(selected) &&
    (name !== selected?.name ||
      JSON.stringify(draft) !== JSON.stringify(parseVariables(selected?.variables)));

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      const created = await createEnvironment.mutateAsync(trimmed);
      setNewName("");
      setPickedId(created.id);
      toast.success(`Created "${created.name}"`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not create environment"
      );
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    try {
      await updateEnvironment.mutateAsync({
        id: selected.id,
        name: name.trim() || selected.name,
        variables: draft.filter((v) => v.key.trim() || v.value.trim()),
      });
      toast.success("Environment saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteEnvironment.mutateAsync(selected.id);
      setActiveEnvironment(workspaceId, null);
      setPickedId(null);
      toast.success("Environment deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete");
    }
  };

  const addRow = () =>
    setDraft((rows) => [...rows, { key: "", value: "", enabled: true, secret: false }]);

  const updateRow = (index: number, patch: Partial<Variable>) =>
    setDraft((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const removeRow = (index: number) =>
    setDraft((rows) => rows.filter((_, i) => i !== index));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-canvas border-line text-zinc-200 max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-white">Environments</DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">
            Variables defined here can be used anywhere in a request as{" "}
            <code className="text-blue-400">{"{{name}}"}</code> &mdash; in the URL,
            headers, query params, auth fields, or body.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr] gap-4 min-h-[340px]">
          {/* Environment list */}
          <div className="border border-line rounded-lg p-2 flex flex-col gap-1 bg-surface-raised">
            <div className="flex gap-1.5 mb-1">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="New environment"
                className="h-7 text-xs bg-canvas border-line focus-visible:ring-0"
              />
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!newName.trim() || createEnvironment.isPending}
                className="h-7 px-2 bg-blue-600 hover:bg-blue-700 shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {environments?.length ? (
              environments.map((environment) => (
                <button
                  key={environment.id}
                  onClick={() => setPickedId(environment.id)}
                  className={`text-left text-xs px-2.5 py-1.5 rounded transition-colors truncate ${
                    selectedId === environment.id
                      ? "bg-line text-white"
                      : "text-zinc-400 hover:bg-line/60"
                  }`}
                >
                  {environment.name}
                </button>
              ))
            ) : (
              <p className="text-[11px] text-zinc-600 px-1 py-2 leading-relaxed">
                No environments yet. Create one, then add a variable like{" "}
                <code className="text-zinc-500">baseUrl</code>.
              </p>
            )}
          </div>

          {/* Variable editor */}
          <div className="border border-line rounded-lg p-3 bg-surface-raised flex flex-col">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-xs text-zinc-600">Select or create an environment.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8 text-sm bg-canvas border-line focus-visible:ring-0"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => duplicateEnvironment.mutate(selected.id)}
                    className="h-8 px-2 text-zinc-400 hover:text-zinc-200"
                    title="Duplicate"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleDelete}
                    className="h-8 px-2 text-red-400/80 hover:text-red-400"
                    title="Delete environment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[260px]">
                  {draft.length === 0 && (
                    <p className="text-[11px] text-zinc-600 py-4 text-center">
                      No variables yet.
                    </p>
                  )}

                  {draft.map((row, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={row.enabled !== false}
                        onChange={(e) => updateRow(index, { enabled: e.target.checked })}
                        className="accent-blue-500 shrink-0"
                        title="Enabled"
                      />
                      <Input
                        value={row.key}
                        onChange={(e) => updateRow(index, { key: e.target.value })}
                        placeholder="baseUrl"
                        className="h-7 text-xs font-mono bg-canvas border-line focus-visible:ring-0"
                      />
                      <div className="relative flex-1">
                        <Input
                          type={row.secret && !revealed[index] ? "password" : "text"}
                          value={row.value}
                          onChange={(e) => updateRow(index, { value: e.target.value })}
                          placeholder="https://api.example.com"
                          className="h-7 text-xs font-mono bg-canvas border-line focus-visible:ring-0 pr-7"
                        />
                        {row.secret && (
                          <button
                            type="button"
                            onClick={() =>
                              setRevealed((r) => ({ ...r, [index]: !r[index] }))
                            }
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                          >
                            {revealed[index] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => updateRow(index, { secret: !row.secret })}
                        className={`shrink-0 px-1.5 h-7 rounded text-[10px] font-bold border transition-colors ${
                          row.secret
                            ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                            : "border-line text-zinc-600 hover:text-zinc-400"
                        }`}
                        title="Mask this value in the UI (it is still sent in requests)"
                      >
                        SECRET
                      </button>
                      <button
                        type="button"
                        onClick={() => removeRow(index)}
                        className="shrink-0 text-zinc-600 hover:text-red-400 px-1"
                        title="Remove"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 mt-2 border-t border-line">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={addRow}
                    className="h-7 text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add variable
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={!dirty || updateEnvironment.isPending}
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                  >
                    {updateEnvironment.isPending ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnvironmentManager;
