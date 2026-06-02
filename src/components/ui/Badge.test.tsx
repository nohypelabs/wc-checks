import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, StatusBadge, ScoreBadge } from './Badge'

describe('Badge', () => {
 describe('Rendering', () => {
 it('should render badge with children', () => {
 render(<Badge>Test Badge</Badge>)
 expect(screen.getByText('Test Badge')).toBeInTheDocument()
 })

 it('should render with default variant', () => {
 render(<Badge>Default</Badge>)
 const badge = screen.getByText('Default')
 expect(badge).toHaveClass('bg-gray-100')
 expect(badge).toHaveClass('text-gray-700')
 })
 })

 describe('Variants', () => {
 it('should render success variant', () => {
 render(<Badge variant="success">Success</Badge>)
 expect(screen.getByText('Success')).toHaveClass('badge-success')
 })

 it('should render warning variant', () => {
 render(<Badge variant="warning">Warning</Badge>)
 expect(screen.getByText('Warning')).toHaveClass('badge-warning')
 })

 it('should render danger variant', () => {
 render(<Badge variant="danger">Danger</Badge>)
 expect(screen.getByText('Danger')).toHaveClass('badge-danger')
 })

 it('should render info variant', () => {
 render(<Badge variant="info">Info</Badge>)
 expect(screen.getByText('Info')).toHaveClass('badge-info')
 })
 })

 describe('Sizes', () => {
 it('should render small size', () => {
 render(<Badge size="sm">Small</Badge>)
 const badge = screen.getByText('Small')
 expect(badge).toHaveClass('text-xs')
 expect(badge).toHaveClass('px-2')
 })

 it('should render medium size', () => {
 render(<Badge size="md">Medium</Badge>)
 const badge = screen.getByText('Medium')
 expect(badge).toHaveClass('text-sm')
 expect(badge).toHaveClass('px-3')
 })

 it('should render large size', () => {
 render(<Badge size="lg">Large</Badge>)
 const badge = screen.getByText('Large')
 expect(badge).toHaveClass('text-base')
 expect(badge).toHaveClass('px-4')
 })
 })

 describe('Icon', () => {
 it('should render with icon', () => {
 render(
 <Badge icon={<span data-testid="icon">🔔</span>}>
 Notification
 </Badge>
 )
 expect(screen.getByTestId('icon')).toBeInTheDocument()
 expect(screen.getByText('Notification')).toBeInTheDocument()
 })
 })

 describe('Dot Indicator', () => {
 it('should render dot indicator when dot prop is true', () => {
 const { container } = render(<Badge dot>With Dot</Badge>)
 const dot = container.querySelector('.w-1\\.5')
 expect(dot).toBeInTheDocument()
 })

 it('should render green dot for success variant', () => {
 const { container } = render(
 <Badge variant="success" dot>
 Success
 </Badge>
 )
 const dot = container.querySelector('.bg-green-600')
 expect(dot).toBeInTheDocument()
 })

 it('should render yellow dot for warning variant', () => {
 const { container } = render(
 <Badge variant="warning" dot>
 Warning
 </Badge>
 )
 const dot = container.querySelector('.bg-yellow-600')
 expect(dot).toBeInTheDocument()
 })

 it('should render red dot for danger variant', () => {
 const { container } = render(
 <Badge variant="danger" dot>
 Danger
 </Badge>
 )
 const dot = container.querySelector('.bg-red-600')
 expect(dot).toBeInTheDocument()
 })
 })
})

describe('StatusBadge', () => {
 describe('Rendering', () => {
 it('should render excellent status', () => {
 render(<StatusBadge status="excellent" />)
 expect(screen.getByText('Excellent')).toBeInTheDocument()
 expect(screen.getByText('😊')).toBeInTheDocument()
 })

 it('should render good status', () => {
 render(<StatusBadge status="good" />)
 expect(screen.getByText('Good')).toBeInTheDocument()
 expect(screen.getByText('🙂')).toBeInTheDocument()
 })

 it('should render fair status', () => {
 render(<StatusBadge status="fair" />)
 expect(screen.getByText('Fair')).toBeInTheDocument()
 expect(screen.getByText('😐')).toBeInTheDocument()
 })

 it('should render poor status', () => {
 render(<StatusBadge status="poor" />)
 expect(screen.getByText('Poor')).toBeInTheDocument()
 expect(screen.getByText('😕')).toBeInTheDocument()
 })

 it('should render pending status', () => {
 render(<StatusBadge status="pending" />)
 expect(screen.getByText('Pending')).toBeInTheDocument()
 expect(screen.getByText('⏳')).toBeInTheDocument()
 })

 it('should render completed status', () => {
 render(<StatusBadge status="completed" />)
 expect(screen.getByText('Completed')).toBeInTheDocument()
 expect(screen.getByText('✅')).toBeInTheDocument()
 })

 it('should render verified status', () => {
 render(<StatusBadge status="verified" />)
 expect(screen.getByText('Verified')).toBeInTheDocument()
 expect(screen.getByText('✅')).toBeInTheDocument()
 })
 })

 describe('Icon Display', () => {
 it('should show icon by default', () => {
 render(<StatusBadge status="excellent" />)
 expect(screen.getByText('😊')).toBeInTheDocument()
 })

 it('should hide icon when showIcon is false', () => {
 render(<StatusBadge status="excellent" showIcon={false} />)
 expect(screen.queryByText('😊')).not.toBeInTheDocument()
 expect(screen.getByText('Excellent')).toBeInTheDocument()
 })
 })
})

describe('ScoreBadge', () => {
 describe('Score Display', () => {
 it('should display score', () => {
 render(<ScoreBadge score={85} />)
 expect(screen.getByText('85')).toBeInTheDocument()
 })

 it('should display max score by default', () => {
 render(<ScoreBadge score={85} />)
 expect(screen.getByText('/ 100')).toBeInTheDocument()
 })

 it('should hide max score when showLabel is false', () => {
 render(<ScoreBadge score={85} showLabel={false} />)
 expect(screen.queryByText('/ 100')).not.toBeInTheDocument()
 expect(screen.getByText('85')).toBeInTheDocument()
 })

 it('should accept custom max score', () => {
 render(<ScoreBadge score={45} maxScore={50} />)
 expect(screen.getByText('/ 50')).toBeInTheDocument()
 })
 })

 describe('Variant Based on Score', () => {
 it('should use success variant for score >= 80%', () => {
 const { container } = render(<ScoreBadge score={85} />)
 const badge = container.querySelector('.badge-success')
 expect(badge).toBeInTheDocument()
 expect(screen.getByText('😊')).toBeInTheDocument()
 })

 it('should use success variant for exactly 80%', () => {
 const { container } = render(<ScoreBadge score={80} />)
 const badge = container.querySelector('.badge-success')
 expect(badge).toBeInTheDocument()
 })

 it('should use warning variant for score >= 60% and < 80%', () => {
 const { container } = render(<ScoreBadge score={70} />)
 const badge = container.querySelector('.badge-warning')
 expect(badge).toBeInTheDocument()
 expect(screen.getByText('😐')).toBeInTheDocument()
 })

 it('should use warning variant for exactly 60%', () => {
 const { container } = render(<ScoreBadge score={60} />)
 const badge = container.querySelector('.badge-warning')
 expect(badge).toBeInTheDocument()
 })

 it('should use danger variant for score < 60%', () => {
 const { container } = render(<ScoreBadge score={50} />)
 const badge = container.querySelector('.badge-danger')
 expect(badge).toBeInTheDocument()
 expect(screen.getByText('😟')).toBeInTheDocument()
 })
 })

 describe('Percentage Calculation', () => {
 it('should calculate percentage with custom maxScore', () => {
 // 40/50 = 80% -> should be success
 const { container } = render(<ScoreBadge score={40} maxScore={50} />)
 const badge = container.querySelector('.badge-success')
 expect(badge).toBeInTheDocument()
 })

 it('should calculate percentage correctly for edge cases', () => {
 // 30/50 = 60% -> should be warning
 const { container } = render(<ScoreBadge score={30} maxScore={50} />)
 const badge = container.querySelector('.badge-warning')
 expect(badge).toBeInTheDocument()
 })
 })

 describe('Large Size', () => {
 it('should render with large size', () => {
 const { container } = render(<ScoreBadge score={85} />)
 const badge = container.querySelector('.text-base')
 expect(badge).toBeInTheDocument()
 })
 })
})
