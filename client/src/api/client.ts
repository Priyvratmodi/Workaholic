export class ApiError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiBase = import.meta.env.VITE_API_URL || '';
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${apiBase}${cleanEndpoint}`;

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const defaultHeaders: Record<string, string> = isFormData
    ? {}
    : {
        'Content-Type': 'application/json',
      };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
    },
    credentials: 'include', // essential for httpOnly cookies
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorData = data?.error || {};
    throw new ApiError(
      errorData.message || `Request failed with status ${response.status}`,
      errorData.code || 'HTTP_ERROR',
      errorData.details
    );
  }

  return data?.data !== undefined ? data.data : data;
}
