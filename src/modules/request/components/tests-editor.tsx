"use client";

import { useMemo } from "react";
import { Plus, X, Info } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COMPARATORS,
  SOURCES,
  parseAssertions,
  type Assertion,
  type AssertionSource,
  type Comparator,
} from "@/lib/assertions";

interface Props {
  /** Serialized Assertion[] from the tab. */
  value?: string;
  onChange: (serialized: string) => void;
}

const control =
  "h-8 text-xs bg-canvas border-line text-zinc-200 focus-visible:ring-0 focus:ring-0";

let counter = 0;
const nextId = () => `a${Date.now().toString(36)}${counter++}`;

const TestsEditor = ({ value, onChange }: Props) => {
  const assertions = useMemo(() => parseAssertions(value), [value]);

  const commit = (next: Assertion[]) => onChange(JSON.stringify(next));

  const update = (id: string, patch: Partial<Assertion>) =>
    commit(assertions.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const add = () =>
    commit([
      ...assertions,
      {
        id: nextId(),
        source: "status",
        comparator: "equals",
        target: "200",
        enabled: true,
      },
    ]);

  return (
    <div className="space-y-3">
      {assertions.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-xs text-zinc-500 mb-1">No assertions yet.</p>
          <p className="text-[11px] text-zinc-600">
            Add one to check the response every time this request runs.
          </p>
        </div>
      )}

      {assertions.map((assertion) => {
        const source = SOURCES.find((s) => s.value === assertion.source);
        const comparator = COMPARATORS.find((c) => c.value === assertion.comparator);

        return (
          <div key={assertion.id} className="flex flex-wrap items-center gap-1.5">
            <input
              type="checkbox"
              checked={assertion.enabled !== false}
              onChange={(e) => update(assertion.id, { enabled: e.target.checked })}
              className="accent-[var(--color-brand)] shrink-0"
              title="Enabled"
            />

            <Select
              value={assertion.source}
              onValueChange={(next) =>
                update(assertion.id, {
                  source: next as AssertionSource,
                  path: undefined,
                })
              }
            >
              <SelectTrigger className={`${control} w-[150px]`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface-raised border-line text-zinc-300">
                {SOURCES.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {source?.needsPath && (
              <Input
                value={assertion.path ?? ""}
                onChange={(e) => update(assertion.id, { path: e.target.value })}
                placeholder={
                  assertion.source === "header" ? "content-type" : "data.items[0].id"
                }
                className={`${control} w-[160px] font-mono`}
              />
            )}

            <Select
              value={assertion.comparator}
              onValueChange={(next) =>
                update(assertion.id, { comparator: next as Comparator })
              }
            >
              <SelectTrigger className={`${control} w-[150px]`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface-raised border-line text-zinc-300">
                {COMPARATORS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-xs">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {comparator?.needsTarget && (
              <Input
                value={assertion.target}
                onChange={(e) => update(assertion.id, { target: e.target.value })}
                placeholder="expected value"
                className={`${control} flex-1 min-w-[120px] font-mono`}
              />
            )}

            <button
              type="button"
              onClick={() => commit(assertions.filter((a) => a.id !== assertion.id))}
              className="shrink-0 text-zinc-600 hover:text-red-400 px-1"
              title="Remove assertion"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}

      <div className="flex items-center justify-between pt-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={add}
          className="h-7 text-xs text-zinc-400 hover:text-zinc-200"
        >
          <Plus className="h-3.5 w-3.5 mr-1" /> Add assertion
        </Button>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-brand/10 bg-brand/5 p-3">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
        <p className="text-[11px] leading-relaxed text-zinc-400">
          Assertions are declarative rather than scripted &mdash; no JavaScript is
          executed. Results appear on the response&apos;s Tests tab after each send,
          and are saved with the run.
        </p>
      </div>
    </div>
  );
};

export default TestsEditor;
