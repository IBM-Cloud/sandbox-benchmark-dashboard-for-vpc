import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import BenchmarkPage from "../content/BenchmarkLogs/benchmark";
import { useNotification } from "../content/component/NotificationManager";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));
jest.mock('../content/api/api', () => ({
}));

describe("BenchmarkPage component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNotification.mockReturnValue(jest.fn());
  });
  it("renders without errors", async () => {
    useNotification.mockReturnValue(jest.fn());
    render(<BenchmarkPage />);
    const benchmarkLogsElement = await screen.findByText('benchmarkLogs');
    await waitFor(() => {
      expect(benchmarkLogsElement).toBeVisible();
    })
  });
});
