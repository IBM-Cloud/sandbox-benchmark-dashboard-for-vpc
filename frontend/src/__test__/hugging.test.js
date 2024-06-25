import React from "react";
import { render, fireEvent, waitFor, act, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import HuggingFaceApp from "../content/LandingPage/huggingFace/hugging";
import * as api from "../content/api/api";
import errorNotification from '../content/component/errorNotification';
import { mockGetHuggingInstanceResponse, mockGetHuggingRunBenchmarkResponse, mockSetupProps } from "./utils";

jest.mock("../content/api/api", () => ({
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
describe("Huggingface app", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders with initial state", async () => {
    render(<HuggingFaceApp />);
    const hugAppElement = await screen.findByText('setup');
    expect(hugAppElement).toBeVisible();
  });

  test('renders higgingface application component with shownotificationstatus prop', () => {
    render(<HuggingFaceApp showNotificationStatus={mockShowNotificationStatus} />);
    const errorKey = 'SOME_ERROR';
    const serverError = 'Server Error';
    const errorLog = 'Error Log';
    mockShowNotificationStatus("error", errorKey, serverError, errorLog);
    expect(mockShowNotificationStatus).toHaveBeenCalledWith("error", errorKey, serverError, errorLog);
  });

  test('renders hugging title and description when instance creation is in progress', async () => {
    api.getHuggingFace.mockResolvedValueOnce({ instances: null });
    api.createHuggingInstances.mockResolvedValueOnce();
    render(<HuggingFaceApp />);
    document.querySelector('.showSetBtn');
    const setupButton = await screen.findByText('setup');
    fireEvent.click(setupButton);
    const hugTitle = await screen.findByText('hugging.setupTitle');
    expect(hugTitle).toBeVisible();
  });

  it('opens side panel and shows two buttons when "setup" button is clicked', async () => {
    render(<HuggingFaceApp />);
    document.querySelector('.showSetBtn');
    const setupButton = await screen.findByText('setup');
    fireEvent.click(setupButton);
    const buttonTextFinal = await screen.findByText('Select profile');
    expect(buttonTextFinal).toBeVisible();
  });
  it('updates selectProfiles state with the value from the event target', async () => {

    const setSelectProfilesMock = jest.fn();
    render(<HuggingFaceApp />);
    document.querySelector('.showSetBtn');
    const setupButton = await screen.findByText('setup');
    fireEvent.click(setupButton);
    const { container } = render(
      <HuggingFaceApp setSelectProfiles={setSelectProfilesMock} />
    );
    const selectElement = document.getElementById('select-1');
    fireEvent.change(selectElement, { target: { value: '16vCPUs' } });
    await waitFor(() => {
      expect(selectElement.value).toBe('16vCPUs');
    });
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
    render(<HuggingFaceApp {...mockSetupProps} />);
    const setupButton = await waitFor(() => screen.getByText('setup'));
    fireEvent.click(setupButton);

    const buttons = screen.getAllByTestId('create-instance-button');
    const submitButton = buttons.find(button => button.textContent === 'submit');
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith('success', 'hugCreateSuccess', expect.any(String));
    });
  });

  test('handles create instance button click Api failed', async () => {
    api.createHuggingInstances.mockRejectedValue(new Error('Some error message'));
    const showNotificationStatus = jest.fn();
    const error = new Error('Network error');
    const serverError = 'Server error message';
    const errorKey = 'hugCreateFailed';
    const errorLog = 'Error log message';

    errorNotification(error, serverError, errorKey, showNotificationStatus, errorLog);

    render(<HuggingFaceApp {...mockSetupProps} />);
    const setupButton = await waitFor(() => screen.getByText('setup'));
    fireEvent.click(setupButton);
    const buttons = screen.getAllByTestId('create-instance-button');
    const submitButton = buttons.find(button => button.textContent === 'submit');
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(errorNotification).toHaveBeenCalledWith(
        expect.any(Error),
        'serverError',
        'hugCreateFailed',
        expect.any(Function),
        expect.any(String));
    });
  });

  it('displays hugging instance details when fetched successfully', async () => {
    api.getHuggingFace.mockResolvedValueOnce(mockGetHuggingInstanceResponse);
    render(<HuggingFaceApp />);
    await waitFor(() => {
      expect(api.getHuggingFace).toHaveBeenCalled();
    });
  });
  test('handles successful benchmark run', async () => {
    const mocHugInstanceDetails = [
      { ipAddress: '192.168.1.1' },
      { ipAddress: '192.168.1.2' },
    ];
    const mockShowToast = jest.fn();
    const mockT = jest.fn();
    render(<HuggingFaceApp hugInstanceDetails={mocHugInstanceDetails} />);
    const runButton = await waitFor(() => screen.getByText('runBenchmark'));
    fireEvent.click(runButton);
    await waitFor(() => {
      expect(api.huggingRunBenchmark).toHaveBeenCalledWith({
        address: [],
        sshUsername: "ubuntu",
        port: "22"
      });
    });
  });

  test('handles error during benchmark run', async () => {
    const mocHugInstanceDetails = [{ ipAddress: '192.168.1.1' }, { ipAddress: '192.168.1.2' }];
    api.huggingRunBenchmark.mockRejectedValue(new Error('Some error message'));
    const showNotificationStatus = jest.fn();
    const error = new Error('Network error');
    const serverError = 'serverError';
    const errorKey = 'hugRunFailed';
    const errorLog = 'Error log message';
    errorNotification(error, serverError, errorKey, showNotificationStatus, errorLog);
    render(<HuggingFaceApp hugInstanceDetails={mocHugInstanceDetails} showToast={mockShowToast} />);
    const runButton = screen.getByText('runBenchmark');
    fireEvent.click(runButton);
    await waitFor(() => {
      expect(errorNotification).toHaveBeenCalledWith(
        expect.any(Error),
        'serverError',
        'hugRunFailed',
        expect.any(Function),
        expect.any(String)
      );
    });
  });

  it('calls the necessary functions and sets the state correctly', async () => {
    api.getHuggingFace.mockResolvedValueOnce(mockGetHuggingInstanceResponse);
    const { getByText } = render(<HuggingFaceApp />);
    const button = getByText('viewdetails');
    fireEvent.click(button);
    expect(api.getHuggingFace).toHaveBeenCalledTimes(1);
  });
  test('handles reset benchmark button click', async () => {
    const mockShowToast = jest.fn();
    const mockT = jest.fn().mockReturnValue('Error log info');
    render(<HuggingFaceApp />);
    api.resetBenchmark.mockResolvedValue();

    const resetButton = screen.getByText('resetBenchmark');
    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(errorNotification).not.toHaveBeenCalled();
    });
  });


  test('gethuggingreports sets gethuggingreports, huggingRunList on successful API call', async () => {
    api.getHuggingFace.mockResolvedValue(mockGetHuggingInstanceResponse);
    api.getHuggingRunLists.mockResolvedValue(mockGetHuggingRunBenchmarkResponse);
    render(<HuggingFaceApp />);
    const huginstanceElement = await screen.findByText('hugging.setupTitle');
    expect(huginstanceElement).toBeVisible();
  });

  test('renders hugging title and description when instances are not configured', async () => {
    api.getHuggingFace.mockResolvedValueOnce({ instances: null });
    const { getByText } = render(<HuggingFaceApp />);
    expect(getByText('hugging.title')).toBeInTheDocument();
    expect(getByText('hugging.description')).toBeInTheDocument();
  });

  test("input value and showdeletemodal state updates correctly", () => {
    const { container } = render(<HuggingFaceApp />);
    const input = container.querySelector('#deleteHuggingId');
    fireEvent.change(input, { target: { value: "Delete" } });
    expect(input.value).toBe("Delete");
    const cancelButton = screen.getByText("instanceCancel");
    fireEvent.click(cancelButton);
    expect(input.value).toBe("");
  });

  it('deletes Hugging instances on modal submit', async () => {
    api.getHuggingRunLists.mockResolvedValue({ ListTest: [] });
    const { getByText, container } = render(<HuggingFaceApp />);
    const input = container.querySelector('#deleteHuggingId');
    fireEvent.change(input, { target: { value: "Delete" } });
    expect(input.value).toBe("Delete");
    fireEvent.click(getByText('instanceDelete'));
    await waitFor(() => {
      expect(api.deleteHuggingInstances).toHaveBeenCalled();
    });
  });

});
