import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import LandingPage from "../content/LandingPage/LandingPage";
import * as api from "../content/api/api";
import { mockMetaData, mockAllInstanceResponse } from "./utils";
import { useNotification } from "../content/component/NotificationManager";

jest.mock('../components/theme', () => () => false);

jest.mock('../content/component/CommonUIContext', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.createContext({
      setByoState: jest.fn()
    })
  };
});
jest.mock("../content/api/api", () => ({
  getMetadata: jest.fn(),
  getAllInstances: jest.fn(),
}));

jest.mock('@carbon/ibm-products', () => ({
  SidePanel: jest.fn(({ actions }) => (
    <div>
      {actions.map((action, index) => (
        <button key={index} onClick={action.onClick} data-testid="create-instance-button">
          {action.label}
        </button>
      ))}
    </div>
  )),
}));

// Redundant useNotification mock removed

describe("LandingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useNotification.mockReturnValue(jest.fn());
  });

  it('renders Landing page', async () => {
    render(<LandingPage />);
    const landingTitle = await screen.findByText('appTitle');
    expect(landingTitle).toBeVisible();
  });

  test("renders landing page with loading indicator", () => {
    api.getMetadata.mockResolvedValue(mockMetaData);
    render(<LandingPage />);
    expect(api.getMetadata).toHaveBeenCalledTimes(1);
    expect(api.getAllInstances).toHaveBeenCalledTimes(1);
  });

  test("renders landing page with modal when showModal is true", () => {
    const mockMetaData = {};
    api.getMetadata.mockResolvedValue(mockMetaData);
    const { getByText, container } = render(<LandingPage />);
    const hideMessageCheckbox = container.querySelector("#hideMessageCheckbox");
    expect(getByText("welcomeText")).toBeInTheDocument();
    expect(hideMessageCheckbox).toBeInTheDocument();
    fireEvent.click(hideMessageCheckbox);
    expect(hideMessageCheckbox).toBeChecked();
    fireEvent.click(getByText("ok"));
    expect(getByText("welcomeText")).toBeInTheDocument();
  });

  test("handles successful API response", async () => {
    const showNotificationStatus = jest.fn();
    api.getMetadata.mockResolvedValueOnce(mockMetaData);
    render(<LandingPage />);
    await waitFor(() => {
      expect(api.getMetadata).toHaveBeenCalled();
    });
  });


  it('fetches instance data', async () => {
    api.getAllInstances.mockResolvedValueOnce(mockAllInstanceResponse);
    render(<LandingPage />);
    await waitFor(() => {
      expect(api.getAllInstances).toHaveBeenCalled();
    });
  });

  test("handles API error for getAllInstances and shows notification", async () => {
    const error = new Error("Failed to fetch instances");
    api.getAllInstances.mockRejectedValue(error);
    const showNotificationStatus = jest.fn();
    useNotification.mockReturnValue(showNotificationStatus);

    render(<LandingPage />);
    await waitFor(() => {
      expect(showNotificationStatus).toHaveBeenCalledWith(expect.objectContaining({
        ariaLabel: "error",
        id: expect.any(String),
        kind: "error",
        role: "alert",
        subtitle: "serverError",
        timeout: "",
        title: "failed"
      }));
    });
  });

  test("handles API error for getMetadata and shows notification", async () => {
    const error = new Error("Failed to fetch metadata");
    api.getMetadata.mockRejectedValue(error);
    const showNotificationStatus = jest.fn();
    useNotification.mockReturnValue(showNotificationStatus);

    render(<LandingPage />);
    await waitFor(() => {
      expect(showNotificationStatus).toHaveBeenCalledWith(expect.objectContaining({
        ariaLabel: "error",
        id: expect.any(String),
        kind: "error",
        role: "alert",
        subtitle: "serverError",
        timeout: "",
        title: "failed"
      }));
    });
  });
});
