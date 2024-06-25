
global.matchMedia = global.matchMedia || function () {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
};
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import RepoPage from '../content/Dashboard/dashboard';
import CommonUIContext from '../content/component/CommonUIContext';

jest.mock('../components/theme', () => () => false);

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('../content/api/api', () => ({
  getMetadata: jest.fn(),
  getAllInstances: jest.fn(),
}));

jest.mock('../content/component/CommonUIContext', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.createContext({
      setByoState: jest.fn(),
    })
  };
});
jest.mock('../content/component/CommonUIContext');
const mockShowPollFlagStatus = jest.fn();
jest.mock('../content/Dashboard/byoReport', () => ({ showPollFlagStatus }) => {
  mockShowPollFlagStatus.mockImplementation(showPollFlagStatus);
  return <div data-testid="byoReport" />;
});
jest.mock('../content/Dashboard/monteCarloReport', () => () => <div data-testid="mock-monteCarloReport">Monte Carlo Report</div>);
jest.mock('../content/Dashboard/huggingReport', () => () => <div data-testid="mock-HuggingReport">Hugging Report</div>);
jest.mock('../content/Dashboard/byoReport', () => ({ showPollFlagStatus }) => {
  showPollFlagStatus && showPollFlagStatus('someFlagStatus');
  return <div  data-testid="mock-ByoReport">Byo Report</div>;
});

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
    render(<RepoPage />);
    const monteElement = await screen.findByText('monte.title');
    expect(monteElement).toBeVisible();
    const huggingElement = await screen.findByText('hugging.title');
    expect(huggingElement).toBeVisible();
    const byoElement = await screen.findByText('byoApp');
    expect(byoElement).toBeVisible();
  });

  it('renders MonteCarloReport tab panel on clicking Monte Carlo tab', () => {
    const { getByText, getByTestId } = render(<RepoPage />);
    expect(getByText('monte.title')).toBeInTheDocument();
    fireEvent.click(getByText('monte.title'));
    const subheading = getByTestId('mock-monteCarloReport');
    expect(subheading.textContent).toBe('Monte Carlo Report');
  });

  it('renders AiAmxReport tab panel on clicking Hugging tab', () => {
    const { getByText , getByTestId} = render(<RepoPage />);
    fireEvent.click(getByText('hugging.title'));
    const subheading = getByTestId('mock-HuggingReport');
    expect(subheading.textContent).toBe('Hugging Report');
  });

  it('renders BYOReport tab panel on clicking BYO App tab', async() => {
    renderComponent({ setByoState });
    render(<RepoPage />);
    const byoTabs = screen.getAllByRole('tab', { name: /byoApp/i });
    expect(byoTabs.length).toBeGreaterThan(0);
    const byoTab = byoTabs[0];
    fireEvent.click(byoTab);
    const byoReports = screen.getAllByTestId('mock-ByoReport');
    expect(byoReports[0]).toBeInTheDocument();
    expect(setByoState).toHaveBeenCalledWith('someFlagStatus');
  });

  it('renders MonteCarloReport tab panel with correct subheading', () => {
    const { getByText, getByTestId } = render(<RepoPage />);
    fireEvent.click(getByText('monte.title'));
    const subheading = document.querySelector('.landing-page__subheading');
    expect(subheading.textContent).toBe('vsiPerformResult');
    expect(getByTestId('mock-monteCarloReport')).toBeInTheDocument();
  });
});
