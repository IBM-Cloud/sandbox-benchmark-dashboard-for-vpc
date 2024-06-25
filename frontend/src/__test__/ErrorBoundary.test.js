import React from "react";
import { render } from "@testing-library/react";
import '@testing-library/jest-dom';
import { I18nextProvider } from "react-i18next";
import { i18n } from "i18next";

import ErrorBoundary from "../components/ErrorBoundary";

describe("ErrorBoundary", () => {
  it("should render error message if an error occurs", () => {
    const mockError = new Error("Page is not loading properly");
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(ErrorBoundary.prototype, "componentDidCatch");
    const t = jest.fn().mockReturnValue("Error Message");
    const { getByText } = render(
      <I18nextProvider i18n={i18n}>
        <ErrorBoundary t={t}>
          <ChildComponentThatThrowsError />
        </ErrorBoundary>
      </I18nextProvider>
    );

    expect(ErrorBoundary.prototype.componentDidCatch).toHaveBeenCalledTimes(1);
    expect(getByText("Error Message")).toBeInTheDocument();
  });
});

function ChildComponentThatThrowsError() {
  throw new Error("Page is not loading properly");
}
