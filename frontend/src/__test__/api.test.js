import {
    getMetadata,
    LoginApi,
    getMonteCarlo,
    createMonteCarloInstances,
    monteCarloRunBenchmark,
    getMonteCarloRunLists,
    deleteMonteCarloInstances,
    resetBenchmark,
    getHuggingFace,
    createHuggingInstances,
    huggingRunBenchmark,
    getHuggingRunLists,
    deleteHuggingInstances,
    getByo,
    createByoInstances,
    deleteByoInstances,
    getByoPolling,
    getAllInstances,
    getByoLists,
    runByoApi,
    getInstanceStatus,
    getBenchmarkRunLogs,
    downloadLogsApi,
    getPrestoInstances, 
    createPrestoInstances, 
    prestoRunBenchmark, 
    deletePrestoInstances, 
    getPrestoRunLists,
    getPrestoBenchmarkStatus
} from "../content/api/api";
import apiRequest from "../content/api/apiRequest";
import { mockCreateData, mockResetData, mockRunData, mockHugSuccessResponse } from "./utils";
import { metadatajson } from "./metaDataApiMock";
jest.mock("../content/api/apiRequest", () => jest.fn());

describe("API functions", () => {
    const mockToken = "mockedToken";
    const mockData = { username: "admin", password: "test123" };
    const mockBody = { page: 1, count: 10 };
    const mockDelData = {
        headers: {},
        instanceIDs: ["0717_b0512a61-c7c6-45e5-81ad-c5d093facb19", "0717_8ee351a6-da92-43e6-961e-52a0d82b7ed1"]
    };
    const mockLogs = "mockedFilePath";
    beforeEach(() => {
        localStorage.setItem("token", mockToken);
    });

    afterEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    test("getMetadata", async () => {
      const mockResponse = { data: 'metadata' };
      apiRequest.mockResolvedValueOnce(mockResponse);
      const result = await metadatajson();
      expect(result).toEqual(mockResponse);
      expect(apiRequest).toHaveBeenCalledWith('get', './mockMetadata.json', null, {
        Authorization: mockToken,
      });
    });

    it('should throw an error when apiRequest fails', async () => {
      const errorMessage = 'Failed to fetch metadata';
      apiRequest.mockImplementationOnce(() => Promise.reject(new Error('API error')));
      await expect(metadatajson()).rejects.toThrow(errorMessage);
    });

    test("LoginApi", async () => {
        const mockResponse = { token: "newToken" };
        apiRequest.mockResolvedValueOnce(mockResponse);
        const result = await LoginApi(mockData);
        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/login`, mockData, { Authorization: mockToken });
    });

    test("getMonteCarlo - success", async () => {
        const mockResponse = { data: "mocked monte carlo data" };
        apiRequest.mockResolvedValueOnce(mockResponse);

        const result = await getMonteCarlo();

        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/get-montecarlo-instances`, null, { Authorization: mockToken });
    });

    test("getMonteCarlo - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);

        await expect(getMonteCarlo()).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/get-montecarlo-instances`, null, { Authorization: mockToken });
    });

    test("createMonteCarloInstances - success", async () => {
        const mockResponse = { data: "mocked monte carlo instance created" };
        apiRequest.mockResolvedValueOnce(mockResponse);

        const result = await createMonteCarloInstances(mockData);

        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/create-montecarlo-instances`, mockData, { Authorization: mockToken });
    });

    test("createMonteCarloInstances - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);

        await expect(createMonteCarloInstances(mockData)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/create-montecarlo-instances`, mockData, { Authorization: mockToken });
    });

    test("monteCarloRunBenchmark - success", async () => {
        const mockResponse = { data: "mocked monte carlo benchmark ran" };
        apiRequest.mockResolvedValueOnce(mockResponse);

        const result = await monteCarloRunBenchmark(mockData);

        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/run-montecarlo-benchmark`, mockData, { Authorization: mockToken });
    });

    test("monteCarloRunBenchmark - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);

        await expect(monteCarloRunBenchmark(mockData)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/run-montecarlo-benchmark`, mockData, { Authorization: mockToken });
    });

    test("getMonteCarloRunLists - success", async () => {
        const mockResponse = { data: "mocked monte carlo run lists data" };
        apiRequest.mockResolvedValueOnce(mockResponse);

        const result = await getMonteCarloRunLists(mockBody);

        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/list-montecarlo-benchmark?page=${mockBody.page}&count=${mockBody.count}`, null, { Authorization: mockToken });
    });

    test("getMonteCarloRunLists - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);

        await expect(getMonteCarloRunLists(mockBody)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/list-montecarlo-benchmark?page=${mockBody.page}&count=${mockBody.count}`, null, { Authorization: mockToken });
    });

    test("deleteMonteCarloInstances - success", async () => {
        const mockResponse = { data: "mocked monte carlo instances deleted" };
        apiRequest.mockResolvedValueOnce(mockResponse);

        const result = await deleteMonteCarloInstances(mockDelData);

        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("delete", `${process.env.REACT_APP_API_URL}sandbox/delete-montecarlo-instances`, mockDelData, { Authorization: mockToken });
    });

    test("deleteMonteCarloInstances - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);

        await expect(deleteMonteCarloInstances(mockDelData)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("delete", `${process.env.REACT_APP_API_URL}sandbox/delete-montecarlo-instances`, mockDelData, { Authorization: mockToken });
    });

    test("resetBenchmark - success", async () => {
        const mockResponse = { data: "mocked benchmark reset" };
        apiRequest.mockResolvedValueOnce(mockResponse);

        const result = await resetBenchmark(mockResetData);

        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/reset-benchmark`, mockResetData, { Authorization: mockToken });
    });

    test("resetBenchmark - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);

        await expect(resetBenchmark(mockResetData)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/reset-benchmark`, mockResetData, { Authorization: mockToken });
    });

    test("getHuggingFace - success", async () => {
        
        apiRequest.mockResolvedValueOnce(mockHugSuccessResponse);

        const result = await getHuggingFace();

        expect(result).toEqual(mockHugSuccessResponse);
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/get-huggingface-instances`, null, { Authorization: mockToken });
    });

    test("getHuggingFace - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);

        await expect(getHuggingFace()).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/get-huggingface-instances`, null, { Authorization: mockToken });
    });

    test("createHuggingInstances - success", async () => {
        const mockResponse = { data: "mocked hugging instances created" };
        apiRequest.mockResolvedValueOnce(mockResponse);

        const result = await createHuggingInstances(mockCreateData);

        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/create-huggingface-instances`, mockCreateData, { Authorization: mockToken });
    });

    test("createHuggingInstances - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);

        await expect(createHuggingInstances(mockCreateData)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/create-huggingface-instances`, mockCreateData, { Authorization: mockToken });
    });

    test("huggingRunBenchmark - success", async () => {
        const mockResponse = { data: "mocked hugging benchmark run" };
        apiRequest.mockResolvedValueOnce(mockResponse);

        const result = await huggingRunBenchmark(mockRunData);

        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/run-huggingface-benchmark`, mockRunData, { Authorization: mockToken });
    });

    test("huggingRunBenchmark - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);

        await expect(huggingRunBenchmark(mockRunData)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/run-huggingface-benchmark`, mockRunData, { Authorization: mockToken });
    });

    test("getHuggingRunLists - success", async () => {
        const mockResponse = { data: "mocked hugging run lists" };
        apiRequest.mockResolvedValueOnce(mockResponse);

        const result = await getHuggingRunLists(mockBody);

        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/list-huggingface-benchmark?page=${mockBody.page}&count=${mockBody.count}`, null, { Authorization: mockToken });
    });

    test("getHuggingRunLists - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);

        await expect(getHuggingRunLists(mockBody)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/list-huggingface-benchmark?page=${mockBody.page}&count=${mockBody.count}`, null, { Authorization: mockToken });
    });

    test("deleteHuggingInstances - success", async () => {
        const mockResponse = { data: "mocked hugging instances deleted" };
        apiRequest.mockResolvedValueOnce(mockResponse);

        const result = await deleteHuggingInstances(mockDelData);

        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("delete", `${process.env.REACT_APP_API_URL}sandbox/delete-huggingface-instances`, mockDelData, { Authorization: mockToken });
    });

    test("deleteHuggingInstances - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);

        await expect(deleteHuggingInstances(mockDelData)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("delete", `${process.env.REACT_APP_API_URL}sandbox/delete-huggingface-instances`, mockDelData, { Authorization: mockToken });
    });

    test("getByo - success", async () => {
        const mockResponse = { data: "mocked BYO instances data" };
        apiRequest.mockResolvedValueOnce(mockResponse);
    
        const result = await getByo();
    
        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/get-byo-instances`, null, { Authorization: mockToken });
      });
    
      test("getByo - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);
    
        await expect(getByo()).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/get-byo-instances`, null, { Authorization: mockToken });
      });

    test("createByoInstances - success", async () => {
        const mockResponse = { data: "mocked BYO instances created" };
        apiRequest.mockResolvedValueOnce(mockResponse);

        const result = await createByoInstances(mockCreateData);

        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/create-byo-instances`, mockCreateData, { Authorization: mockToken });
    });

    test("createByoInstances - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);

        await expect(createByoInstances(mockCreateData)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/create-byo-instances`, mockCreateData, { Authorization: mockToken });
    });

    test("deleteByoInstances - success", async () => {
        const mockResponse = { data: "mocked BYO instances deleted" };
        apiRequest.mockResolvedValueOnce(mockResponse);
    
        const result = await deleteByoInstances(mockDelData);
    
        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("delete", `${process.env.REACT_APP_API_URL}sandbox/delete-byo-instances`, mockDelData, { Authorization: mockToken });
      });
    
      test("deleteByoInstances - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);
    
        await expect(deleteByoInstances(mockDelData)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("delete", `${process.env.REACT_APP_API_URL}sandbox/delete-byo-instances`, mockDelData, { Authorization: mockToken });
      });

      test("getByoPolling - success", async () => {
        const mockResponse = { data: "mocked BYO polling data" };
        apiRequest.mockResolvedValueOnce(mockResponse);
    
        const result = await getByoPolling();
    
        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/byopolling`, null, { Authorization: mockToken });
      });
    
      test("getByoPolling - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);
    
        await expect(getByoPolling()).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/byopolling`, null, { Authorization: mockToken });
      });

      test("getAllInstances - success", async () => {
        const mockResponse = { data: "mocked all instances data" };
        apiRequest.mockResolvedValueOnce(mockResponse);
    
        const result = await getAllInstances(mockData);
    
        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/get-all-instances`, null, { Authorization: mockToken });
      });
    
      test("getAllInstances - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);
    
        await expect(getAllInstances(mockData)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/get-all-instances`, null, { Authorization: mockToken });
      });

      test("getByoLists - success", async () => {
        const mockResponse = { data: "mocked BYO lists data" };
        apiRequest.mockResolvedValueOnce(mockResponse);
    
        const result = await getByoLists(mockBody);
    
        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/list-byo-benchmark?page=${mockBody.page}&count=${mockBody.count}`, null, { Authorization: mockToken });
      });
    
      test("getByoLists - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);
    
        await expect(getByoLists(mockBody)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/list-byo-benchmark?page=${mockBody.page}&count=${mockBody.count}`, null, { Authorization: mockToken });
      });

      test("runByoApi - success", async () => {
        const mockResponse = { data: "mocked BYO API run success" };
        apiRequest.mockResolvedValueOnce(mockResponse);
    
        const result = await runByoApi(mockData);
    
        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/run-byo-benchmark`, mockData, { Authorization: mockToken });
      });
    
      test("runByoApi - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);
    
        await expect(runByoApi(mockData)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/run-byo-benchmark`, mockData, { Authorization: mockToken });
      });

      test("getInstanceStatus - success", async () => {
        const mockResponse = { data: "mocked instance status data" };
        apiRequest.mockResolvedValueOnce(mockResponse);
    
        const result = await getInstanceStatus();
    
        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/statusupdate`, null, { Authorization: mockToken });
      });
    
      test("getInstanceStatus - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);
    
        await expect(getInstanceStatus()).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/statusupdate`, null, { Authorization: mockToken });
      });

      test("getBenchmarkRunLogs - success", async () => {
        const mockResponse = { data: "mocked benchmark run logs" };
        apiRequest.mockResolvedValueOnce(mockResponse);
    
        const result = await getBenchmarkRunLogs(mockData);
    
        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/listlogs`, mockData, { Authorization: mockToken });
      });
    
      test("getBenchmarkRunLogs - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);
    
        await expect(getBenchmarkRunLogs(mockData)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/listlogs`, mockData, { Authorization: mockToken });
      });

      test("downloadLogsApi - success", async () => {
        const mockResponse = { data: "mocked log file" };
        apiRequest.mockResolvedValueOnce(mockResponse);
    
        const result = await downloadLogsApi(mockLogs);
    
        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/download-logs?filepath=${mockLogs}`, null, { Authorization: mockToken });
      });
    
      test("downloadLogsApi - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);
    
        await expect(downloadLogsApi(mockLogs)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/download-logs?filepath=${mockLogs}`, null, { Authorization: mockToken });
      });
      test("create presto instances - success", async () => {
        const mockResponse = { data: "mocked presto instances created" };
        apiRequest.mockResolvedValueOnce(mockResponse);

        const result = await createPrestoInstances(mockCreateData);

        expect(result).toEqual(mockResponse);
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/create-presto-instances`, mockCreateData, { Authorization: mockToken });
    });

    test("create presto instances - error", async () => {
        const mockError = new Error("API request failed");
        apiRequest.mockRejectedValueOnce(mockError);

        await expect(createPrestoInstances(mockCreateData)).rejects.toThrowError("API request failed");
        expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/create-presto-instances`, mockCreateData, { Authorization: mockToken });
    });

    test("getPrestoInstances - success", async () => {
      const mockResponse = { data: "mocked presto data" };
      apiRequest.mockResolvedValueOnce(mockResponse);

      const result = await getPrestoInstances();

      expect(result).toEqual(mockResponse);
      expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/get-presto-instances`, null, { Authorization: mockToken });
  });

  test("getPrestoInstances - error", async () => {
      const mockError = new Error("API request failed");
      apiRequest.mockRejectedValueOnce(mockError);

      await expect(getPrestoInstances()).rejects.toThrowError("API request failed");
      expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/get-presto-instances`, null, { Authorization: mockToken });
  });

  test("prestoRunBenchmark - success", async () => {
      const mockResponse = { data: "mocked monte carlo benchmark ran" };
      apiRequest.mockResolvedValueOnce(mockResponse);

      const result = await prestoRunBenchmark(mockData);

      expect(result).toEqual(mockResponse);
      expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/run-presto-benchmark`, mockData, { Authorization: mockToken });
  });

  test("prestoRunBenchmark - error", async () => {
      const mockError = new Error("API request failed");
      apiRequest.mockRejectedValueOnce(mockError);

      await expect(prestoRunBenchmark(mockData)).rejects.toThrowError("API request failed");
      expect(apiRequest).toHaveBeenCalledWith("post", `${process.env.REACT_APP_API_URL}sandbox/run-presto-benchmark`, mockData, { Authorization: mockToken });
  });

  test("getPrestoRunLists - success", async () => {
      const mockResponse = { data: "mocked presto run lists data" };
      apiRequest.mockResolvedValueOnce(mockResponse);

      const result = await getPrestoRunLists(mockBody);

      expect(result).toEqual(mockResponse);
      expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/list-presto-benchmark?page=${mockBody.page}&count=${mockBody.count}`, null, { Authorization: mockToken });
  });

  test("getPrestoRunLists - error", async () => {
      const mockError = new Error("API request failed");
      apiRequest.mockRejectedValueOnce(mockError);

      await expect(getPrestoRunLists(mockBody)).rejects.toThrowError("API request failed");
      expect(apiRequest).toHaveBeenCalledWith("get", `${process.env.REACT_APP_API_URL}sandbox/list-presto-benchmark?page=${mockBody.page}&count=${mockBody.count}`, null, { Authorization: mockToken });
  });

  test("deletePrestoInstances - success", async () => {
      const mockResponse = { data: "mocked presto instances deleted" };
      apiRequest.mockResolvedValueOnce(mockResponse);
      const result = await deletePrestoInstances(mockDelData);
      expect(result).toEqual(mockResponse);
      expect(apiRequest).toHaveBeenCalledWith("delete", `${process.env.REACT_APP_API_URL}sandbox/delete-presto-instances`, mockDelData, { Authorization: mockToken });
  });

  test("deletePrestoInstances - error", async () => {
      const mockError = new Error("API request failed");
      apiRequest.mockRejectedValueOnce(mockError);
      await expect(deletePrestoInstances(mockDelData)).rejects.toThrowError("API request failed");
      expect(apiRequest).toHaveBeenCalledWith("delete", `${process.env.REACT_APP_API_URL}sandbox/delete-presto-instances`, mockDelData, { Authorization: mockToken });
  });
  it('getPrestoBenchmarkStatus - success', async () => {
    const mockResponse = { status: 'success', data: { benchmark: 'running' } };
    apiRequest.mockImplementationOnce(() => Promise.resolve(mockResponse));
    const result = await getPrestoBenchmarkStatus();
    expect(result).toEqual(mockResponse);
    expect(apiRequest).toHaveBeenCalledWith('get',`${process.env.REACT_APP_API_URL}sandbox/get-presto-benchmark-status`,null,{ Authorization: mockToken });
  });
  it('getPrestoBenchmarkStatus - error', async () => {
    const errorMessage = 'API error';
    apiRequest.mockImplementationOnce(() => Promise.reject(new Error(errorMessage)));
    await expect(getPrestoBenchmarkStatus()).rejects.toThrow(errorMessage);
    expect(apiRequest).toHaveBeenCalledWith('get',`${process.env.REACT_APP_API_URL}sandbox/get-presto-benchmark-status`,null,{ Authorization: mockToken });
  });
});
