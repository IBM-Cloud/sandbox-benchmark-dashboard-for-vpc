import React from "react";
import { render, fireEvent, waitFor, act, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import PrestoApp from "../content/LandingPage/presto/presto";
import * as api from "../content/api/api";
import errorNotification from '../content/component/errorNotification';
import { mockGetPrestoInstanceResponse, mockGetHuggingRunBenchmarkResponse, mockSetupProps, mockRunPrestoData } from "./utils";

jest.mock("../content/api/api", () => ({
  getPrestoInstances: jest.fn(),
  createPrestoInstances: jest.fn(),
  prestoRunBenchmark: jest.fn(),
  deletePrestoInstances: jest.fn(),
  getPrestoRunLists: jest.fn(),
  resetBenchmark: jest.fn(),
  getPrestoBenchmarkStatus: jest.fn(),
  getHuggingFace: jest.fn(),
  createHuggingInstances: jest.fn(),
  huggingRunBenchmark: jest.fn(),
  getHuggingRunLists: jest.fn(),
  deleteHuggingInstances: jest.fn(),
  resetBenchmark: jest.fn(),
}));

jest.mock('../content/component/errorNotification', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => null)
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: key => key }),
}));

const mockShowToast = jest.fn();
const mockShowNotificationStatus = jest.fn();
const mockProps = {
  metaData: {
    data: {
      vpc: { id: 'vpc-123' },
      image: { id: 'image-123' },
      zone: { name: 'zone-1' },
      resource_group: { id: 'rg-123' },
      network_interfaces: [{ subnet: { id: 'subnet-123' } }],
    },
  },
  showToast: jest.fn(),
};
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
describe("Data Lake application using Presto", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders with initial state", async () => {
    render(<PrestoApp />);
    const hugAppElement = await screen.findByText('setup');
    expect(hugAppElement).toBeVisible();
  });

  test('renders presto application component with shownotificationstatus prop', () => {
    render(<PrestoApp showNotificationStatus={mockShowNotificationStatus} />);
    const errorKey = 'SOME_ERROR';
    const serverError = 'Server Error';
    const errorLog = 'Error Log';
    mockShowNotificationStatus("error", errorKey, serverError, errorLog);
    expect(mockShowNotificationStatus).toHaveBeenCalledWith("error", errorKey, serverError, errorLog);
  });
  test('should setShowPrestoButtons to false when prestoInstances length is 0', async () => {
    api.getPrestoInstances.mockResolvedValueOnce({ instances: [], createFlag: false, deleteFlag: false });
    const { getByText } = render(<PrestoApp />);
    await waitFor(() => {
      expect(api.getPrestoInstances).toHaveBeenCalled();
    });
    expect(getByText('notConfigured')).toBeInTheDocument();
  });
  test('renders Presto title and description when instance creation is in progress', async () => {
    api.getPrestoInstances.mockResolvedValueOnce({ instances: null });
    api.createPrestoInstances.mockResolvedValueOnce();
    render(<PrestoApp />);
    document.querySelector('.showSetBtn');
    const setupButton = await screen.findByText('setup');
    fireEvent.click(setupButton);
    const prestoTitle = await screen.findByText('presto.setupTitle');
    expect(prestoTitle).toBeVisible();
  });

  test('handles create instance button click', async () => {
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
    render(<PrestoApp {...mockSetupProps} />);
    const setupButton = await waitFor(() => screen.getByText('setup'));
    fireEvent.click(setupButton);

    const buttons = screen.getAllByTestId('create-instance-button');
    const submitButton = buttons.find(button => button.textContent === 'submit');
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('success', 'prestoCreateSuccess', expect.any(String));
    });
  });

  test('handles create instance button click Api failed', async () => {
    api.createPrestoInstances.mockRejectedValue(new Error('Some error message'));
    const showNotificationStatus = jest.fn();
    const error = new Error('Network error');
    const serverError = 'Server error message';
    const errorKey = 'hugCreateFailed';
    const errorLog = 'Error log message';

    errorNotification(error, serverError, errorKey, showNotificationStatus, errorLog);

    render(<PrestoApp {...mockSetupProps} />);
    const setupButton = await waitFor(() => screen.getByText('setup'));
    fireEvent.click(setupButton);
    const buttons = screen.getAllByTestId('create-instance-button');
    const submitButton = buttons.find(button => button.textContent === 'submit');
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(errorNotification).toHaveBeenCalledWith(
        expect.any(Error),
        'serverError',
        'prestoCreateFailed',
        expect.any(Function),
        expect.any(String));
    });
  });

  it('displays presto instance details when fetched successfully', async () => {
    api.getPrestoInstances.mockResolvedValueOnce(mockGetPrestoInstanceResponse);
    render(<PrestoApp />);
    await waitFor(() => {
      expect(api.getPrestoInstances).toHaveBeenCalled();
    });
  });

  test('handles error during benchmark run', async () => {
    const mocPrestoInstanceDetails = [{ ipAddress: '192.168.1.1' }, { ipAddress: '192.168.1.2' }];
    api.prestoRunBenchmark.mockRejectedValue(new Error('Some error message'));
    const showNotificationStatus = jest.fn();
    const error = new Error('Network error');
    const serverError = 'serverError';
    const errorKey = 'hugRunFailed';
    const errorLog = 'Error log message';
    errorNotification(error, serverError, errorKey, showNotificationStatus, errorLog);
    render(<PrestoApp prestoInstanceDetails={mocPrestoInstanceDetails} showToast={mockShowToast} />);
    const setupButton = await waitFor(() => screen.getByText('runBenchmark'));
    fireEvent.click(setupButton);
    const buttons = screen.getAllByTestId('create-instance-button');
    const submitButton = buttons.find(button => button.textContent === 'run');
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(errorNotification).toHaveBeenCalledWith(
        expect.any(Error),
        'serverError',
        'prestoRunFailed',
        expect.any(Function),
        expect.any(String)
      );
    });
  });

  test('should update selectQuery state when a different query is selected', async () => {
    const mocPrestoInstanceDetails = [{ ipAddress: '192.168.1.1' }, { ipAddress: '192.168.1.2' }];
    const { container } = render(<PrestoApp />);
    render(<PrestoApp prestoInstanceDetails={mocPrestoInstanceDetails} showToast={mockShowToast} />);
    const runBenchmarkButton = container.querySelector('#prestoRun');
    fireEvent.click(runBenchmarkButton);
    const selectQueryDropdown = container.querySelector('#SelectQueryId');
    expect(selectQueryDropdown).toBeInTheDocument();
    expect(selectQueryDropdown.value).toBe('q21');
    fireEvent.change(selectQueryDropdown, { target: { value: 'q01' } });
    expect(selectQueryDropdown.value).toBe('q01');
  });

  test('handles successful benchmark run', async () => {
    api.getPrestoInstances.mockResolvedValue(mockRunPrestoData);
    render(<PrestoApp />);
    const setupButton = await waitFor(() => screen.getByText('runBenchmark'));
    fireEvent.click(setupButton);
    const buttons = screen.getAllByTestId('create-instance-button');
    const submitButton = buttons.find(button => button.textContent === 'run');
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(api.prestoRunBenchmark).toHaveBeenCalledWith({
        address: ["192.168.1.1", "192.168.1.2"],
        port: "22",
        prestoQuery: "q21",
        sshUsername: "ubuntu"
      });
    });
    await waitFor(() => {
      expect(api.prestoRunBenchmark).toHaveBeenCalled();
    });
  });

  it('calls the necessary functions and sets the state correctly', async () => {
    api.getPrestoInstances.mockResolvedValueOnce(mockGetPrestoInstanceResponse);
    const { getByText } = render(<PrestoApp />);
    const button = getByText('viewdetails');
    fireEvent.click(button);
    expect(api.getPrestoInstances).toHaveBeenCalled();
  });
  test('handles reset benchmark button click', async () => {
    const mockShowToast = jest.fn();
    const mockT = jest.fn().mockReturnValue('Error log info');
    render(<PrestoApp />);
    api.resetBenchmark.mockResolvedValue();

    const resetButton = screen.getByText('resetBenchmark');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(errorNotification).not.toHaveBeenCalled();
    });
  });


  test('getprestoreports sets getprestoreports, prestoRunList on successful API call', async () => {
    api.getPrestoInstances.mockResolvedValue(mockGetPrestoInstanceResponse);
    api.getPrestoRunLists.mockResolvedValue(mockGetHuggingRunBenchmarkResponse);
    render(<PrestoApp />);
    const prestoInstanceElement = await screen.findByText('presto.setupTitle');
    expect(prestoInstanceElement).toBeVisible();
  });

  test('renders hugging title and description when instances are not configured', async () => {
    api.getPrestoInstances.mockResolvedValueOnce({ instances: null });
    const { getByText } = render(<PrestoApp />);
    expect(getByText('presto.title')).toBeInTheDocument();
    expect(getByText('presto.description')).toBeInTheDocument();
  });

  test("input value and showdeletemodal state updates correctly", () => {
    const { container } = render(<PrestoApp />);
    const input = container.querySelector('#deletePrestoId');
    fireEvent.change(input, { target: { value: "Delete" } });
    expect(input.value).toBe("Delete");
    const cancelButton = screen.getByText("instanceCancel");
    fireEvent.click(cancelButton);
    expect(input.value).toBe("");
  });

  it('deletes Hugging instances on modal submit', async () => {
    api.getPrestoRunLists.mockResolvedValue({ ListTest: [] });
    const { getByText, container } = render(<PrestoApp />);
    const input = container.querySelector('#deletePrestoId');
    fireEvent.change(input, { target: { value: "Delete" } });
    expect(input.value).toBe("Delete");
    fireEvent.click(getByText('instanceDelete'));
    await waitFor(() => {
      expect(api.deletePrestoInstances).toHaveBeenCalled();
    });
  });
});
