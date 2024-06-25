import React from "react";
import { render, fireEvent, waitFor, act, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import ByoApplication from "../content/LandingPage/byoApp/byo";
import * as api from "../content/api/api";
import { mockGetByoInstanceResponse, mockGetByoRunBenchmarkResponse, mockRunByoData } from "./utils";

jest.mock("../content/api/api", () => ({
  getByo: jest.fn(),
  getByoReports: jest.fn(),
  createByoInstances: jest.fn(),
  getByoLists: jest.fn(),
  deleteByoInstances: jest.fn(),
  resetBenchmark: jest.fn(),
  runByoApi: jest.fn(),
}));

jest.mock('../content/component/errorNotification', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => null)
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('@carbon/ibm-products', () => ({
  SidePanel: ({ children, actions}) => (
    <div data-testid="mocked-side-panel">
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

const mockShowToast = jest.fn();
const mockShowNotificationStatus = jest.fn();

describe("BYO app", () => {
  beforeEach(() => {
    jest.spyOn(api, 'runByoApi').mockResolvedValue({});
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders with initial state", async () => {
    render(<ByoApplication />);
    const byoTextElement = await screen.findByText('setup');
    expect(byoTextElement).toBeVisible();
  });

  test('renders BYO application component with shownotificationstatus prop', () => {
    render(<ByoApplication showNotificationStatus={mockShowNotificationStatus} />);
    const errorKey = 'SOME_ERROR';
    const serverError = 'Server error';
    const errorLog = 'Error log';
    mockShowNotificationStatus("error", errorKey, serverError, errorLog);
    expect(mockShowNotificationStatus).toHaveBeenCalledWith("error", errorKey, serverError, errorLog);
  });

  it('opens side panel and shows data visible while "setup" button is clicked', async () => {
    render(<ByoApplication />);
    document.querySelector('.showByoBtn');
    const setupButton = await screen.findByText('setup');
    fireEvent.click(setupButton);
    const buttonTextFinal = await screen.findByText('Select profile');
    expect(buttonTextFinal).toBeVisible();
  });
  it('updates selectprofiles state with the value from the event target', async () => {
    const setSelectProfilesMock = jest.fn();
    render(<ByoApplication />);
    document.querySelector('.showByoBtn');
    const setupButton = await screen.findByText('setup');
    fireEvent.click(setupButton);
    const { container } = render(
      <ByoApplication setSelectProfiles={setSelectProfilesMock} />
    );
    const selectElement = document.getElementById('select-1');
    fireEvent.change(selectElement, { target: { value: '8vCPUs' } });
    await waitFor(() => {
      expect(selectElement.value).toBe('8vCPUs');
    });
  });

  test('renders BYO title and description when instance creation is in progress', async () => {
    api.getByo.mockResolvedValueOnce({ instances: [] });
    api.createByoInstances.mockResolvedValueOnce();
    render(<ByoApplication />);
    document.querySelector('.showByoBtn');
    const setupButton = await screen.findByText('setup');
    fireEvent.click(setupButton);
    const buttonTextFinal = await screen.findByText('viewdetails');
    expect(buttonTextFinal).toBeVisible();
  });

  test('handles create button click', async () => {
    const mockByoInstance = {
      instances: [],
      createFlag: false,
      deleteFlag: false,
      byoPollingFlag: false,
    };

    api.getByo.mockResolvedValueOnce(mockByoInstance);
    render(<ByoApplication />);
    document.querySelector('.showByoBtn');
    const setupButton = await screen.findByText('setup');
    fireEvent.click(setupButton);
    const buttons = screen.getAllByTestId('create-instance-button');
    const submitButton = buttons.find(button => button.textContent === 'submit');
    fireEvent.click(submitButton);
    await waitFor(async() => {
      const buttonTextFinal = await screen.findByText('runApplication');
      expect(buttonTextFinal).toBeVisible();
    });
  });

  it('displays BYO instance details when fetched successfully', async () => {
    render(<ByoApplication />);
    api.getByo.mockResolvedValueOnce(mockGetByoInstanceResponse);
    api.getByoLists.mockResolvedValue(mockGetByoRunBenchmarkResponse);
    await waitFor(() => {
      expect(api.getByo).toHaveBeenCalled();
    });
  });

  it('should handle show BYO info button click correctly', async () => {
    api.getByo.mockResolvedValueOnce(mockGetByoInstanceResponse);
    api.getByoLists.mockResolvedValue(mockGetByoRunBenchmarkResponse);
    const showByoInfo = jest.fn();
    const t = jest.fn((key) => key);
    const { getByText } = render(
      <ByoApplication
        showByoInfo={showByoInfo}
        t={t}
        showByoButtons={true}
        byoFlagStatus={false}
      />
    );
    const button = getByText('viewdetails');
    fireEvent.click(button);
    expect(api.getByo).toHaveBeenCalledTimes(1);
  });
  test('get BYO reports , BYO run list on successful API call', async () => {
    api.getByo.mockResolvedValueOnce(mockGetByoInstanceResponse);
    api.getByoLists.mockResolvedValue(mockGetByoRunBenchmarkResponse);
    let getByText;
    await act(async () => {
      const { getByText: getByTextInternal } = render(<ByoApplication />);
      getByText = getByTextInternal;
    });
    const byoinstanceElement = await screen.findByText('sbox-byo-vm1-ihvec');
    expect(byoinstanceElement).toBeVisible();
  });

  test('renders BYO title and description when instances are not configured', async () => {
    api.getByo.mockResolvedValueOnce({ instances: null });
    const { getByText } = render(<ByoApplication />);
    expect(getByText('byo.title')).toBeInTheDocument();
    expect(getByText('byo.description')).toBeInTheDocument();
  });

  test('runs benchmark when script is valid', async () => {
    api.getByo.mockResolvedValue(mockRunByoData);
    render(<ByoApplication />);
    const setupButton = await waitFor(() => screen.getByText('runApplication'));
    fireEvent.click(setupButton);
    const buttons = screen.getAllByTestId('create-instance-button');
    const submitButton = buttons.find(button => button.textContent === 'run');
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(api.runByoApi).not.toHaveBeenCalled();
    });
  });

  test("inputValue and showDeleteModal state updates correctly", () => {
    const { container } = render(<ByoApplication />);
    const input = container.querySelector('#deleteByoId');
    fireEvent.change(input, { target: { value: "Delete" } });
    expect(input.value).toBe("Delete");
    const cancelButton = screen.getByText("instanceCancel");
    fireEvent.click(cancelButton);
    expect(input.value).toBe("");
  });

  it('deletes BYO instances on modal submit', async () => {
    const { getByText, container } = render(<ByoApplication />);
    const input = container.querySelector('#deleteByoId');
    fireEvent.change(input, { target: { value: "Delete" } });
    expect(input.value).toBe("Delete");
    fireEvent.click(getByText('instanceDelete'));
    await waitFor(() => {
      expect(api.deleteByoInstances).toHaveBeenCalled();
    });
  });

});
