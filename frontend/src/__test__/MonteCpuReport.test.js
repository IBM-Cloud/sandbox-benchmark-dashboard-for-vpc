class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;
import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import MontoCPUReport from "../content/Dashboard/MonteDashboard/CpuReport";


jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: key => key })
}));

describe("MontoCPUReport component", () => {

  it("renders without crashing", async() => {
    const { getByText } = render(<MontoCPUReport />);
    expect(getByText("monte.chart2Title")).toBeInTheDocument();
  });
  it('renders with provided props', () => {
    const props = {
      bx2: '10',
      bx3: '20',
      isDarkTheme: true,
    };

    const { container } = render(<MontoCPUReport {...props} />);
    const chartElement = container.querySelector('.chart-holder');
    expect(chartElement).toBeInTheDocument();
  });

});
