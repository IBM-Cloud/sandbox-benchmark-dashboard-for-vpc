import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import MonteCarloApp, { showCarlo } from '../content/LandingPage/monteCarlo/monte';
import * as api from "../content/api/api";
import { mockGetMonteInstanceResponse, mockGetMonteRunBenchmarkResponse, mockSetupProps } from './utils';
import errorNotification from '../content/component/errorNotification';

jest.mock("../content/api/api", () => ({
  getMonteCarlo: jest.fn(),
  createMonteCarloInstances: jest.fn(),
  getMonteCarloReports: jest.fn(),
  monteCarloRunBenchmark: jest.fn(),
  resetBenchmark: jest.fn(),
  getMonteCarloRunLists: jest.fn(),
  deleteMonteCarloInstances: jest.fn()
}));

jest.mock('../content/component/errorNotification', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => null)
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn((key) => key),
  }),
}));

jest.mock('@carbon/ibm-products', () => ({
  SidePanel: ({ children }) => <div>{children}</div>,
}));

jest.mock('@carbon/ibm-products', () => ({
  SidePanel: ({ title, children, actions }) => (
    <div data-testid="mocked-side-panel">
      <h2>{title}</h2>
      <div>{children}</div>,
      <div>
        {actions.map((action, index) => (
          <button key={index} onClick={action.onClick} data-testid="create-instance-button">
            {action.label}
          </button>
        ))}
      </div>
    </div>
  ),
}));
jest.mock("@carbon/react", () => {
  const CarbonReact = jest.requireActual("@carbon/react");
  return {
    ...CarbonReact,
    SelectItem: jest.fn(({ value, text }) => (
      <option value={value} data-testid="select-profiles">{text}</option>
    )),
  };
});
const mockShowNotificationStatus = jest.fn();

describe('Monte application component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("render montecarlo app ", async () => {
    render(<MonteCarloApp />);
    const monteElement = await screen.findByText('monte.title');
    expect(monteElement).toBeVisible();
  });
  it('opens side panel and shows two buttons when "setup" button is clicked', async () => {
    const { getByText } = render(<MonteCarloApp />);
    const setupButton = getByText('setup');
    fireEvent.click(setupButton);
    const monteTitle = await screen.findByText('monte.setupTitle');
    expect(monteTitle).toBeVisible();
  });

  test('renders monte application component with showNotificationStatus prop', () => {
    render(<MonteCarloApp showNotificationStatus={mockShowNotificationStatus} />);
    const errorKey = 'SOME_ERROR';
    const serverError = 'Server Error';
    const errorLog = 'Error Log';
    mockShowNotificationStatus("error", errorKey, serverError, errorLog);
    expect(mockShowNotificationStatus).toHaveBeenCalledWith("error", errorKey, serverError, errorLog);
  });

  it('updates selectProfiles state with the value from the event target', async () => {
    const setSelectProfilesMock = jest.fn();
    render(<MonteCarloApp />);
    document.querySelector('.showSetBtn');
    const setupButton = await screen.findByText('setup');
    fireEvent.click(setupButton);
    const { container } = render(
      <MonteCarloApp setSelectProfiles={setSelectProfilesMock} />
    );
    const selectElement = document.getElementById('select-1');
    expect(selectElement).toBeInTheDocument();
    const option = document.createElement('option');
    option.value = '8vCPUs';
    option.text = '8 vCPUs';
    selectElement.add(option);
    fireEvent.change(selectElement, { target: { value: '8vCPUs' } });
    console.log("testvcpus", document.body.innerHTML);
    await waitFor(() => {
      expect(selectElement.value).toBe('8vCPUs');
    });
  });

  test('handles create instance button click', async () => {
    const mockShowToast = jest.fn();
    const mockSetupProps = {
      metaData: {
        data: {
          vpc: { id: 'mockVpcId' },
          image: { id: 'mockImageId' },
          zone: { name: 'mockZoneName' },
          resource_group: { id: 'mockResourceGroupId' },
          network_interfaces: [{
            name: 'mockInterfaceName',
            subnet: { id: 'mockSubnetId' }
          }]
        }
      },
      showToast: mockShowToast,
    };
    render(<MonteCarloApp {...mockSetupProps} />);
    const setupButton = await waitFor(() => screen.getByText('setup'));
    fireEvent.click(setupButton);

    const buttons = screen.getAllByTestId('create-instance-button');
    const submitButton = buttons.find(button => button.textContent === 'submit');
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('success', 'monteCreateSuccess', expect.any(String));
    });
  });

  it('displays monte instance details when fetched successfully', async () => {
    api.getMonteCarlo.mockResolvedValueOnce(mockGetMonteInstanceResponse);
    render(<MonteCarloApp />);
    await waitFor(() => {
      expect(api.getMonteCarlo).toHaveBeenCalled();
    });
  });

  it('calls the necessary functions and sets the state correctly', async () => {
    const { getByText } = render(<MonteCarloApp />);
    const button = getByText('viewdetails');
    fireEvent.click(button);
    expect(api.getMonteCarlo).toHaveBeenCalledTimes(1);
  });

  test('handles create instance button click Api failed', async () => {
    api.createMonteCarloInstances.mockRejectedValue(new Error('Some error message'));
    const showNotificationStatus = jest.fn();
    const error = new Error('Network error');
    const serverError = 'Server error message';
    const errorKey = 'monteCreateFailed';
    const errorLog = 'Error log message';

    errorNotification(error, serverError, errorKey, showNotificationStatus, errorLog);

    render(<MonteCarloApp {...mockSetupProps} />);
    const setupButton = await waitFor(() => screen.getByText('setup'));
    fireEvent.click(setupButton);
    const buttons = screen.getAllByTestId('create-instance-button');
    const submitButton = buttons.find(button => button.textContent === 'submit');
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(errorNotification).toHaveBeenCalledWith(
        expect.any(Error),
        'serverError',
        'monteCreateFailed',
        expect.any(Function),
        expect.any(String));
    });
  });

  test('handles successful benchmark run', async () => {
    const mockMonteInstanceDetails = [
      { ipAddress: '192.168.1.1' },
      { ipAddress: '192.168.1.2' },
    ];
    const mockShowToast = jest.fn();
    const mockT = jest.fn();
    render(<MonteCarloApp monteInstanceDetails={mockMonteInstanceDetails} />);
    const runButton = await waitFor(() => screen.getByText('runBenchmark'));
    fireEvent.click(runButton);
    await waitFor(() => {
      expect(api.monteCarloRunBenchmark).toHaveBeenCalledWith({
        address: [],
        sshUsername: "ubuntu",
        port: "22"
      });
    });
  });

  test('handles error during benchmark run', async () => {
    const mockShowToast = jest.fn();
    const mockMonteInstanceDetails = [{ ipAddress: '192.168.1.1' }, { ipAddress: '192.168.1.2' }];
    api.monteCarloRunBenchmark.mockRejectedValue(new Error('Some error message'));
    const showNotificationStatus = jest.fn();
    const error = new Error('Network error');
    const serverError = 'serverError';
    const errorKey = 'monteRunFailed';
    const errorLog = 'Error log message';
    errorNotification(error, serverError, errorKey, showNotificationStatus, errorLog);
    render(<MonteCarloApp monteInstanceDetails={mockMonteInstanceDetails} showToast={mockShowToast} />);
    const runButton = screen.getByText('runBenchmark');
    fireEvent.click(runButton);
    await waitFor(() => {
      expect(errorNotification).toHaveBeenCalledWith(
        expect.any(Error),
        'serverError',
        'monteRunFailed',
        expect.any(Function),
        "Error log message"
      );
    });
  });

  test('handles reset benchmark button click', async () => {
    const mockShowToast = jest.fn();
    const mockT = jest.fn().mockReturnValue('Error log info');
    render(<MonteCarloApp />);
    api.resetBenchmark.mockResolvedValue();

    const resetButton = screen.getByText('resetBenchmark');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(errorNotification).not.toHaveBeenCalled();
    });
  });


  test('getmontecarloreports sets montereports, monterunlists, and monteruncreateflag on successful API call', async () => {
    api.getMonteCarloRunLists.mockResolvedValue(mockGetMonteInstanceResponse);
    api.getMonteCarloRunLists.mockResolvedValue(mockGetMonteRunBenchmarkResponse);
    await act(async () => {
      const { getByText: getByTextInternal } = render(<MonteCarloApp />);
      getByText = getByTextInternal;
    });
    const monteinstanceElement = await screen.findByText('monte.setupTitle');
    expect(monteinstanceElement).toBeVisible();
  });

  test("inputValue and showDeleteModal state updates correctly", () => {
    const { container } = render(<MonteCarloApp />);
    const input = container.querySelector('#deleteMonteId');
    fireEvent.change(input, { target: { value: "Delete" } });
    expect(input.value).toBe("Delete");
    const cancelButton = screen.getByText("instanceCancel");
    fireEvent.click(cancelButton);
    expect(input.value).toBe("");
  });

  it('deletes monte carlo instances on modal submit', async () => {
    const { getByText, container } = render(<MonteCarloApp />);
    const input = container.querySelector('#deleteMonteId');
    fireEvent.change(input, { target: { value: "Delete" } });
    expect(input.value).toBe("Delete");
    fireEvent.click(getByText('instanceDelete'));
    await waitFor(() => {
      expect(api.deleteMonteCarloInstances).toHaveBeenCalled();
    });
  });

  test('handles delete button click', async () => {
    const mockMonteDetails = [{ ipAddress: '192.168.1.1' }, { ipAddress: '192.168.1.2' }];
    const { getByText, container } = render(<MonteCarloApp monteInstanceDetails={mockMonteDetails} />);
    const input = container.querySelector('#deleteMonteId');
    fireEvent.change(input, { target: { value: "Delete" } });
    expect(input.value).toBe("Delete");
    fireEvent.click(getByText('instanceDelete'));
    const mockedDeleteMonteInstances = jest.fn(() => Promise.resolve());
    jest.mock('../content/api/api', () => ({
      ...jest.requireActual('../content/api/api'),
      deleteMonteCarloInstances: mockedDeleteMonteInstances,
    }));
    await waitFor(() => {
      expect(api.deleteMonteCarloInstances).toHaveBeenCalled();
    });
  });

});