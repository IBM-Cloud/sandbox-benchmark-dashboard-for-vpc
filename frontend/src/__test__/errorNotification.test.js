import errorNotification from "../content/component/errorNotification";
import '@testing-library/jest-dom';
const showNotificationStatus = jest.fn();

describe('errorNotification function', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call showNotificationStatus with serverError if error.response is undefined', () => {
    const error = new Error('Network error');
    const serverError = 'Server error message';
    const errorKey = 'someErrorKey';
    const errorLog = 'Error log message';
    errorNotification(error, serverError, errorKey, showNotificationStatus, errorLog);
    expect(showNotificationStatus).toHaveBeenCalledWith("error", errorKey, serverError, errorLog);
  });

  it('should call showNotificationStatus with error.response.data.message if error.response is defined', () => {
    const error = {
      response: {
        data: {
          message: 'Response error message'
        }
      }
    };
    const serverError = 'Server error message';
    const errorKey = 'someErrorKey';
    const errorLog = 'Error log message';
    errorNotification(error, serverError, errorKey, showNotificationStatus, errorLog);
    expect(showNotificationStatus).toHaveBeenCalledWith("error", errorKey, error.response.data.message, errorLog);
  });
});
