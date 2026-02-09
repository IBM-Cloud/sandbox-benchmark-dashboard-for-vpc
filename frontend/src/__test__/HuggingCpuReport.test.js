import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import AiAmxCPUReport from '../content/Dashboard/HuggingDashboard/CpuReport';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
  }),
}));

describe('AiAmxCPUReport component', () => {

  it("renders without crashing", async () => {
    render(<AiAmxCPUReport />);
    const chartElement = await screen.findByText('hugging.chart2Title');
    expect(chartElement).toBeVisible();
  });
  it('renders with provided props', () => {
    const props = {
      bx2: '10',
      bx3: '20',
      isDarkTheme: true,
    };

    const { getByTestId } = render(<AiAmxCPUReport {...props} />);
    const chartElement = getByTestId('mock-SimpleBarChart');
    expect(chartElement).toBeInTheDocument();
  });

});
