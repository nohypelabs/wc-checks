import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  formatDate,
  formatTime,
  formatDateTime,
  calculateInspectionScore,
  getStatusColor,
  getStatusEmoji,
  validateImageFile,
  formatRole,
  truncateText,
  generateId,
  debounce,
  isMobileDevice,
  vibrate,
  getInitials,
  generateQRUrl,
} from './utils'

describe('Date/Time Formatting', () => {
  describe('formatDate', () => {
    it('should format valid date string to Indonesian format', () => {
      const result = formatDate('2024-01-15')
      expect(result).toMatch(/15 Januari 2024/)
    })

    it('should format Date object to Indonesian format', () => {
      const date = new Date('2024-03-20')
      const result = formatDate(date)
      expect(result).toMatch(/20 Maret 2024/)
    })

    it('should return "-" for invalid date', () => {
      const result = formatDate('invalid-date')
      expect(result).toBe('-')
    })
  })

  describe('formatTime', () => {
    it('should format valid time string', () => {
      const result = formatTime('14:30:00')
      expect(result).toBe('14:30')
    })

    it('should return original string for invalid time', () => {
      const result = formatTime('invalid')
      expect(result).toBe('invalid')
    })
  })

  describe('formatDateTime', () => {
    it('should format date with time', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = formatDateTime(date)
      expect(result).toMatch(/15 Jan 2024/)
      expect(result).toContain('14:30')
    })

    it('should return "-" for invalid date', () => {
      const result = formatDateTime('invalid')
      expect(result).toBe('-')
    })
  })
})

describe('Image Validation', () => {
  describe('validateImageFile', () => {
    it('should accept valid JPEG file', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' })
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept valid PNG file', () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' })
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    })

    it('should accept valid WebP file', () => {
      const file = new File(['content'], 'test.webp', { type: 'image/webp' })
      const result = validateImageFile(file)
      expect(result.valid).toBe(true)
    })

    it('should reject unsupported file type', () => {
      const file = new File(['content'], 'test.gif', { type: 'image/gif' })
      const result = validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Format file tidak didukung')
    })

    it('should reject file larger than 5MB', () => {
      const largeContent = new Array(6 * 1024 * 1024).fill('a').join('')
      const file = new File([largeContent], 'test.jpg', { type: 'image/jpeg' })
      const result = validateImageFile(file)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Ukuran file terlalu besar')
    })
  })
})

describe('Inspection Scoring', () => {
  describe('calculateInspectionScore', () => {
    it('should return 100 for all good responses', () => {
      const responses = {
        cleanliness: 'baik',
        toilet: 'bersih',
        soap: 'ada',
      }
      expect(calculateInspectionScore(responses)).toBe(100)
    })

    it('should return 50 for half good responses', () => {
      const responses = {
        cleanliness: 'baik',
        toilet: 'kotor',
      }
      expect(calculateInspectionScore(responses)).toBe(50)
    })

    it('should return 0 for no good responses', () => {
      const responses = {
        cleanliness: 'buruk',
        toilet: 'kotor',
      }
      expect(calculateInspectionScore(responses)).toBe(0)
    })

    it('should return 0 for empty responses', () => {
      expect(calculateInspectionScore({})).toBe(0)
    })

    it('should handle boolean values', () => {
      const responses = {
        item1: true,
        item2: false,
      }
      expect(calculateInspectionScore(responses)).toBe(50)
    })

    it('should handle object with status', () => {
      const responses = {
        item1: { status: 'good' },
        item2: { status: 'bad' },
      }
      expect(calculateInspectionScore(responses)).toBe(50)
    })
  })

  describe('getStatusColor', () => {
    it('should return green for score >= 80', () => {
      expect(getStatusColor(100)).toContain('green')
      expect(getStatusColor(80)).toContain('green')
    })

    it('should return yellow for score >= 60 and < 80', () => {
      expect(getStatusColor(70)).toContain('yellow')
      expect(getStatusColor(60)).toContain('yellow')
    })

    it('should return red for score < 60', () => {
      expect(getStatusColor(50)).toContain('red')
      expect(getStatusColor(0)).toContain('red')
    })
  })

  describe('getStatusEmoji', () => {
    it('should return happy emoji for score >= 80', () => {
      expect(getStatusEmoji(100)).toBe('😊')
      expect(getStatusEmoji(80)).toBe('😊')
    })

    it('should return neutral emoji for score >= 60 and < 80', () => {
      expect(getStatusEmoji(70)).toBe('😐')
      expect(getStatusEmoji(60)).toBe('😐')
    })

    it('should return sad emoji for score < 60', () => {
      expect(getStatusEmoji(50)).toBe('😟')
      expect(getStatusEmoji(0)).toBe('😟')
    })
  })
})

describe('Text Utilities', () => {
  describe('formatRole', () => {
    it('should format super_admin correctly', () => {
      expect(formatRole('super_admin')).toBe('Super Admin')
    })

    it('should format admin correctly', () => {
      expect(formatRole('admin')).toBe('Admin')
    })

    it('should format supervisor correctly', () => {
      expect(formatRole('supervisor')).toBe('Supervisor')
    })

    it('should format cleaner correctly', () => {
      expect(formatRole('cleaner')).toBe('Cleaner')
    })

    it('should format user correctly', () => {
      expect(formatRole('user')).toBe('User')
    })

    it('should return original string for unknown role', () => {
      expect(formatRole('unknown')).toBe('unknown')
    })
  })

  describe('truncateText', () => {
    it('should not truncate text shorter than maxLength', () => {
      expect(truncateText('Short text', 50)).toBe('Short text')
    })

    it('should truncate text longer than maxLength', () => {
      const longText = 'This is a very long text that should be truncated'
      const result = truncateText(longText, 20)
      expect(result).toBe('This is a very long ...')
      expect(result.length).toBe(23) // 20 + '...'
    })

    it('should use default maxLength of 50', () => {
      const longText = 'a'.repeat(60)
      const result = truncateText(longText)
      expect(result.length).toBe(53) // 50 + '...'
    })
  })

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('should get initials from single name', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('should handle three-word names', () => {
      expect(getInitials('John Middle Doe')).toBe('JM')
    })

    it('should convert to uppercase', () => {
      expect(getInitials('john doe')).toBe('JD')
    })
  })
})

describe('ID Generation', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('should generate ID with timestamp and random string', () => {
      const id = generateId()
      expect(id).toMatch(/^\d+-[a-z0-9]+$/)
    })
  })

  describe('generateQRUrl', () => {
    it('should generate production URL in production mode', () => {
      const url = generateQRUrl('location-123')
      expect(url).toContain('/locations/location-123')
    })

    it('should contain valid location ID', () => {
      const locationId = 'test-location-456'
      const url = generateQRUrl(locationId)
      expect(url).toContain(locationId)
    })
  })
})

describe('Function Utilities', () => {
  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(mockFn).not.toHaveBeenCalled()

      await new Promise(resolve => setTimeout(resolve, 150))
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('should pass arguments to debounced function', async () => {
      const mockFn = vi.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1', 'arg2')

      await new Promise(resolve => setTimeout(resolve, 150))
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
    })
  })
})

describe('Device Detection', () => {
  describe('isMobileDevice', () => {
    const originalNavigator = global.navigator

    beforeEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: '' },
        writable: true,
        configurable: true,
      })
    })

    it('should detect Android device', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
        writable: true,
      })
      expect(isMobileDevice()).toBe(true)
    })

    it('should detect iPhone', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
        writable: true,
      })
      expect(isMobileDevice()).toBe(true)
    })

    it('should detect iPad', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0)',
        writable: true,
      })
      expect(isMobileDevice()).toBe(true)
    })

    it('should return false for desktop', () => {
      Object.defineProperty(global.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        writable: true,
      })
      expect(isMobileDevice()).toBe(false)
    })
  })

  describe('vibrate', () => {
    it('should call navigator.vibrate if available', () => {
      const vibrateSpy = vi.fn()
      Object.defineProperty(navigator, 'vibrate', {
        value: vibrateSpy,
        writable: true,
      })

      vibrate(100)
      expect(vibrateSpy).toHaveBeenCalledWith(100)
    })

    it('should use default duration of 50ms', () => {
      const vibrateSpy = vi.fn()
      Object.defineProperty(navigator, 'vibrate', {
        value: vibrateSpy,
        writable: true,
      })

      vibrate()
      expect(vibrateSpy).toHaveBeenCalledWith(50)
    })
  })
})
