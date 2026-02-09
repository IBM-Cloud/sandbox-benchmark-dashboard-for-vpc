
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfigurationPage from '../content/configuration/configuration';

// Mock child component
jest.mock('../content/configuration/configurationDetails', () => () => <div data-testid="configuration-details">Mocked Details</div>);

// Mock Carbon Components
jest.mock('@carbon/react', () => ({
    Grid: ({ children, className }) => <div className={className}>{children}</div>,
    Column: ({ children, className }) => <div className={className}>{children}</div>,
}));

// Mock Translation
jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

describe('ConfigurationPage', () => {
    it('renders correct heading using translation', () => {
        render(<ConfigurationPage />);
        expect(screen.getByText('configurationDetails')).toBeInTheDocument();
        expect(screen.getByText('configurationDetails')).toHaveClass('landing-page__heading', 'common-heading');
    });

    it('renders ConfigurationDetails component', () => {
        render(<ConfigurationPage />);
        expect(screen.getByTestId('configuration-details')).toBeInTheDocument();
    });

    it('renders with correct layout classes', () => {
        const { container } = render(<ConfigurationPage />);
        expect(container.querySelector('.benchmark-page')).toBeInTheDocument();
        expect(container.querySelector('.benchmark-page__r1')).toBeInTheDocument();
    });
});
