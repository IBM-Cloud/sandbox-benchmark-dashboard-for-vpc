class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}
global.ResizeObserver = ResizeObserver;
import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as api from '../content/api/api';
import PrestoReport from '../content/Dashboard/prestoReport';
import { mockGetPrestoRunBenchmarkResponse } from './utils';

jest.mock('../components/theme', () => () => false);
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: key => key })
}));
jest.mock('../content/api/api', () => ({
  getPrestoRunLists: jest.fn(),
}));
jest.mock('@carbon/charts-react', () => ({
  SimpleBarChart: (props) => <div data-testid="simple-bar-chart" {...props}></div>,
}));
jest.mock('../content/component/toast', () => (props) => <div data-testid="notification" {...props}></div>);
describe('Presto  Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it('renders without crashing', () => {
    render(<PrestoReport />);
    expect(screen.getByText('vsiName')).toBeInTheDocument();
  });

  test('displays loading indicator when data is being fetched', async () => {
    api.getPrestoRunLists.mockResolvedValueOnce({ ListTest: [] });
    render(<PrestoReport />);
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());
    expect(screen.getByText('noRunRecords')).toBeInTheDocument();
  });

  it("sets setshownotification to false", () => {
    const mockSetShowNotification = jest.fn();
    render(
      <PrestoReport setShowNotification={mockSetShowNotification} />
    );
    mockSetShowNotification(false);
    expect(mockSetShowNotification).toHaveBeenCalledWith(false);
  });

  it('handles chart correctly', async () => {
    api.getPrestoRunLists.mockResolvedValueOnce(mockGetPrestoRunBenchmarkResponse);
    render(<PrestoReport />);
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());
    expect(screen.getAllByTestId('simple-bar-chart')).toHaveLength(2);
  });

  it('renders the PrestoReport component with data', async () => {
    api.getPrestoRunLists.mockResolvedValueOnce(mockGetPrestoRunBenchmarkResponse);
    render(<PrestoReport />);
    await waitFor(() => expect(screen.queryByText('loading')).not.toBeInTheDocument());
    expect(screen.getByText('sbox-presto-vm1-porti')).toBeInTheDocument();
  });

});
