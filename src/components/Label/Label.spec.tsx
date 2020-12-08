import { render } from '@testing-library/react'
import React from 'react'

import { Label } from './Label'

describe('components', () => {
  describe('Label', () => {
    it('renders Label with text', () => {
      const { container } = render(<Label className="test">Label with text</Label>)
      const label = container.querySelector('label')

      expect(label.className.split(' ')).toContain('test')
    })
  })
})
