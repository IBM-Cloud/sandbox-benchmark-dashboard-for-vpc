import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import BenchmarkPage from "../content/BenchmarkLogs/benchmark";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));
jest.mock('../content/api/api', () => ({
}));

describe("BenchmarkPage component", () => {
  it("renders without errors", async () => {
    render(<BenchmarkPage />);
    const benchmarkLogsElement = await screen.findByText('benchmarkLogs');
    await waitFor(() => {
      expect(benchmarkLogsElement).toBeVisible();
    })
  });
});
