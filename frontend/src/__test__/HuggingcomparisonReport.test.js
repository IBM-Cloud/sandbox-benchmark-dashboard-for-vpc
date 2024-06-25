class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
}
global.ResizeObserver = ResizeObserver;
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import AiAmxComparedReport from '../content/Dashboard/HuggingDashboard/comparisonReport';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
  }),
}));

describe('AiAmxCPUReport component', () => {

  it("renders without crashing", async () => {
    render(<AiAmxComparedReport />);
    const chartElement = await screen.findByText('hugging.chart1Title');
    expect(chartElement).toBeVisible();
  });
  it('renders with provided props', () => {
    const props = {
      bx2: '10',
      bx3: '20',
      isDarkTheme: true,
    };

    const { container } = render(<AiAmxComparedReport {...props} />);
    const chartElement = container.querySelector('.chart-holder');
    expect(chartElement).toBeInTheDocument();
    
  });
});
