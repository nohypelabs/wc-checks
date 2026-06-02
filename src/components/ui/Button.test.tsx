import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
 describe('Rendering', () => {
 it('should render button with children', () => {
 render(<Button>Click me</Button>)
 expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
 })

 it('should render with default variant and size', () => {
 render(<Button>Default Button</Button>)
 const button = screen.getByRole('button')
 expect(button).toHaveClass('bg-blue-600') // primary variant
 expect(button).toHaveClass('px-4') // md size
 })
 })

 describe('Variants', () => {
 it('should render primary variant', () => {
 render(<Button variant="primary">Primary</Button>)
 const button = screen.getByRole('button')
 expect(button).toHaveClass('bg-blue-600')
 expect(button).toHaveClass('text-white')
 })

 it('should render secondary variant', () => {
 render(<Button variant="secondary">Secondary</Button>)
 const button = screen.getByRole('button')
 expect(button).toHaveClass('bg-gray-600')
 expect(button).toHaveClass('text-white')
 })

 it('should render outline variant', () => {
 render(<Button variant="outline">Outline</Button>)
 const button = screen.getByRole('button')
 expect(button).toHaveClass('border')
 expect(button).toHaveClass('text-gray-700')
 })
 })

 describe('Sizes', () => {
 it('should render small size', () => {
 render(<Button size="sm">Small</Button>)
 const button = screen.getByRole('button')
 expect(button).toHaveClass('px-3')
 expect(button).toHaveClass('py-2')
 expect(button).toHaveClass('text-sm')
 })

 it('should render medium size', () => {
 render(<Button size="md">Medium</Button>)
 const button = screen.getByRole('button')
 expect(button).toHaveClass('px-4')
 expect(button).toHaveClass('py-3')
 })

 it('should render large size', () => {
 render(<Button size="lg">Large</Button>)
 const button = screen.getByRole('button')
 expect(button).toHaveClass('px-6')
 expect(button).toHaveClass('py-4')
 expect(button).toHaveClass('text-base')
 })
 })

 describe('Loading State', () => {
 it('should show loading spinner when loading', () => {
 render(<Button loading>Submit</Button>)
 expect(screen.getByText('Loading...')).toBeInTheDocument()
 expect(screen.queryByText('Submit')).not.toBeInTheDocument()
 })

 it('should disable button when loading', () => {
 render(<Button loading>Submit</Button>)
 expect(screen.getByRole('button')).toBeDisabled()
 })

 it('should add opacity class when loading', () => {
 render(<Button loading>Submit</Button>)
 expect(screen.getByRole('button')).toHaveClass('opacity-50')
 })
 })

 describe('Disabled State', () => {
 it('should disable button when disabled prop is true', () => {
 render(<Button disabled>Disabled</Button>)
 expect(screen.getByRole('button')).toBeDisabled()
 })

 it('should add disabled classes', () => {
 render(<Button disabled>Disabled</Button>)
 const button = screen.getByRole('button')
 expect(button).toHaveClass('opacity-50')
 expect(button).toHaveClass('cursor-not-allowed')
 })
 })

 describe('Click Handling', () => {
 it('should call onClick handler when clicked', async () => {
 const handleClick = vi.fn()
 const user = userEvent.setup()

 render(<Button onClick={handleClick}>Click me</Button>)
 await user.click(screen.getByRole('button'))

 expect(handleClick).toHaveBeenCalledTimes(1)
 })

 it('should not call onClick when disabled', async () => {
 const handleClick = vi.fn()
 const user = userEvent.setup()

 render(<Button disabled onClick={handleClick}>Click me</Button>)
 await user.click(screen.getByRole('button'))

 expect(handleClick).not.toHaveBeenCalled()
 })

 it('should not call onClick when loading', async () => {
 const handleClick = vi.fn()
 const user = userEvent.setup()

 render(<Button loading onClick={handleClick}>Click me</Button>)
 await user.click(screen.getByRole('button'))

 expect(handleClick).not.toHaveBeenCalled()
 })
 })

 describe('Custom Props', () => {
 it('should accept custom className', () => {
 render(<Button className="custom-class">Button</Button>)
 expect(screen.getByRole('button')).toHaveClass('custom-class')
 })

 it('should pass through HTML button attributes', () => {
 render(<Button type="submit" name="submit-btn">Submit</Button>)
 const button = screen.getByRole('button')
 expect(button).toHaveAttribute('type', 'submit')
 expect(button).toHaveAttribute('name', 'submit-btn')
 })

 it('should forward aria attributes', () => {
 render(
 <Button aria-label="Close dialog" aria-pressed="true">
 Close
 </Button>
 )
 const button = screen.getByRole('button')
 expect(button).toHaveAttribute('aria-label', 'Close dialog')
 expect(button).toHaveAttribute('aria-pressed', 'true')
 })
 })

 describe('Accessibility', () => {
 it('should have focus styles', () => {
 render(<Button>Focus me</Button>)
 expect(screen.getByRole('button')).toHaveClass('focus:outline-none')
 expect(screen.getByRole('button')).toHaveClass('focus:ring-2')
 })

 it('should be keyboard accessible', async () => {
 const handleClick = vi.fn()
 const user = userEvent.setup()

 render(<Button onClick={handleClick}>Press me</Button>)
 const button = screen.getByRole('button')

 button.focus()
 await user.keyboard('{Enter}')

 expect(handleClick).toHaveBeenCalled()
 })
 })
})
