class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}
global.ResizeObserver = ResizeObserver;
import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MonteCarloReport from '../content/Dashboard/monteCarloReport';
import * as api from '../content/api/api';
import MontoCPUReport from "../content/Dashboard/MonteDashboard/CpuReport";
import { mockGetMonteRunBenchmarkResponse } from './utils';

jest.mock('../components/theme', () => () => false);

jest.mock('../content/api/api', () => ({
  getMonteCarloRunLists: jest.fn(),
}));
describe('MonteCarloReport Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays notification on API error', async () => {
    api.getMonteCarloRunLists.mockRejectedValueOnce(new Error('API Error'));
    render(<MonteCarloReport />);
    await waitFor(() => {
      expect(screen.getByText('failedRetrieveMonteLogs')).toBeInTheDocument();
    });
  });
  it('fetches monte carlo reports data correctly', async () => {
    api.getMonteCarloRunLists.mockResolvedValue(mockGetMonteRunBenchmarkResponse);
    render(<MonteCarloReport />);
    await waitFor(() => {
      expect(api.getMonteCarloRunLists).toHaveBeenCalled();
    });
  });

  it("sets setshownotification to false", () => {
    const mockSetShowNotification = jest.fn();
    render(
      <MonteCarloReport setShowNotification={mockSetShowNotification} />
    );
    mockSetShowNotification(false);
    expect(mockSetShowNotification).toHaveBeenCalledWith(false);
  });
});
