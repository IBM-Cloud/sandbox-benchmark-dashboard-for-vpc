
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CommonUI from '../content/commonui/commonui';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Mock Modules
jest.mock('jwt-decode', () => ({
    jwtDecode: jest.fn(),
}));
jest.mock('../content/api/api', () => ({
    getByoPolling: jest.fn(),
}));

// Mock CSS
jest.mock('@carbon/charts-react/styles.css', () => { });


// Mock Carbon Components
jest.mock('@carbon/react', () => ({
    HeaderContainer: ({ render }) => render({ isSideNavExpanded: true, onClickSideNavExpand: jest.fn() }),
    Header: ({ children }) => <header>{children}</header>,
    SkipToContent: () => <div>Skip</div>,
    HeaderMenuButton: () => <button>Menu</button>,
    HeaderName: ({ children, onClick }) => <div data-testid="header-name" onClick={onClick}>{children}</div>,
    HeaderGlobalBar: ({ children }) => <div>{children}</div>,
    HeaderGlobalAction: ({ children }) => <div>{children}</div>,
    SideNav: ({ children }) => <nav>{children}</nav>,
    SideNavItems: ({ children }) => <ul>{children}</ul>,
    SideNavLink: ({ children, onClick, isActive }) => <li data-testid="sidenav-link" className={isActive ? 'active' : ''} onClick={onClick}>{children}</li>,
    Content: ({ children }) => <main>{children}</main>,
    Theme: ({ children }) => <div>{children}</div>,
    OverflowMenu: ({ children }) => <div>{children}</div>,
    OverflowMenuItem: ({ onClick, itemText }) => <div onClick={onClick}>{itemText}</div>,
    Modal: ({ open, onRequestSubmit, children }) => open ? (
        <div data-testid="session-modal">
            {children}
            <button onClick={onRequestSubmit}>Login</button>
        </div>
    ) : null,
}));

jest.mock('@carbon/react/icons', () => ({
    Notification: () => <svg />,
    User: () => <svg />,
    IbmCloud: () => <svg />,
}));

// Mocks
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('../components/theme', () => jest.fn(() => false)); // Default to light theme

describe('CommonUI Component', () => {
    const mockNavigate = jest.fn();
    const originalLocalStorage = window.localStorage;

    beforeEach(() => {
        jest.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
        // Default valid token
        jwtDecode.mockReturnValue({ exp: (Date.now() / 1000) + 3600 });

        const localStorageMock = (function () {
            let store = {};
            return {
                getItem: jest.fn((key) => store[key] || null),
                setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
                removeItem: jest.fn((key) => { delete store[key]; }),
                clear: jest.fn(() => { store = {}; })
            };
        })();
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    });

    afterEach(() => {
        Object.defineProperty(window, 'localStorage', { value: originalLocalStorage });
        jest.restoreAllMocks();
    });

    test('renders without crashing and displays title', () => {
        render(
            <BrowserRouter>
                <CommonUI />
            </BrowserRouter>
        );
        expect(screen.getByTestId('header-name')).toHaveTextContent('appTitle');
    });

    test('navigates to home on clicking header name', () => {
        render(
            <BrowserRouter>
                <CommonUI />
            </BrowserRouter>
        );
        fireEvent.click(screen.getByTestId('header-name'));
        expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    test('handles logout correctly', () => {
        window.localStorage.setItem('token', 'test-token');
        render(
            <BrowserRouter>
                <CommonUI />
            </BrowserRouter>
        );
        fireEvent.click(screen.getByText('Logout'));
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('token');
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('handles side nav navigation to configuration details', () => {
        render(
            <BrowserRouter>
                <CommonUI />
            </BrowserRouter>
        );
        const links = screen.getAllByTestId('sidenav-link');
        const confLink = links.find(el => el.textContent === 'configurationDetails');
        fireEvent.click(confLink);
        expect(mockNavigate).toHaveBeenCalledWith('/configuration-details');
    });

    test('handles side nav navigation to performance dashboard', () => {
        render(
            <BrowserRouter>
                <CommonUI />
            </BrowserRouter>
        );
        const links = screen.getAllByTestId('sidenav-link');
        const perfLink = links.find(el => el.textContent === 'performanceDashboard');
        fireEvent.click(perfLink);
        expect(mockNavigate).toHaveBeenCalledWith('/performance-dashboard');
    });

    test('handles side nav navigation to benchmark logs', () => {
        render(
            <BrowserRouter>
                <CommonUI />
            </BrowserRouter>
        );
        const links = screen.getAllByTestId('sidenav-link');
        const logsLink = links.find(el => el.textContent === 'benchmarkLogs');
        fireEvent.click(logsLink);
        expect(mockNavigate).toHaveBeenCalledWith('/benchmarklogs');
    });

    test('handles side nav navigation to support', () => {
        render(
            <BrowserRouter>
                <CommonUI />
            </BrowserRouter>
        );
        const links = screen.getAllByTestId('sidenav-link');
        const supportLink = links.find(el => el.textContent === 'programSupport');
        fireEvent.click(supportLink);
        expect(mockNavigate).toHaveBeenCalledWith('/support');
    });

    test('handles side nav navigation to home', () => {
        render(
            <BrowserRouter>
                <CommonUI />
            </BrowserRouter>
        );
        const links = screen.getAllByTestId('sidenav-link');
        const homeLink = links.find(el => el.textContent === 'appTitle');
        fireEvent.click(homeLink);
        expect(mockNavigate).toHaveBeenCalledWith('/home');
    });

    test('validates token expiration - valid token', () => {
        window.localStorage.setItem('token', 'valid-token');
        jwtDecode.mockReturnValue({ exp: (Date.now() / 1000) + 1000 }); // Future expiration

        render(
            <BrowserRouter>
                <CommonUI />
            </BrowserRouter>
        );

        expect(screen.queryByTestId('session-modal')).not.toBeInTheDocument();
    });

    test('validates token expiration - expired token', () => {
        window.localStorage.setItem('token', 'expired-token');
        jwtDecode.mockReturnValue({ exp: (Date.now() / 1000) - 1000 }); // Past expiration

        render(
            <BrowserRouter>
                <CommonUI />
            </BrowserRouter>
        );

        expect(screen.getByTestId('session-modal')).toBeInTheDocument();
    });

    test('shows modal when no token is present', () => {
        window.localStorage.getItem.mockReturnValue(null);
        render(
            <BrowserRouter>
                <CommonUI />
            </BrowserRouter>
        );
        expect(screen.getByTestId('session-modal')).toBeInTheDocument();
    });

    test('closes modal and navigates to login', () => {
        window.localStorage.getItem.mockReturnValue(null);
        render(
            <BrowserRouter>
                <CommonUI />
            </BrowserRouter>
        );

        fireEvent.click(screen.getByText('Login'));
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    test('resets timeout on user interaction', () => {
        jest.useFakeTimers();
        window.localStorage.setItem('token', 'valid-token');
        jwtDecode.mockReturnValue({ exp: (Date.now() / 1000) + 10000 });

        render(
            <BrowserRouter>
                <CommonUI />
            </BrowserRouter>
        );

        expect(screen.queryByTestId('session-modal')).not.toBeInTheDocument();

        // Advance time near timeout (e.g. 50 mins)
        act(() => {
            jest.advanceTimersByTime(50 * 60 * 1000);
        });

        // Trigger interaction
        act(() => {
            window.dispatchEvent(new Event('mousemove'));
        });

        // Advance time to where original timeout would have been (89 mins)
        // Passed 50 mins, need 39 more to hit original 89.
        act(() => {
            jest.advanceTimersByTime(40 * 60 * 1000);
        });

        // Total 90 mins from start. If check wasn't reset, modal would show.
        // Since we reset at 50, now we are at 40 mins into new timer. (Timeout is 89 mins).
        expect(screen.queryByTestId('session-modal')).not.toBeInTheDocument();

        // Advance remaining time (49 mins + some buffer)
        act(() => {
            jest.advanceTimersByTime(50 * 60 * 1000);
        });

        expect(screen.getByTestId('session-modal')).toBeInTheDocument();

        jest.useRealTimers();
    });
});
