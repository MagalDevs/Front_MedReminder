'use client';

/**
 * Utility for making authenticated API requests
 */
export const API_URL = 'https://medreminder-backend.onrender.com';

interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Makes an authenticated API request with the stored token
 * 
 * @param endpoint - API endpoint (without the base URL)
 * @param options - Fetch options including method, body, etc.
 * @returns Response data or throws error
 */
export async function apiRequest<T = unknown>(
  endpoint: string, 
  options: FetchOptions = {}
): Promise<T> {
  const { requireAuth = true, ...fetchOptions } = options;
  
  // Build the full URL
  const url = `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Default headers
  const headers = new Headers(fetchOptions.headers);
  
  // Set default content type if sending data
  if (!headers.has('Content-Type') && (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Add auth token if required and available
  if (requireAuth) {
    const token = localStorage.getItem('access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else if (requireAuth) {
      throw new Error('Authentication required but no token found');
    }
  }
  
  // Merge options with headers
  const requestOptions: RequestInit = {
    ...fetchOptions,
    headers
  };
  
  // Make the request
  const response = await fetch(url, requestOptions);
    // Parse the response
  let data: unknown;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }  // Handle errors
  if (!response.ok) {
    // If we get a 401, the token is invalid
    if (response.status === 401 && requireAuth) {
      // Clear auth data and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    
    // More detailed logging for debugging
    console.error('API Error:', { 
      endpoint, 
      status: response.status, 
      statusText: response.statusText,
      data 
    });
    
    // Type guard to handle error messages properly
    let errorMessage = '';
    
    // Try to extract a meaningful error message from the response
    if (typeof data === 'object' && data !== null) {
      if ('message' in data && typeof data.message === 'string') {
        errorMessage = data.message;
      } else if ('error' in data && typeof data.error === 'string') {
        errorMessage = data.error;
      } else if ('errors' in data && Array.isArray(data.errors) && data.errors.length > 0) {        // Handle validation errors array
        errorMessage = Array.isArray(data.errors) 
          ? data.errors.map((e: unknown) => 
              typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string'
                ? e.message
                : String(e)
            ).join(', ')
          : JSON.stringify(data.errors);
      }
    }
    
    // If we couldn't extract a specific error message, use a generic one based on status code
    if (!errorMessage) {
      switch (response.status) {
        case 400:
          errorMessage = 'Requisição inválida';
          break;
        case 401:
          errorMessage = 'Não autorizado';
          break;
        case 403:
          errorMessage = 'Acesso negado';
          break;
        case 404:
          errorMessage = 'Recurso não encontrado';
          break;
        case 429:
          errorMessage = 'Muitas requisições. Tente novamente mais tarde';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor';
          break;
        default:
          errorMessage = `API request failed with status ${response.status}`;
      }
    }
    
    throw new Error(errorMessage);
  }
    // Even if response is OK, check if there's an error message in the response
  // Some APIs return error messages with 200 status codes
  if (typeof data === 'object' && data !== null && 
      'message' in data && typeof data.message === 'string' &&
      !('access_token' in data) &&
      !('success' in data && data.success === true)) {
    console.warn('Server returned message in successful response:', data.message);
    
    // Check for specific error indicators despite 200 status
    if ('error' in data || 
        ('status' in data && data.status === 'error') ||
        ('success' in data && data.success === false)) {
      throw new Error(typeof data.message === 'string' ? data.message : 'API request failed');
    }
  }// Return the data as type T
  return data as T;
}
