import { describe, expect, it } from "vitest";

import {
  findVariables,
  substitute,
  substituteMap,
  toVariableMap,
} from "@/lib/variables";

describe("toVariableMap", () => {
  it("reads the stored array shape and drops disabled rows", () => {
    expect(
      toVariableMap([
        { key: "baseUrl", value: "https://api.test", enabled: true },
        { key: "off", value: "nope", enabled: false },
      ])
    ).toEqual({ baseUrl: "https://api.test" });
  });

  it("reads a JSON string of that array", () => {
    expect(toVariableMap('[{"key":"a","value":"1"}]')).toEqual({ a: "1" });
  });

  it("reads a plain object map", () => {
    expect(toVariableMap({ a: "1", b: 2 })).toEqual({ a: "1", b: "2" });
  });

  it("returns an empty map for blank or malformed input", () => {
    expect(toVariableMap("")).toEqual({});
    expect(toVariableMap("not json")).toEqual({});
    expect(toVariableMap(null)).toEqual({});
    expect(toVariableMap(42)).toEqual({});
  });

  it("ignores entries with a blank key", () => {
    expect(toVariableMap([{ key: "   ", value: "x" }])).toEqual({});
  });
});

describe("substitute", () => {
  const vars = { baseUrl: "https://api.test", id: "42" };

  it("replaces a placeholder", () => {
    expect(substitute("{{baseUrl}}/users/{{id}}", vars).text).toBe(
      "https://api.test/users/42"
    );
  });

  it("tolerates whitespace inside the braces", () => {
    expect(substitute("{{ baseUrl }}/x", vars).text).toBe("https://api.test/x");
  });

  it("leaves an unknown variable literal and reports it", () => {
    const result = substitute("{{baseUrl}}/{{missing}}", vars);
    expect(result.text).toBe("https://api.test/{{missing}}");
    expect(result.missing).toEqual(["missing"]);
  });

  it("reports each missing name only once", () => {
    expect(substitute("{{a}}{{a}}{{b}}", {}).missing).toEqual(["a", "b"]);
  });

  it("substitutes an empty string when the value is empty", () => {
    expect(substitute("x{{blank}}y", { blank: "" }).text).toBe("xy");
  });

  it("leaves text without placeholders untouched", () => {
    expect(substitute("https://api.test/users", vars).text).toBe(
      "https://api.test/users"
    );
  });
});

describe("findVariables", () => {
  it("lists distinct names in order", () => {
    expect(findVariables("{{b}}/{{a}}/{{b}}")).toEqual(["b", "a"]);
  });

  it("returns nothing for empty input", () => {
    expect(findVariables("")).toEqual([]);
  });
});

describe("substituteMap", () => {
  it("resolves both keys and values", () => {
    const { map, missing } = substituteMap(
      { "{{headerName}}": "{{token}}" },
      { headerName: "Authorization", token: "abc" }
    );
    expect(map).toEqual({ Authorization: "abc" });
    expect(missing).toEqual([]);
  });

  it("collects missing names from keys and values alike", () => {
    const { missing } = substituteMap({ "{{k}}": "{{v}}" }, {});
    expect(missing).toEqual(["k", "v"]);
  });
});
