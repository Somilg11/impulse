import {
  findHeader,
  methodAllowsBody,
  toKeyValueMap,
  type ExecRequest,
} from "@/lib/http";
import { applyAuth, parseAuth, type AuthConfig } from "@/lib/auth-schemes";
import { encodeBody, type BodyType } from "@/lib/body-types";
import { substitute, substituteMap, type VariableMap } from "@/lib/variables";

/**
 * Turns a stored or in-progress request into the exact bytes to send.
 *
 * The order of operations matters:
 *
 *   1. normalize headers and params into flat maps (two historical shapes exist)
 *   2. encode the body according to its body type, deriving a Content-Type
 *   3. fold in the auth scheme, which may add a header or a query param
 *   4. substitute {{variables}} across everything
 *
 * Auth is applied before substitution so that a bearer field holding `{{token}}`
 * resolves like any other value. Substitution is last so nothing downstream has
 * to know about variables at all.
 *
 * Both execution modes call this, so browser and proxy sends cannot drift.
 */

export type RequestDraft = {
  method: string;
  url: string;
  headers?: unknown;
  parameters?: unknown;
  body?: unknown;
  bodyType?: BodyType | null;
  auth?: unknown;
};

export type ComposedRequest = {
  request: ExecRequest;
  /** Variable names referenced by the request but absent from the environment. */
  missingVariables: string[];
  auth: AuthConfig;
};

export function composeRequest(
  draft: RequestDraft,
  variables: VariableMap = {}
): ComposedRequest {
  const method = (draft.method || "GET").toUpperCase();
  const bodyType: BodyType = draft.bodyType ?? "JSON";

  let headers = toKeyValueMap(draft.headers);
  let params = toKeyValueMap(draft.parameters);

  // --- body ---------------------------------------------------------------
  let body: string | undefined;
  if (methodAllowsBody(method)) {
    const encoded = encodeBody(bodyType, draft.body);
    body = encoded.body;
    // A Content-Type the user set by hand always wins over the inferred one.
    if (encoded.contentType && !findHeader(headers, "content-type")) {
      headers["Content-Type"] = encoded.contentType;
    }
  }

  // --- auth ---------------------------------------------------------------
  const auth = parseAuth(draft.auth);
  const withAuth = applyAuth(auth, headers, params);
  headers = withAuth.headers;
  params = withAuth.params;

  // --- variables ----------------------------------------------------------
  const missing: string[] = [];
  const collect = (names: string[]) => {
    for (const name of names) if (!missing.includes(name)) missing.push(name);
  };

  const resolvedUrl = substitute((draft.url || "").trim(), variables);
  collect(resolvedUrl.missing);

  const resolvedHeaders = substituteMap(headers, variables);
  collect(resolvedHeaders.missing);

  const resolvedParams = substituteMap(params, variables);
  collect(resolvedParams.missing);

  let resolvedBody = body;
  if (body !== undefined) {
    const out = substitute(body, variables);
    resolvedBody = out.text;
    collect(out.missing);
  }

  return {
    request: {
      method,
      url: resolvedUrl.text,
      headers: resolvedHeaders.map,
      params: resolvedParams.map,
      body: resolvedBody,
    },
    missingVariables: missing,
    auth,
  };
}
