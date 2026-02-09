import React from "react";
import { render, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import MontoComparedReport from "../content/Dashboard/MonteDashboard/comparisonReport";


jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: key => key })
}));

describe("MontoComparedReport component", () => {

  it("renders without crashing", async () => {
    const { getByText } = render(<MontoComparedReport />);
    expect(getByText("monte.chart1Title")).toBeInTheDocument();
  });
  it('renders with provided props', async () => {
    const props = {
      bx2: '10',
      bx3: '20',
      isDarkTheme: true,
    };
    const { getByTestId } = render(<MontoComparedReport {...props} />);
    const chartElement = getByTestId('mock-SimpleBarChart');
    expect(chartElement).toBeInTheDocument();
  });

});
