import { describe, expect, it } from "vitest";

import {
  formatBytes,
  formatDuration,
  methodBadge,
  methodText,
  statusBadge,
  statusLabel,
  statusText,
} from "@/lib/http-display";

describe("method colours", () => {
  it("gives every supported method its own colour", () => {
    const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
    const colours = methods.map(methodText);
    expect(new Set(colours).size).toBe(methods.length);
  });

  it("is case-insensitive", () => {
    expect(methodText("get")).toBe(methodText("GET"));
  });

  it("falls back for an unknown method", () => {
    expect(methodText("TRACE")).toBe("text-zinc-400");
    expect(methodBadge("TRACE")).toContain("zinc");
  });
});

describe("status colours", () => {
  it("maps each class", () => {
    expect(statusText(200)).toBe("text-status-ok");
    expect(statusText(301)).toBe("text-status-redirect");
    expect(statusText(404)).toBe("text-status-client-error");
    expect(statusText(500)).toBe("text-status-server-error");
  });

  it("treats 0 as no response rather than success", () => {
    expect(statusText(0)).toBe("text-zinc-500");
    expect(statusLabel(0)).toBe("No response");
  });

  it("labels each class", () => {
    expect(statusLabel(204)).toBe("Success");
    expect(statusLabel(302)).toBe("Redirect");
    expect(statusLabel(422)).toBe("Client error");
    expect(statusLabel(503)).toBe("Server error");
  });

  it("gives badges a tinted background", () => {
    expect(statusBadge(200)).toContain("bg-status-ok/10");
  });
});

describe("formatBytes", () => {
  it("formats each unit", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(1024 * 1024 * 3)).toBe("3 MB");
  });

  it("handles missing values without throwing", () => {
    expect(formatBytes(null)).toBe("0 B");
    expect(formatBytes(undefined)).toBe("0 B");
    expect(formatBytes(-5)).toBe("0 B");
  });

  it("caps at the largest known unit", () => {
    expect(formatBytes(1024 ** 5)).toContain("GB");
  });
});

describe("formatDuration", () => {
  it("uses ms below a second and seconds above", () => {
    expect(formatDuration(120)).toBe("120 ms");
    expect(formatDuration(999)).toBe("999 ms");
    expect(formatDuration(1500)).toBe("1.50 s");
  });

  it("renders an em dash when unknown", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(undefined)).toBe("—");
  });
});
