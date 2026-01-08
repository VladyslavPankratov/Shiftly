import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToastStore, toast } from './toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToastStore.setState({ toasts: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('addToast', () => {
    it('should add a toast to the store', () => {
      const id = useToastStore.getState().addToast({
        type: 'success',
        title: 'Test Toast',
        message: 'This is a test',
      });

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0]).toMatchObject({
        id,
        type: 'success',
        title: 'Test Toast',
        message: 'This is a test',
        duration: 5000, // default
      });
    });

    it('should auto-dismiss toast after duration', () => {
      useToastStore.getState().addToast({
        type: 'info',
        title: 'Auto dismiss',
        duration: 3000,
      });

      expect(useToastStore.getState().toasts).toHaveLength(1);

      vi.advanceTimersByTime(3000);

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('should not auto-dismiss when duration is 0', () => {
      useToastStore.getState().addToast({
        type: 'error',
        title: 'Persistent',
        duration: 0,
      });

      vi.advanceTimersByTime(10000);

      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe('removeToast', () => {
    it('should remove a specific toast by id', () => {
      const id1 = useToastStore.getState().addToast({
        type: 'success',
        title: 'Toast 1',
        duration: 0,
      });
      const id2 = useToastStore.getState().addToast({
        type: 'error',
        title: 'Toast 2',
        duration: 0,
      });

      expect(useToastStore.getState().toasts).toHaveLength(2);

      useToastStore.getState().removeToast(id1);

      const { toasts } = useToastStore.getState();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].id).toBe(id2);
    });
  });

  describe('clearAll', () => {
    it('should remove all toasts', () => {
      useToastStore.getState().addToast({ type: 'success', title: 'Toast 1', duration: 0 });
      useToastStore.getState().addToast({ type: 'error', title: 'Toast 2', duration: 0 });
      useToastStore.getState().addToast({ type: 'info', title: 'Toast 3', duration: 0 });

      expect(useToastStore.getState().toasts).toHaveLength(3);

      useToastStore.getState().clearAll();

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });

  describe('toast convenience functions', () => {
    it('toast.success should add success toast', () => {
      toast.success('Success!', 'Operation completed');

      const { toasts } = useToastStore.getState();
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].title).toBe('Success!');
    });

    it('toast.error should add error toast', () => {
      toast.error('Error!', 'Something went wrong');

      const { toasts } = useToastStore.getState();
      expect(toasts[0].type).toBe('error');
    });

    it('toast.warning should add warning toast', () => {
      toast.warning('Warning!');

      const { toasts } = useToastStore.getState();
      expect(toasts[0].type).toBe('warning');
    });

    it('toast.info should add info toast', () => {
      toast.info('Info');

      const { toasts } = useToastStore.getState();
      expect(toasts[0].type).toBe('info');
    });

    it('toast.dismiss should remove specific toast', () => {
      const id = toast.success('Test', undefined, 0);
      expect(useToastStore.getState().toasts).toHaveLength(1);

      toast.dismiss(id);
      expect(useToastStore.getState().toasts).toHaveLength(0);
    });

    it('toast.dismissAll should clear all toasts', () => {
      toast.success('Toast 1', undefined, 0);
      toast.error('Toast 2', undefined, 0);

      toast.dismissAll();

      expect(useToastStore.getState().toasts).toHaveLength(0);
    });
  });
});
