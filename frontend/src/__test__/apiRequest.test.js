
import apiRequest from '../content/api/apiRequest';
import axios from 'axios';

jest.mock('axios');

describe('apiRequest', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should call axios with correct parameters and return data on success', async () => {
        const mockData = { id: 1, name: 'test' };
        axios.mockResolvedValueOnce({ data: mockData });

        const result = await apiRequest('GET', '/test-url', null, { 'Content-Type': 'application/json' });

        expect(axios).toHaveBeenCalledWith({
            method: 'GET',
            url: '/test-url',
            data: null,
            headers: { 'Content-Type': 'application/json' }
        });
        expect(result).toEqual(mockData);
    });

    it('should call axios with default headers and data when not provided', async () => {
        const mockData = { success: true };
        axios.mockResolvedValueOnce({ data: mockData });

        await apiRequest('POST', '/api/data');

        expect(axios).toHaveBeenCalledWith({
            method: 'POST',
            url: '/api/data',
            data: null,
            headers: {}
        });
    });

    it('should pass data correctly in the request', async () => {
        const requestData = { payload: 'abc' };
        axios.mockResolvedValueOnce({ data: {} });

        await apiRequest('POST', '/api/submit', requestData);

        expect(axios).toHaveBeenCalledWith(expect.objectContaining({
            data: requestData
        }));
    });

    it('should throw error when request fails', async () => {
        const mockError = new Error('Network Error');
        axios.mockRejectedValueOnce(mockError);

        await expect(apiRequest('GET', '/error')).rejects.toThrow('Network Error');
    });
});
