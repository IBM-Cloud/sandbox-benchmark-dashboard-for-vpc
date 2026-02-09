class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}
global.ResizeObserver = ResizeObserver;
import React from 'react';
import { render, waitFor, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AiAmxReport from '../content/Dashboard/huggingReport';
import * as api from '../content/api/api';
import { mockGetHuggingInstanceResponse } from './utils';
import { useNotification } from "../content/component/NotificationManager";


jest.mock("@carbon/react", () => ({
  ...jest.requireActual("@carbon/react"),
  Loading: jest.fn(() => null),
}));
jest.mock("../content/api/api", () => ({
  getHuggingRunLists: jest.fn(),
}));

jest.mock('../components/theme', () => () => false);

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key
  })
}));
describe('HuggingFace Component', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    useNotification.mockReturnValue(jest.fn());
  });
  it('renders loading state', async () => {
    useNotification.mockReturnValue(jest.fn());
    render(<AiAmxReport />);
    const hugReport = await screen.findByText('vsiProfile');
    expect(hugReport).toBeVisible();
  });

  it("should display data", async () => {
    useNotification.mockReturnValue(jest.fn());
    api.getHuggingRunLists.mockResolvedValueOnce(mockGetHuggingInstanceResponse);
    render(<AiAmxReport />);
    await waitFor(() => {
      expect(api.getHuggingRunLists).toHaveBeenCalled();
    });
  });

  it('renders no records message when data is empty', async () => {
    api.getHuggingRunLists.mockResolvedValueOnce({ ListTest: [] });
    render(<AiAmxReport />);
    await waitFor(() => {
      expect(screen.getByText('noRunRecords')).toBeInTheDocument();
    });
  });

});
