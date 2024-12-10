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

jest.mock('../content/component/NotificationManager', () => ({
  useNotification: jest.fn(),
}));

describe("BenchmarkPage component", () => {
  it("renders without errors", async () => {
    useNotification.mockReturnValue(jest.fn());
    render(<BenchmarkPage />);
    const benchmarkLogsElement = await screen.findByText('benchmarkLogs');
    await waitFor(() => {
      expect(benchmarkLogsElement).toBeVisible();
    })
  });
});
