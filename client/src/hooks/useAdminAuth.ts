
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface AdminUser {
  id: string;
  username: string;
  firstName: string;
  email: string;
  isAdmin: boolean;
}

export const useAdminAuth = () => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    const checkAdminAuth = () => {
      const token = localStorage.getItem('adminToken');
      const userStr = localStorage.getItem('adminUser');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.isAdmin) {
            setAdminUser(user);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Error parsing admin user:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAdminAuth();
  }, []);

  const login = (user: AdminUser, token: string) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminUser', JSON.stringify(user));
    setAdminUser(user);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdminUser(null);
    navigate('/admin/login');
  };

  const isAdmin = !!adminUser?.isAdmin;

  return {
    adminUser,
    isAdmin,
    isLoading,
    login,
    logout
  };
};
