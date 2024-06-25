class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}
global.ResizeObserver = ResizeObserver;
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import CurrentMemoryReport from "../content/Dashboard/ByoDashboard/CurrentMemoryReport";
import * as api from "../content/api/api";
import { mockGetByoRunBenchmarkResponse, byoComparisonProps } from "./utils";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: key => key }),
}));
jest.mock('../content/api/api', () => ({
  getByoLists: jest.fn(),
}));

jest.mock("../content/Dashboard/chartOptions", () => jest.fn(() => ({ mockOptions: true })));

jest.mock('../content/Dashboard/chartOptions', () => ({
  __esModule: true,
  default: jest.fn(() => require('./utils').chartOptionsMock),
}));
describe("Current memory report component", () => {
  test("renders grouped bar chart with correct data", async () => {
    api.getByoLists.mockResolvedValueOnce(mockGetByoRunBenchmarkResponse);
    const { container } = render(<CurrentMemoryReport {...byoComparisonProps} />);
    const chartElement = container.querySelector('.chart-holder');
    expect(chartElement).toBeInTheDocument();
  });
});
