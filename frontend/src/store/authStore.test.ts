import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({ user: null, isAuthenticated: false });
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have null user and isAuthenticated false', () => {
      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set user and isAuthenticated to true when user is provided', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN' as const,
        organizationId: 'org-1',
      };

      useAuthStore.getState().setUser(mockUser);

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
    });

    it('should set isAuthenticated to false when user is null', () => {
      // First set a user
      useAuthStore.getState().setUser({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        organizationId: 'org-1',
      });

      // Then clear it
      useAuthStore.getState().setUser(null);

      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear user, set isAuthenticated to false, and remove token', () => {
      // Setup: set user and token
      localStorage.setItem('token', 'test-token');
      useAuthStore.getState().setUser({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        organizationId: 'org-1',
      });

      // Act
      useAuthStore.getState().logout();

      // Assert
      const { user, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(isAuthenticated).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
    });
  });
});
