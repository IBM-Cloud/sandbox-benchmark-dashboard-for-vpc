// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';

jest.mock('./content/component/NotificationManager', () => ({
    useNotification: jest.fn(() => jest.fn()),
    NotificationProvider: ({ children }) => children,
}));

class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
}
global.ResizeObserver = ResizeObserver;

global.matchMedia = global.matchMedia || function () {
    return {
        matches: false,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    };
};

jest.mock('@carbon/charts-react', () => ({
    SimpleBarChart: (props) => <div data-testid="mock-SimpleBarChart" className="chart-holder" data-options={JSON.stringify(props.options)} {...props}>{props.options?.title}</div>,
    GroupedBarChart: (props) => <div data-testid="mock-GroupedBarChart" className="chart-holder" data-options={JSON.stringify(props.options)} {...props}>{props.options?.title}</div>,
    DonutChart: (props) => <div data-testid="mock-DonutChart" className="chart-holder" data-options={JSON.stringify(props.options)} {...props}>{props.options?.title}</div>,
    GaugeChart: (props) => <div data-testid="mock-GaugeChart" className="chart-holder" data-options={JSON.stringify(props.options)} {...props}>{props.options?.title}</div>,
    LineChart: (props) => <div data-testid="mock-LineChart" className="chart-holder" data-options={JSON.stringify(props.options)} {...props}>{props.options?.title}</div>,
}));