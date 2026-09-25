"use client";

import React, { useMemo, useState } from "react";
import { Eye, EyeOff, Info } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AUTH_TYPES,
  NO_AUTH,
  parseAuth,
  type AuthConfig,
  type AuthType,
} from "@/lib/auth-schemes";

interface Props {
  /** Serialized AuthConfig from the tab. */
  value?: string;
  onChange: (serialized: string) => void;
}

const fieldClass =
  "bg-canvas border-line h-9 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-0 focus-visible:border-brand/50";

const labelClass =
  "text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5 block";

/** Defaults for a type the user just switched to, so fields are never undefined. */
function blankFor(type: AuthType): AuthConfig {
  switch (type) {
    case "bearer":
      return { type: "bearer", token: "" };
    case "basic":
      return { type: "basic", username: "", password: "" };
    case "apiKey":
      return { type: "apiKey", key: "", value: "", in: "header" };
    default:
      return NO_AUTH;
  }
}

const AuthEditor = ({ value, onChange }: Props) => {
  const auth = useMemo(() => parseAuth(value), [value]);
  const [reveal, setReveal] = useState(false);

  const update = (next: AuthConfig) => onChange(JSON.stringify(next));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-[12px] text-zinc-400 shrink-0 w-24">Auth Type</label>
        <Select
          value={auth.type}
          onValueChange={(next) => update(blankFor(next as AuthType))}
        >
          <SelectTrigger className="w-full sm:w-56 h-9 rounded-lg border-line bg-surface-raised text-[13px] text-zinc-200 focus:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-line bg-surface-raised text-zinc-300">
            {AUTH_TYPES.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-[13px] hover:bg-line"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {auth.type === "none" && (
        <p className="text-[12px] text-zinc-600 italic">
          This request will be sent without an Authorization header.
        </p>
      )}

      {auth.type === "bearer" && (
        <div>
          <label className={labelClass}>Token</label>
          <div className="relative">
            <Input
              type={reveal ? "text" : "password"}
              value={auth.token}
              onChange={(e) => update({ ...auth, token: e.target.value })}
              placeholder="eyJhbGciOi... or {{token}}"
              className={`${fieldClass} pr-10 font-mono`}
            />
            <button
              type="button"
              onClick={() => setReveal((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              aria-label={reveal ? "Hide token" : "Show token"}
            >
              {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-zinc-600 mt-2">
            Sent as <code className="text-zinc-500">Authorization: Bearer &lt;token&gt;</code>
          </p>
        </div>
      )}

      {auth.type === "basic" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Username</label>
            <Input
              value={auth.username}
              onChange={(e) => update({ ...auth, username: e.target.value })}
              placeholder="username"
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Password</label>
            <div className="relative">
              <Input
                type={reveal ? "text" : "password"}
                value={auth.password}
                onChange={(e) => update({ ...auth, password: e.target.value })}
                placeholder="password"
                className={`${fieldClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setReveal((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                aria-label={reveal ? "Hide password" : "Show password"}
              >
                {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {auth.type === "apiKey" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Key</label>
              <Input
                value={auth.key}
                onChange={(e) => update({ ...auth, key: e.target.value })}
                placeholder="X-API-Key"
                className={`${fieldClass} font-mono`}
              />
            </div>
            <div>
              <label className={labelClass}>Value</label>
              <div className="relative">
                <Input
                  type={reveal ? "text" : "password"}
                  value={auth.value}
                  onChange={(e) => update({ ...auth, value: e.target.value })}
                  placeholder="your-key or {{apiKey}}"
                  className={`${fieldClass} pr-10 font-mono`}
                />
                <button
                  type="button"
                  onClick={() => setReveal((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  aria-label={reveal ? "Hide value" : "Show value"}
                >
                  {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className={labelClass}>Add to</label>
            <Select
              value={auth.in}
              onValueChange={(next) =>
                update({ ...auth, in: next === "query" ? "query" : "header" })
              }
            >
              <SelectTrigger className="w-full sm:w-56 h-9 rounded-lg border-line bg-surface-raised text-[13px] text-zinc-200 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-line bg-surface-raised text-zinc-300">
                <SelectItem value="header" className="text-[13px] hover:bg-line">
                  Header
                </SelectItem>
                <SelectItem value="query" className="text-[13px] hover:bg-line">
                  Query parameter
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {auth.type !== "none" && (
        <div className="flex items-start gap-2.5 rounded-lg border border-brand/10 bg-brand/5 p-3">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
          <p className="text-[11px] leading-relaxed text-zinc-400">
            Values support <code className="text-brand">{"{{variables}}"}</code> from
            the active environment. A header you set manually on the Headers tab takes
            precedence over this scheme.
          </p>
        </div>
      )}
    </div>
  );
};

export default AuthEditor;
