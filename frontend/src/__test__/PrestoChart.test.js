import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import PrestoChart from "../content/Dashboard/PrestoDashboard/prestoChart";
import { SimpleBarChart } from "@carbon/charts-react";
import { expectedPrestoChartOptions, expectedDarkChartOptions } from "./utils";


jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: key => key })
}));

describe("PrestoChart component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    const { getByTestId } = render(<PrestoChart bx2="100" bx3="200" isDarkTheme={false} />);
    expect(getByTestId('mock-SimpleBarChart')).toBeInTheDocument();
  });

  test('displays correct data and options when isDarkTheme is false', () => {
    render(<PrestoChart bx2="100" bx3="200" isDarkTheme={false} />);
    const chartElement = screen.getByTestId('mock-SimpleBarChart');
    const options = JSON.parse(chartElement.getAttribute('data-options'));
    expect(options).toEqual(expectedDarkChartOptions.options);
  });

  test('displays correct data and options when isDarkTheme is true', () => {
    render(<PrestoChart bx2="300" bx3="400" isDarkTheme={true} />);
    const chartElement = screen.getByTestId('mock-SimpleBarChart');
    const options = JSON.parse(chartElement.getAttribute('data-options'));
    expect(options).toEqual(expectedPrestoChartOptions.options);
  });

});
