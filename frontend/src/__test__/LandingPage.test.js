import React from "react";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import LandingPage from "../content/LandingPage/LandingPage";
import * as api from "../content/api/api";
import { mockMetaData, mockAllInstanceResponse } from "./utils";

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

describe("LandingPage", () => {
  let showNotificationStatus;
  beforeEach(() => {
    api.getMetadata.mockReset();
    api.getAllInstances.mockReset();
  });

  it('renders Landing page', async () => {
    render(<LandingPage />);
    const landingTitle = await screen.findByText('appTitle');
    expect(landingTitle).toBeVisible();
    await waitFor(() => {
      expect(screen.getByText('notification')).toBeInTheDocument();
    });
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
    showNotificationStatus = jest.fn();
    api.getMetadata.mockResolvedValueOnce(mockMetaData);
    render(<LandingPage />);
    await waitFor(() => {
      expect(api.getMetadata).toHaveBeenCalled();
    });
    // we are not showing any Metadata details so i have added except only for api call
  });


  it('fetches instance data', async () => {
    api.getAllInstances.mockResolvedValueOnce(mockAllInstanceResponse);
    render(<LandingPage />);
    await waitFor(() => {
      expect(api.getAllInstances).toHaveBeenCalled();
    });
    // we are not showing any instance details so i have added except only for api call
  });

  test("handles API error for getAllInstances and shows notification", async () => {
    const error = new Error("Failed to fetch instances");
    api.getAllInstances.mockRejectedValue(error);
    render(<LandingPage />);
    await waitFor(() => {
      const notification = screen.getByText(/serverError errorLogInfo/i);
      expect(notification).toBeInTheDocument();
    });
  });

  test("handles API error for getMetadata and shows notification", async () => {
    const error = new Error("Failed to fetch metadata");
    api.getMetadata.mockRejectedValue(error);
    render(<LandingPage />);
    const notification = await screen.findByText("serverError errorLogInfo");
    expect(notification).toBeInTheDocument();
  });

});