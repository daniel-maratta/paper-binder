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

export type LogoutResponse = {
  redirectUrl: string;
};

export type TenantRole = "TenantAdmin" | "BinderWrite" | "BinderRead";

export type BinderSummary = {
  binderId: string;
  name: string;
  createdAt: string;
};

export type ListBindersResponse = {
  binders: BinderSummary[];
};

export type CreateBinderRequest = {
  name: string;
};

export type DocumentSummary = {
  documentId: string;
  binderId: string;
  title: string;
  contentType: string;
  supersedesDocumentId: string | null;
  createdAt: string;
  archivedAt: string | null;
};

export type BinderDetail = BinderSummary & {
  documents: DocumentSummary[];
};

export type BinderPolicyMode = "inherit" | "restricted_roles";

export type BinderPolicy = {
  mode: BinderPolicyMode;
  allowedRoles: TenantRole[];
};

export type UpdateBinderPolicyRequest = BinderPolicy;

export type DocumentDetail = DocumentSummary & {
  content: string;
};

export type CreateDocumentRequest = {
  binderId: string;
  title: string;
  contentType: "markdown";
  content: string;
  supersedesDocumentId?: string | null;
};

export type TenantUser = {
  userId: string;
  email: string;
  role: TenantRole;
  isOwner: boolean;
};

export type TenantImpersonationUser = {
  userId: string;
  email: string;
  role: TenantRole;
};

export type TenantImpersonationStatus = {
  isImpersonating: boolean;
  actor: TenantImpersonationUser;
  effective: TenantImpersonationUser;
};

export type ListTenantUsersResponse = {
  users: TenantUser[];
};

export type CreateTenantUserRequest = {
  email: string;
  password: string;
  role: TenantRole;
};

export type UpdateTenantUserRoleRequest = {
  role: TenantRole;
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
    async extendTenantLease(signal?: AbortSignal): Promise<TenantLeaseSummary> {
      const response = await request<TenantLeaseSummary>({
        path: "/api/tenant/lease/extend",
        method: "POST",
        body: {},
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
    },
    async logout(signal?: AbortSignal): Promise<LogoutResponse> {
      const response = await request<LogoutResponse>({
        path: "/api/auth/logout",
        method: "POST",
        body: {},
        signal
      });

      return response.data;
    },
    async getImpersonationStatus(signal?: AbortSignal): Promise<TenantImpersonationStatus> {
      const response = await request<TenantImpersonationStatus>({
        path: "/api/tenant/impersonation",
        signal
      });

      return response.data;
    },
    async startImpersonation(
      userId: string,
      signal?: AbortSignal
    ): Promise<TenantImpersonationStatus> {
      const response = await request<TenantImpersonationStatus>({
        path: "/api/tenant/impersonation",
        method: "POST",
        body: { userId },
        signal
      });

      return response.data;
    },
    async stopImpersonation(signal?: AbortSignal): Promise<TenantImpersonationStatus> {
      const response = await request<TenantImpersonationStatus>({
        path: "/api/tenant/impersonation",
        method: "DELETE",
        body: {},
        signal
      });

      return response.data;
    },
    async listBinders(signal?: AbortSignal): Promise<BinderSummary[]> {
      const response = await request<ListBindersResponse>({
        path: "/api/binders",
        signal
      });

      return response.data.binders;
    },
    async createBinder(body: CreateBinderRequest, signal?: AbortSignal): Promise<BinderSummary> {
      const response = await request<BinderSummary>({
        path: "/api/binders",
        method: "POST",
        body,
        signal
      });

      return response.data;
    },
    async getBinderDetail(binderId: string, signal?: AbortSignal): Promise<BinderDetail> {
      const response = await request<BinderDetail>({
        path: `/api/binders/${encodeURIComponent(binderId)}`,
        signal
      });

      return response.data;
    },
    async getBinderPolicy(binderId: string, signal?: AbortSignal): Promise<BinderPolicy> {
      const response = await request<BinderPolicy>({
        path: `/api/binders/${encodeURIComponent(binderId)}/policy`,
        signal
      });

      return response.data;
    },
    async updateBinderPolicy(
      binderId: string,
      body: UpdateBinderPolicyRequest,
      signal?: AbortSignal
    ): Promise<BinderPolicy> {
      const response = await request<BinderPolicy>({
        path: `/api/binders/${encodeURIComponent(binderId)}/policy`,
        method: "PUT",
        body,
        signal
      });

      return response.data;
    },
    async getDocumentDetail(documentId: string, signal?: AbortSignal): Promise<DocumentDetail> {
      const response = await request<DocumentDetail>({
        path: `/api/documents/${encodeURIComponent(documentId)}`,
        signal
      });

      return response.data;
    },
    async createDocument(body: CreateDocumentRequest, signal?: AbortSignal): Promise<DocumentDetail> {
      const response = await request<DocumentDetail>({
        path: "/api/documents",
        method: "POST",
        body,
        signal
      });

      return response.data;
    },
    async listTenantUsers(signal?: AbortSignal): Promise<TenantUser[]> {
      const response = await request<ListTenantUsersResponse>({
        path: "/api/tenant/users",
        signal
      });

      return response.data.users;
    },
    async createTenantUser(body: CreateTenantUserRequest, signal?: AbortSignal): Promise<TenantUser> {
      const response = await request<TenantUser>({
        path: "/api/tenant/users",
        method: "POST",
        body,
        signal
      });

      return response.data;
    },
    async updateTenantUserRole(
      userId: string,
      body: UpdateTenantUserRoleRequest,
      signal?: AbortSignal
    ): Promise<TenantUser> {
      const response = await request<TenantUser>({
        path: `/api/tenant/users/${encodeURIComponent(userId)}/role`,
        method: "POST",
        body,
        signal
      });

      return response.data;
    }
  };
}

export type PaperBinderApiClient = ReturnType<typeof createPaperBinderApiClient>;
