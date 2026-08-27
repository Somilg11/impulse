
// -------------------------Request Name Suggestion-------------------------
export interface RequestSuggestionParams {
  workspaceName: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url?: string;
  description?: string;
}

export interface RequestSuggestion {
  name: string;
  reasoning: string;
  confidence: number;
}

export interface RequestSuggestionResponse {
  suggestions: RequestSuggestion[];
}

// -------------------------JSON Body Generation-------------------------
export interface JsonBodyGenerationParams {
  prompt: string;
  method?: string;
  endpoint?: string;
  context?: string;
  existingSchema?: Record<string, unknown>;
}

export interface JsonBodyResponse {
  jsonBody: Record<string, unknown>;
  explanation: string;
  suggestions: string[];
}