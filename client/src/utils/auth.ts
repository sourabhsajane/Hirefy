export interface User {
  id: string;
  email: string;
  name: string;
  role: 'candidate' | 'recruiter' | 'admin';
}

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const getUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setAuth = (token: string, user: User): void => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  // Trigger custom event for navbar updates
  window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user } }));
};

export const clearAuth = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Trigger custom event for navbar updates
  window.dispatchEvent(new CustomEvent('authStateChanged', { detail: { user: null } }));
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

export const hasRole = (role: string): boolean => {
  const user = getUser();
  return user?.role === role;
};
