import { render, screen } from '@testing-library/react'
import React from 'react'

import { Button } from './Button'

describe('components', () => {
  describe('Button', () => {
    it('renders button with text', () => {
      render(<Button>button with text</Button>)
      expect(screen.getByRole('button')).toHaveTextContent('button with text')
    })
  })
})
