
// Admin API client with token-based authentication
const getAdminToken = (): string | null => {
  return localStorage.getItem('adminToken');
};

export const adminApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAdminToken();
  
  if (!token) {
    throw new Error('Admin authentication required');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
      throw new Error('Admin session expired');
    }
    
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export const isAdminAuthenticated = (): boolean => {
  const token = getAdminToken();
  const userStr = localStorage.getItem('adminUser');
  
  if (!token || !userStr) return false;
  
  try {
    const user = JSON.parse(userStr);
    return user.isAdmin === true;
  } catch {
    return false;
  }
};
