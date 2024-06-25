import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import InlineToastNotification from '../content/component/inlineToast';
import { mockInlineToastProps, mockInlineToastErrorProps } from './utils';

describe('InlineToastNotification component', () => {
  it('renders notification when showToastContainer is true', () => {
    const { getByText } = render(<InlineToastNotification {...mockInlineToastProps} />);
    expect(getByText('Test Subtitle')).toBeInTheDocument();
    expect(getByText('Test Title')).toBeInTheDocument();
  });

  it('does not render notification when showToastContainer is false', () => {
    const { container } = render(<InlineToastNotification {...mockInlineToastErrorProps} />);
    expect(container.firstChild).toBeNull();
  });
});
