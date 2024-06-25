import React from 'react';
import { render, fireEvent, waitFor, act, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../login';
import { MemoryRouter } from 'react-router-dom';
import { LoginApi } from '../content/api/api';
import useNavigate from 'react-router-dom';

jest.mock('../components/theme', () => () => false);

jest.mock('../content/api/api', () => ({
  LoginApi: jest.fn()
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key
  })
}));

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn().mockImplementation((key) => store[key]),
    setItem: jest.fn().mockImplementation((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn().mockImplementation((key) => {
      delete store[key];
    }),
    clear: jest.fn().mockImplementation(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('LoginPage', () => {
  it('renders login page correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(getByText('appTitle')).toBeInTheDocument();
    expect(getByPlaceholderText('userName')).toBeInTheDocument();
    expect(getByPlaceholderText('password')).toBeInTheDocument();
    expect(getByText('Login')).toBeInTheDocument();
  });

  it('handles login form submission', async () => {
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    const usernameInput = getByPlaceholderText('userName');
    const passwordInput = getByPlaceholderText('password');
    act(() => {
      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'ENCODE_PASSWORD' } });
      fireEvent.click(getByText('Login'));
    });
    await waitFor(() => {
      expect(LoginApi).toHaveBeenCalledWith({
        username: 'admin',
        password: 'ENCODE_PASSWORD',
      });
    });
  });
  it('handles LoginApi function error', async () => {
    const mockLoginApi = jest.fn().mockRejectedValue(new Error('API error'));
    require('../content/api/api').LoginApi = mockLoginApi;

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => { });
    const usernameInput = getByPlaceholderText('userName');
    const passwordInput = getByPlaceholderText('password');
    act(() => {
      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'ENCODE_PASSWORD' } });
      fireEvent.click(getByText('Login'));
    });
    await waitFor(() => {
      expect(consoleErrorMock).toHaveBeenCalledWith(new Error('API error'));
    });
    consoleErrorMock.mockRestore();
  });


  it('handles network failure', async () => {
    const mockLoginApi = jest.fn().mockRejectedValue(new Error('Network error'));
    require('../content/api/api').LoginApi = mockLoginApi;

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    const usernameInput = getByPlaceholderText('userName');
    const passwordInput = getByPlaceholderText('password');
    act(() => {
      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'ENCODE_PASSWORD' } });
      fireEvent.click(getByText('Login'));
    });

    await waitFor(() => {
      expect(getByText('serverError')).toBeInTheDocument();
    });
  });

  it('handles wrong password', async () => {
    const mockLoginApi = jest.fn().mockRejectedValue({ response: { data: { message: 'Password is not valid' }, status: 401 } });
    require('../content/api/api').LoginApi = mockLoginApi;

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    const usernameInput = getByPlaceholderText('userName');
    const passwordInput = getByPlaceholderText('password');
    act(() => {
      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongPassword' } });
      fireEvent.click(getByText('Login'));
    });

    await waitFor(() => {
      expect(getByText('Password is not valid')).toBeInTheDocument();
    });
  });

  it('handles wrong username', async () => {
    const mockLoginApi = jest.fn().mockRejectedValue({ response: { data: { message: 'Password is not valid' }, status: 401 } });
    require('../content/api/api').LoginApi = mockLoginApi;

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    const usernameInput = getByPlaceholderText('userName');
    const passwordInput = getByPlaceholderText('password');
    act(() => {
      fireEvent.change(usernameInput, { target: { value: 'wrongUsername' } });
      fireEvent.change(passwordInput, { target: { value: 'ENCODE_PASSWORD' } });
      fireEvent.click(getByText('Login'));
    });

    await waitFor(() => {
      expect(getByText('Password is not valid')).toBeInTheDocument();
    });
  });

  test('renders login page and handles empty password', async ()=> {
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    const usernameInput = getByPlaceholderText('userName');
    const passwordInput = getByPlaceholderText('password');
    act(() => {
      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: '' } });
      fireEvent.click(getByText('Login'));
    });

    await waitFor(() => {
      expect(getByText('emptyPassword')).toBeInTheDocument();
    });
  });

  it('handles login success', async () => {
    const mockLoginApi = jest.fn().mockResolvedValue({ token: 'mockToken', username: 'admin' });
    require('../content/api/api').LoginApi = mockLoginApi;

    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    const usernameInput = getByPlaceholderText('userName');
    const passwordInput = getByPlaceholderText('password');

    act(() => {
      fireEvent.change(usernameInput, { target: { value: 'admin' } });
      fireEvent.change(passwordInput, { target: { value: 'ENCODE_PASSWORD' } });
      fireEvent.click(getByText('Login'));
    });

    await waitFor(() => {
      expect(mockLoginApi).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mockToken');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('userName', 'admin');
    });
  });

  it('handles login form submission with error', async () => {
    const mockError = new Error('Mock error');
    LoginApi.mockRejectedValueOnce(mockError);
    const { getByPlaceholderText, getByText } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    const usernameInput = getByPlaceholderText('userName');
    const passwordInput = getByPlaceholderText('password');
    const loginButton = getByText('Login');

    fireEvent.change(usernameInput, { target: { value: 'mockUsername' } });
    fireEvent.change(passwordInput, { target: { value: 'mockPassword' } });
    fireEvent.click(loginButton);
    try {
      await waitFor(() => {
        expect(LoginApi).toHaveBeenCalledWith({
          username: 'mockUsername',
          password: 'mockPassword',
        });
      });
    } catch (error) {
      console.error(error);
    }
    const errorMessage = await screen.findByText('serverError');
    expect(errorMessage).toBeInTheDocument();
  });

});