class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}
global.ResizeObserver = ResizeObserver;

import React from 'react';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BYOReport from '../content/Dashboard/byoReport';
import { getByoLists, getByo } from '../content/api/api';
import * as api from "../content/api/api";
import { mockGetByoInstanceResponse, mockGetByoRunBenchmarkResponse } from './utils';

jest.mock('../components/theme', () => () => false);

jest.mock('../content/api/api', () => ({
  getByoLists: jest.fn(),
  getByo: jest.fn(),
}));

describe('ByoReport Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', async () => {
    render(<BYOReport />);
    const ByoElement = await screen.findByText('vsiName');
    expect(ByoElement).toBeVisible();
  });

  it("renders the component", async () => {
    const mockGetByoResponse = { instances: [], byoPollingFlag: true };
    const mockGetByoListsResponse = {};
    getByo.mockResolvedValueOnce(mockGetByoResponse);
    getByoLists.mockResolvedValueOnce(mockGetByoListsResponse);
    render(<BYOReport />);
    await waitFor(() => {
      expect(screen.getByText("noRunRecords")).toBeInTheDocument();
    });
  });

  it("renders the component with no records when ListTest is an empty array", async () => {
    const mockGetByoResponse = { instances: [], byoPollingFlag: true };
    const mockGetByoListsResponse = { ListTest: [] };
    getByo.mockResolvedValueOnce(mockGetByoResponse);
    getByoLists.mockResolvedValueOnce(mockGetByoListsResponse);
    render(<BYOReport />);
    await waitFor(() => {
      expect(screen.getByText("noRunRecords")).toBeInTheDocument();
    });
  });

  it("renders the component and charts with records when listtest is not empty", async () => {
    api.getByoLists.mockResolvedValueOnce(mockGetByoRunBenchmarkResponse);
    render(<BYOReport />);
    await waitFor(() => {
      expect(api.getByoLists).toHaveBeenCalledWith({
        count: 4,
        page: 1,
        search: ""
      });
    });
    expect(await screen.getByText('sbox-byo-vm2-ihvec')).toBeInTheDocument();
  });

});
