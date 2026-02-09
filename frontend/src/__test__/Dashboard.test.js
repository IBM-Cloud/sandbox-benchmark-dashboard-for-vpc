import React, { useContext } from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RepoPage from '../content/Dashboard/dashboard';
import CommonUIContext from '../content/component/CommonUIContext';

jest.mock('../components/theme', () => () => false);

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('../content/api/api', () => ({
  getMetadata: jest.fn(),
  getAllInstances: jest.fn(),
  getPrestoRunLists: jest.fn(() => Promise.resolve({ ListTest: [] })),
  getMonteCarloRunLists: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../content/Dashboard/byoReport', () => ({ showPollFlagStatus }) => {
  return <div data-testid="mock-ByoReport" onClick={() => showPollFlagStatus && showPollFlagStatus('someFlagStatus')}>Byo Report</div>;
});
jest.mock('../content/Dashboard/monteCarloReport', () => () => <div data-testid="mock-monteCarloReport">Monte Carlo Report</div>);
jest.mock('../content/Dashboard/huggingReport', () => () => <div data-testid="mock-HuggingReport">Hugging Report</div>);
jest.mock('../content/Dashboard/prestoReport', () => () => <div data-testid="mock-PrestoReport">Presto Report</div>);

describe('RepoPage Component', () => {
  const setByoState = jest.fn();
  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (contextValue) => render(
    <CommonUIContext.Provider value={contextValue}>
      <RepoPage />
    </CommonUIContext.Provider>
  );

  it('renders RepoPage component with tabs', async () => {
    renderComponent({ setByoState });
    const monteElement = await screen.findByText('monte.title');
    expect(monteElement).toBeVisible();
    const huggingElement = await screen.findByText('hugging.title');
    expect(huggingElement).toBeVisible();
    const byoElement = await screen.findByText('byoApp');
    expect(byoElement).toBeVisible();
  });

  it('renders MonteCarloReport tab panel on clicking Monte Carlo tab', () => {
    renderComponent({ setByoState });
    expect(screen.getByText('monte.title')).toBeInTheDocument();
    fireEvent.click(screen.getByText('monte.title'));
    const subheading = screen.getByTestId('mock-monteCarloReport');
    expect(subheading.textContent).toBe('Monte Carlo Report');
  });

  it('renders AiAmxReport tab panel on clicking Hugging tab', () => {
    renderComponent({ setByoState });
    fireEvent.click(screen.getByText('hugging.title'));
    const subheading = screen.getByTestId('mock-HuggingReport');
    expect(subheading.textContent).toBe('Hugging Report');
  });

  it('renders BYOReport tab panel on clicking BYO App tab', async () => {
    renderComponent({ setByoState });
    const byoTab = screen.getByRole('tab', { name: /byoApp/i });
    fireEvent.click(byoTab);
    const byoReport = screen.getByTestId('mock-ByoReport');
    expect(byoReport).toBeInTheDocument();
    fireEvent.click(byoReport);
    expect(setByoState).toHaveBeenCalledWith('someFlagStatus');
  });
});
