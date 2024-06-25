import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotFound from '../components/NotFound';
import { InlineNotification } from '@carbon/react';
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));
jest.mock('@carbon/react', () => ({
  InlineNotification: jest.fn(() => <div />),
}));

describe('NotFound component', () => {
  it('renders without crashing', () => {
    render(<NotFound />);
    expect(InlineNotification).toHaveBeenCalled();
  });
});
