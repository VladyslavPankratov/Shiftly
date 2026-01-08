import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render children correctly', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should apply default variant and size', () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-500');
      expect(button).toHaveClass('px-4', 'py-2');
    });
  });

  describe('variants', () => {
    it('should apply primary variant styles', () => {
      render(<Button variant="primary">Primary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-primary-500');
    });

    it('should apply secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-gray-200');
    });

    it('should apply danger variant styles', () => {
      render(<Button variant="danger">Danger</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-red-500');
    });

    it('should apply ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-transparent');
    });
  });

  describe('sizes', () => {
    it('should apply small size styles', () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('should apply medium size styles', () => {
      render(<Button size="md">Medium</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-base');
    });

    it('should apply large size styles', () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-lg');
    });
  });

  describe('states', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should be disabled when isLoading is true', () => {
      render(<Button isLoading>Loading</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show loading spinner when isLoading', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByText(/завантаження/i)).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick} disabled>Click me</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when isLoading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick} isLoading>Click me</Button>);
      await user.click(screen.getByRole('button'));

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('custom className', () => {
    it('should merge custom className with default styles', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('bg-primary-500'); // still has default styles
    });
  });

  describe('HTML attributes', () => {
    it('should pass through HTML button attributes', () => {
      render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
      const button = screen.getByTestId('submit-btn');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });
});
