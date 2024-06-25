class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}
global.ResizeObserver = ResizeObserver;
import React from "react";
import { render, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import CurrentCpuReport from "../content/Dashboard/ByoDashboard/CurrentCpuReport";
import * as api from "../content/api/api";
import { byoChartProps, byoChartmockResponse } from "./utils";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: key => key }),
}));
jest.mock('../content/api/api', () => ({
  getByoLists: jest.fn(),
}));
jest.mock("../content/Dashboard/chartOptions", () => jest.fn(() => ({ mockOptions: true })));


jest.mock('../content/Dashboard/chartOptions', () => ({
  __esModule: true,
  default: jest.fn(() => require('./utils').chartByoCpuMock),
}));

describe("CurrentCpuReport", () => {
  
  test("renders grouped bar chart with correct data", async () => {
    api.getByoLists.mockResolvedValueOnce(byoChartmockResponse);
    const { container } = render(<CurrentCpuReport {...byoChartProps} />);
    const chartElement = container.querySelector('.chart-holder');
    expect(chartElement).toBeInTheDocument();
  });
});
