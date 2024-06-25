class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;
import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import PrestoChart from "../content/Dashboard/PrestoDashboard/prestoChart";
import { SimpleBarChart } from "@carbon/charts-react";
import { expectedPrestoChartOptions, expectedDarkChartOptions } from "./utils";


jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: key => key })
}));
jest.mock('@carbon/charts-react', () => ({
  SimpleBarChart: jest.fn(() => <div>SimpleBarChart</div>),
}));

describe("PrestoChart component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    const { getByText } = render(<PrestoChart bx2="100" bx3="200" isDarkTheme={false} />);
    expect(getByText('SimpleBarChart')).toBeInTheDocument();
  });

  test('displays correct data and options when isDarkTheme is false', () => {
    render(<PrestoChart bx2="100" bx3="200" isDarkTheme={false} />);

    expect(SimpleBarChart).toHaveBeenCalledWith(
      expect.objectContaining(expectedDarkChartOptions),
      {}
    );
  });

  test('displays correct data and options when isDarkTheme is true', () => {
    render(<PrestoChart bx2="300" bx3="400" isDarkTheme={true} />);

    expect(SimpleBarChart).toHaveBeenCalledWith(
      expect.objectContaining(expectedPrestoChartOptions),
      {}
    );
  });

});
