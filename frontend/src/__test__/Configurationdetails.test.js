import React from 'react';
import { render, waitFor, fireEvent, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import BenchmarkTable from '../content/configuration/configurationDetails';
import { getAllInstances } from '../content/api/api';
import { mockAllInstanceResponse } from './utils';

jest.mock('../content/api/api', () => ({
  getAllInstances: jest.fn(),
}));
jest.mock('../components/theme', () => () => false);
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

describe('BenchmarkTable', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(<BenchmarkTable />);
    const configElement = await screen.findByText('vsiName');
    expect(configElement).toBeVisible();
  });

  it('fetches instance data on component mount', async () => {
    getAllInstances.mockResolvedValueOnce(mockAllInstanceResponse);
    render(<BenchmarkTable />);
    await waitFor(() => {
      expect(getAllInstances).toHaveBeenCalled();
    });
  });

  it('renders instance data in the table', async () => {
    getAllInstances.mockResolvedValueOnce(mockAllInstanceResponse);
    render(<BenchmarkTable />);
    await waitFor(() => {
      expect(screen.getByText('sbox-presto-vm2-7mmpg')).toBeInTheDocument();
      expect(screen.getByText('10.240.0.212')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    getAllInstances.mockRejectedValueOnce(new Error('Failed to retrieve all instances'));
    render(<BenchmarkTable />);
    await waitFor(() => {
      expect(screen.getByText('failedRetrieveInstances')).toBeInTheDocument();
    });
  });

  test('sets instanceDetails to empty array when response.instances is null', async () => {
    getAllInstances.mockResolvedValueOnce({ instances: null });
    const { getByText } = render(<BenchmarkTable />);
    fireEvent.click(getByText('Renew'));
    await waitFor(() => {
      expect(getAllInstances).toHaveBeenCalled();
      expect(getByText('noRecords')).toBeInTheDocument();
    });
  });

  test('sets showNotification to false', async () => {
    const { getByText, queryByText } = render(<BenchmarkTable />);
    fireEvent.click(getByText('Renew'));
    await waitFor(() => {
      expect(queryByText(/failed/i)).not.toBeInTheDocument();
    });
  });

  it('calls getAllInstance when Refresh button is clicked', async () => {
    getAllInstances.mockResolvedValueOnce({ instances: [] });
    const { getByRole } = render(<BenchmarkTable />);
    fireEvent.click(getByRole('button', { name: 'Renew' }));
    await waitFor(() => {
      expect(getAllInstances).toHaveBeenCalled();
    });
  });

});
