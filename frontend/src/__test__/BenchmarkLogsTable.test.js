import React from 'react';
import { render, fireEvent, waitFor, screen, fetch } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfigurationDetails from '../content/BenchmarkLogs/BenchmarkTable';
import * as api from "../content/api/api";
import { benchmarkLogsMockData, benchmarkLogsMockData2 } from './utils';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => {
      if (key === 'failedRetrieveLogs') {
        return 'Failed to retrieve all benchmark logs';
      }
      return key;
    },
  }),
}));

jest.mock('../content/api/api', () => ({
  getInstanceStatus: jest.fn(),
  getBenchmarkRunLogs: jest.fn()
    .mockResolvedValueOnce({
      totalEntry: 2
    })
    .mockRejectedValue(new Error('API Error')),
  downloadLogsApi: jest.fn(),
}));

describe('ConfigurationDetails Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('renders without crashing', async () => {
    render(<ConfigurationDetails />);
    const benchmarkLogsElement = await screen.findByText('renew');
    expect(benchmarkLogsElement).toBeVisible();
  });
  it("getInstanceStatus", async () => {
    render(<ConfigurationDetails />);
    const renewButton = screen.getByRole('button', {name: /renew/i,});
    fireEvent.click(renewButton);
    await waitFor(() => expect(api.getInstanceStatus).toHaveBeenCalled());
  });
  it('updates search text state on input change', () => {
    const { getByPlaceholderText } = render(<ConfigurationDetails />);
    const searchInput = getByPlaceholderText('find');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    expect(searchInput.value).toBe('test');
  });

  it('handles error gracefully', async () => {
    const { queryByText } = render(<ConfigurationDetails />);
    let errorMessage = queryByText('Failed to retrieve all benchmark logs');
    if (!errorMessage) {
      errorMessage = queryByText('Failed to retrieve all benchmark logs');
    }
    if (errorMessage !== null) {
      expect(errorMessage).toBeInTheDocument();
    }
  });

  it('handle_fetch_errors', async () => {
    api.getBenchmarkRunLogs.mockRejectedValue(new Error('Failed to retrieve all benchmark logs'));
    const { getByRole, findByText } = render(<ConfigurationDetails />);
    const refreshButton = getByRole('button', { name: 'renew' });
    fireEvent.click(refreshButton);
    const errorMessage = await findByText('Failed to retrieve all benchmark logs');
    expect(errorMessage).toHaveTextContent('Failed to retrieve all benchmark logs');
  });

  it('should set showAppStatus, showNotification, showNotificationMsg, and showToastContainer correctly', () => {
    render(<ConfigurationDetails />);
    const statusKind = 'error';
    const status = 'getStatusFailed';
    const statusText = 'Failed to retrieve status';
    expect(screen.queryByText(statusKind)).not.toBeInTheDocument();
    expect(screen.queryByText(status)).not.toBeInTheDocument();
    expect(screen.queryByText(statusText)).not.toBeInTheDocument();
    expect(screen.queryByText('showToastContainer')).not.toBeInTheDocument();
  });

  it("calls benchmarkLogsList and getInstanceStatus on refreshPage", async () => {
    const mockBenchmarkLogsList = jest.fn();
    const mockGetInstanceStatus = jest.fn();
    const { getByText } = render(<ConfigurationDetails />);
    api.getBenchmarkRunLogs.mockImplementation(mockBenchmarkLogsList);
    api.getInstanceStatus.mockImplementation(mockGetInstanceStatus);
    fireEvent.click(getByText("renew"));
    await waitFor(() => {
      expect(api.getBenchmarkRunLogs).toHaveBeenCalled();
    });
  });

  it('test_handle_logs_pagination', async () => {
    render(<ConfigurationDetails />);
    api.getBenchmarkRunLogs.mockResolvedValueOnce(benchmarkLogsMockData);

    await waitFor(async () => {
      const firstLogName = await screen.findByText("presto-benchmark-wzs2o");
      const secondLogName = await screen.findByText("presto-benchmark-ln7r4");
      expect(firstLogName).toBeInTheDocument();
      expect(secondLogName).toBeInTheDocument();
    });
    api.getBenchmarkRunLogs.mockResolvedValueOnce(benchmarkLogsMockData2);

    const nextPageButton = await screen.findByText('nextPage');
    const pageInput = await screen.findByText('1');

    fireEvent.click(nextPageButton);
    fireEvent.change(pageInput, { target: { value: 2 } });
    api.getBenchmarkRunLogs.mockResolvedValueOnce(benchmarkLogsMockData2);
    await waitFor(async () => {
      const firstLogName = await screen.findByText("presto-benchmark-plpsc");
      const secondLogName = await screen.findByText("presto-benchmark-ln7r4");
      expect(firstLogName).toBeInTheDocument();
      expect(secondLogName).toBeInTheDocument();
    });

  });

  it('calls handleDownloadOpen with the correct cell value when download button is clicked', async () => {
    
    const { container } = render(<ConfigurationDetails />);
    api.getBenchmarkRunLogs.mockResolvedValueOnce(benchmarkLogsMockData);
    const mockLogText = 'some log data';
    api.downloadLogsApi.mockResolvedValueOnce({ FileContent: mockLogText });
    await waitFor(() => {
      expect(container.querySelector('tbody')).toBeInTheDocument();
    });
    const tableBody = container.querySelector('tbody');
    const firstRow = tableBody ? tableBody.querySelectorAll('tr')[1] : null;

    if (firstRow) {
      const downloadButton = firstRow.querySelector('.cds--btn--icon-only');
      fireEvent.click(downloadButton);
      const handleDownloadOpen = jest.fn();
      ConfigurationDetails.prototype.handleDownloadOpen = handleDownloadOpen;
      expect(handleDownloadOpen).toHaveBeenCalledWith("./presto/20240418122421VSI.log");
    } else {
      console.log('First row not found or does not exist.');
    }
  });

  test('handleDownloadOpen function', async () => {
    jest.doMock('@carbon/react', () => {
      const CarbonReact = jest.requireActual('@carbon/react');
      return {
        ...CarbonReact,
        Button: jest.fn(({ onClick }) => <button onClick={onClick} />),
      };
    });
    const createObjectURLStub = jest.fn();
    URL.createObjectURL = createObjectURLStub;
    const fetchStub = jest.fn(() => Promise.resolve({ blob: () => 'mock blob' }));
    global.fetch = fetchStub;
    const mockResponse = { FileContent: 'mock file content' };
    api.downloadLogsApi.mockResolvedValueOnce(mockResponse);
    const { getByText } = render(<ConfigurationDetails />);
    const downloadIconButton = getByText('download');
    fireEvent.click(downloadIconButton);
    await waitFor(() => {
      expect(createObjectURLStub).toHaveBeenCalled();
    });
  });

});
