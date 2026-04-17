const apiVersionHeaderName = "X-Api-Version";
const correlationIdHeaderName = "X-Correlation-Id";
const csrfHeaderName = "X-CSRF-TOKEN";
const retryAfterHeaderName = "Retry-After";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiRequestOptions = {
  path: `/api${string}`;
  method?: RequestMethod;
  body?: BodyInit | FormData | URLSearchParams | Record<string, unknown>;
  headers?: HeadersInit;
  signal?: AbortSignal;
  expectJson?: boolean;
};

export type ApiResponse<TData> = {
  data: TData;
  correlationId: string | null;
  response: Response;
};

export type TenantLeaseSummary = {
  expiresAt: string;
  secondsRemaining: number;
  extensionCount: number;
  maxExtensions: number;
  canExtend: boolean;
};

export type ProvisionRequest = {
  tenantName: string;
  challengeToken: string;
};

export type ProvisionCredentials = {
  email: string;
  password: string;
};

export type ProvisionResponse = {
  tenantId: string;
  tenantSlug: string;
  expiresAt: string;
  redirectUrl: string;
  credentials: ProvisionCredentials;
};

export type LoginRequest = {
  email: string;
  password: string;
  challengeToken: string;
};

export type LoginResponse = {
  redirectUrl: string;
};

type ProblemDetailsLike = {
  title?: string;
  status?: number;
  detail?: string;
  errorCode?: string;
  correlationId?: string;
  traceId?: string;
  errors?: Record<string, string[]>;
};

type PaperBinderApiClientOptions = {
  apiOrigin: string;
  fetchFn?: typeof fetch;
  cookieSource?: () => string;
  nowProvider?: () => number;
};

function isUnsafeMethod(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

function readCsrfToken(cookieSource: string): string | null {
  for (const rawPart of cookieSource.split(";")) {
    const [rawName, ...rawValueParts] = rawPart.trim().split("=");
    if (!rawName || !rawName.endsWith(".csrf")) {
      continue;
    }

    return decodeURIComponent(rawValueParts.join("="));
  }

  return null;
}

function parseRetryAfter(value: string | null, nowProvider: () => number): number | null {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const seconds = Number.parseInt(trimmedValue, 10);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds);
  }

  const retryAt = Date.parse(trimmedValue);
  if (Number.isNaN(retryAt)) {
    return null;
  }

  return Math.max(0, Math.ceil((retryAt - nowProvider()) / 1000));
}

async function tryReadJsonBody<TValue>(response: Response): Promise<TValue | null> {
  const responseText = await response.text();
  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as TValue;
  } catch {
    return null;
  }
}

export class PaperBinderApiError extends Error {
  readonly status: number | null;
  readonly errorCode: string | null;
  readonly detail: string | null;
  readonly correlationId: string | null;
  readonly retryAfterSeconds: number | null;
  readonly traceId: string | null;
  readonly validationErrors: Record<string, string[]> | null;

  constructor({
    message,
    status,
    errorCode,
    detail,
    correlationId,
    retryAfterSeconds,
    traceId,
    validationErrors
  }: {
    message: string;
    status: number | null;
    errorCode: string | null;
    detail: string | null;
    correlationId: string | null;
    retryAfterSeconds: number | null;
    traceId: string | null;
    validationErrors: Record<string, string[]> | null;
  }) {
    super(message);
    this.name = "PaperBinderApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.detail = detail;
    this.correlationId = correlationId;
    this.retryAfterSeconds = retryAfterSeconds;
    this.traceId = traceId;
    this.validationErrors = validationErrors;
  }
}

function createUnexpectedApiError(response: Response, correlationId: string | null): PaperBinderApiError {
  return new PaperBinderApiError({
    message: `Unexpected API failure (${response.status}).`,
    status: response.status,
    errorCode: null,
    detail: response.statusText || "Unexpected API failure.",
    correlationId,
    retryAfterSeconds: null,
    traceId: null,
    validationErrors: null
  });
}

async function createApiError(
  response: Response,
  nowProvider: () => number,
  correlationId: string | null
): Promise<PaperBinderApiError> {
  const problem = await tryReadJsonBody<ProblemDetailsLike>(response);
  const retryAfterSeconds = parseRetryAfter(response.headers.get(retryAfterHeaderName), nowProvider);

  if (problem === null) {
    return createUnexpectedApiError(response, correlationId);
  }

  return new PaperBinderApiError({
    message: problem.detail ?? problem.title ?? `HTTP ${problem.status ?? response.status}`,
    status: problem.status ?? response.status,
    errorCode: problem.errorCode ?? null,
    detail: problem.detail ?? problem.title ?? null,
    correlationId: problem.correlationId ?? correlationId,
    retryAfterSeconds,
    traceId: problem.traceId ?? null,
    validationErrors: problem.errors ?? null
  });
}

function createNetworkError(error: unknown): PaperBinderApiError {
  const message = error instanceof Error ? error.message : "Network request failed.";

  return new PaperBinderApiError({
    message,
    status: null,
    errorCode: null,
    detail: message,
    correlationId: null,
    retryAfterSeconds: null,
    traceId: null,
    validationErrors: null
  });
}

function isBodyInit(value: unknown): value is BodyInit | FormData | URLSearchParams {
  return (
    typeof value === "string" ||
    value instanceof Blob ||
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  );
}

export function createPaperBinderApiClient({
  apiOrigin,
  fetchFn = fetch,
  cookieSource = () => document.cookie,
  nowProvider = () => Date.now()
}: PaperBinderApiClientOptions) {
  async function request<TData>({
    path,
    method,
    body,
    headers,
    signal,
    expectJson = true
  }: ApiRequestOptions): Promise<ApiResponse<TData>> {
    const resolvedMethod = method ?? (body === undefined ? "GET" : "POST");
    const requestHeaders = new Headers(headers);
    requestHeaders.set(apiVersionHeaderName, "1");

    let requestBody: BodyInit | undefined;
    if (body !== undefined) {
      if (isBodyInit(body)) {
        requestBody = body;
      } else {
        requestHeaders.set("Content-Type", "application/json");
        requestBody = JSON.stringify(body);
      }
    }

    if (isUnsafeMethod(resolvedMethod)) {
      const csrfToken = readCsrfToken(cookieSource());
      if (csrfToken) {
        requestHeaders.set(csrfHeaderName, csrfToken);
      }
    }

    const requestUrl = new URL(path, apiOrigin).toString();

    let response: Response;
    try {
      response = await fetchFn(requestUrl, {
        method: resolvedMethod,
        headers: requestHeaders,
        body: requestBody,
        credentials: "include",
        signal
      });
    } catch (error) {
      throw createNetworkError(error);
    }

    const correlationId = response.headers.get(correlationIdHeaderName);
    if (!response.ok) {
      throw await createApiError(response, nowProvider, correlationId);
    }

    if (!expectJson || response.status === 204) {
      return {
        data: undefined as TData,
        correlationId,
        response
      };
    }

    const payload = await tryReadJsonBody<TData>(response);
    return {
      data: (payload ?? (undefined as TData)),
      correlationId,
      response
    };
  }

  return {
    request,
    async getTenantLease(signal?: AbortSignal): Promise<TenantLeaseSummary> {
      const response = await request<TenantLeaseSummary>({
        path: "/api/tenant/lease",
        signal
      });

      return response.data;
    },
    async provision(body: ProvisionRequest, signal?: AbortSignal): Promise<ProvisionResponse> {
      const response = await request<ProvisionResponse>({
        path: "/api/provision",
        method: "POST",
        body,
        signal
      });

      return response.data;
    },
    async login(body: LoginRequest, signal?: AbortSignal): Promise<LoginResponse> {
      const response = await request<LoginResponse>({
        path: "/api/auth/login",
        method: "POST",
        body,
        signal
      });

      return response.data;
    }
  };
}

export type PaperBinderApiClient = ReturnType<typeof createPaperBinderApiClient>;
