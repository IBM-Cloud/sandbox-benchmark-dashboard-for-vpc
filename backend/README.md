IBM Sandbox API Documentation

***
**LogIn**

Endpoint- **http://localhost:8080/v1/sandbox/login**

This API endpoint is used to authenticate and login a user. Upon a successful login, the server returns a token for further authentication.

**Request Body**

- username (string, required): The username of the user.
- password (string, required): The password of the user.

**Response**

- token (string): The authentication token for the logged-in user.
- code (integer): The status code of the response.
- error (string): Any error message, if applicable.
- message (string): Additional information message.
- success (boolean): Indicates the success of the request.

***

**MONTE CARLO APPLICATION**

**1 Create Monte Carlo Instances**

Endpoint- **http://localhost:8080/v1/sandbox/create-montecarlo-instances**

This endpoint makes an HTTP POST request. It is used to create a Monte Carlo instance in the sandbox environment.

**Request Body**

- applicationName     (string, mandatory): The name of the application.
- instanceProfileName     (string, mandatory): The name of the instance profile.
- vpcID     (string, mandatory): The ID of the VPC.
- subnetID     (string, mandatory): The ID of the subnet.
- zone     (string, mandatory): The zone for the instance.
- resourcegroup     (string, mandatory): The resource group for the instance.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

The instanceProfileName will be the user input to create for 8xCPUs or 16xCPUs, and the rest of the parameters will be fetched from metadata API

**Response**

- code     (integer): The status code.
- message     (string): Any additional message.
- status     (string): The status of the request.
- success     (boolean): Indicates if the request was successful.

 

**2 Get Monte Carlo Instances**

Endpoint- **http://localhost:8080/v1/sandbox/get-montecarlo-instances**

This endpoint makes an HTTP GET request to retrieve a Monte Carlo instance from the sandbox. The request does not contain a request body. 

**Request**
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

- Status:     200
- The     response body contains the following fields:
  - code      (number): The code for the response.
  - createFlag      (boolean): Indicates whether the create flag is true or false.
  - deleteFlag      (boolean): Indicates whether the delete flag is true or false.
  - error      (null): Indicates any error in the response.
  - instances      (array): An array of instances with the following fields:
    - id       (string): The ID of the instance.
    - vsiName       (string): The name of the VSI.
    - vsiProfile       (string): The profile of the VSI.
    - ipAddress       (string): The IP address of the VSI.
    - vsiStatus       (string): The status of the VSI.
    - createTime       (string): The creation time of the VSI.
    - deleteBit       (string): The delete bit of the VSI.
    - AppName       (string): The name of the application.
  - message      (string): Any message included in the response.
- success     (boolean): Indicates whether the request was successful or not.

**3 Delete Monte Carlo Instances** 

Endpoint- **http://localhost:8080/v1/sandbox/delete-montecarlo-instances**

This endpoint makes an HTTP DELETE request. It is used to delete a Monte Carlo instance.

**Request**

- instanceIDs     (array of strings): The ID of the Monte Carlo instance to be deleted will be passed from get Monte Carlo Instance API.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

- code     (integer): The status code.
- message     (string): Any additional message.
- status     (string): The status of the request.
- success     (boolean): Indicates if the request was successful.

**4 Run Monte Carlo Benchmark**

Endpoint- **http://localhost:8080/v1/sandbox/run-montecarlo-benchmark**

This endpoint makes an HTTP POST request. It is used to run a Monte Carlo benchmark in the sandbox environment.

**Request**

- address     ([]string, mandatory): The IP address of the instance.
- sshUsername     (string, mandatory): The username of the SSH.
- port     (string, mandatory): The Port where the SSH runs.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

- code     (integer): The status code.
- message     (string): Any additional message.
- status     (string): The status of the request.
- success     (boolean): Indicates if the request was successful.

 

**5 List Monte Carlo Benchmark**

Endpoint- **http://localhost:8080/v1/sandbox/list-montecarlo-benchmark**

This endpoint makes an HTTP GET request to retrieve a list of Monte Carlo benchmarks. The request includes query parameters for page number, and count. The response will include a list of benchmarks along with additional metadata such as success status, and flags for create and delete operations.

**Request**

- Query     Parameters:
  - page      (required): The page number of the results to retrieve.
  - count      (required): The number of benchmarks to retrieve per page.
  - Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

The response includes:

- ListTest ([]string):     An array of benchmark objects with their respective attributes like ID, VSI Name, VSI Profile, Performance metric(Opt/Sec), CPU Utilization, Memory     Utilization, Time.
- code (integer):     A code related to the response.
- createFlag (boolean):     A boolean indicating the create operation status.
- deleteFlag (boolean):     A boolean indicating the delete operation status.
- message (string):     Any additional message related to the response.
- success (boolean):     A boolean indicating the overall success status of the request.

***

**HUGGINGFACE APPLICATION**

**6 Create HuggingFace Instances**

Endpoint- **http://localhost:8080/v1/sandbox/create-huggingface-instances**

This endpoint makes an HTTP POST request. It is used to create a HuggingFace instance in the sandbox environment.

**Request**

- applicationName     (string, mandatory): The name of the application.
- instanceProfileName     (string, mandatory): The name of the instance profile.
- vpcID     (string, mandatory): The ID of the VPC.
- subnetID     (string, mandatory): The ID of the subnet.
- zone     (string, mandatory): The zone for the instance.
- resourcegroup     (string, mandatory): The resource group for the instance.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

The instanceProfileName will be the user input to create for 16xCPUs, and the rest of the parameters will be fetched from metadata API

**Response**

- code     (integer): The status code.
- message     (string): Any additional message.
- status     (string): The status of the request.
- success     (boolean): Indicates if the request was successful.

 

**7 Get HuggingFace Instances**

Endpoint- **http://localhost:8080/v1/sandbox/get-huggingface-instances**

This endpoint makes an HTTP GET request to retrieve a HuggingFace instance from the sandbox. The request does not contain a request body. 

**Request**
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

- Status:     200
- The     response body contains the following fields:
  - code      (number): The code for the response.
  - createFlag      (boolean): Indicates whether the create flag is true or false.
  - deleteFlag      (boolean): Indicates whether the delete flag is true or false.
  - error      (null): Indicates any error in the response.
  - instances      (array): An array of instances with the following fields:
    - id       (string): The ID of the instance.
    - vsiName       (string): The name of the VSI.
    - vsiProfile       (string): The profile of the VSI.
    - ipAddress       (string): The IP address of the VSI.
    - vsiStatus       (string): The status of the VSI.
    - createTime       (string): The creation time of the VSI.
    - deleteBit       (string): The delete bit of the VSI.
    - AppName       (string): The name of the application.
  - message      (string): Any message included in the response.
- success     (boolean): Indicates whether the request was successful or not.

**8 Delete HuggingFace Instances**

Endpoint- **http://localhost:8080/v1/sandbox/delete-huggingface-instances**

This endpoint makes an HTTP DELETE request. It is used to delete a HuggingFace instance.

**Request**

- instanceIDs     (array of strings): The ID of the HuggingFace instance to be deleted will be passed from get HuggingFace Instance API.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

- code     (integer): The status code.
- message     (string): Any additional message.
- status     (string): The status of the request.
- success     (boolean): Indicates if the request was successful.

 

**9 Run Huggingface Benchmark**

Endpoint- **http://localhost:8080/v1/sandbox/run-huggingface-benchmark**

This endpoint makes an HTTP POST request. It is used to run a HuggingFace benchmark in the sandbox environment.

**Request**

- address     ([]string, mandatory): The IP address of the instance.
- sshUsername     (string, mandatory): The username of the SSH.
- port     (string, mandatory): The Port where the SSH runs.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

- code     (integer): The status code.
- message     (string): Any additional message.
- status     (string): The status of the request.
- success     (boolean): Indicates if the request was successful.

 

**10 List HuggingFace Benchmark**

Endpoint- **http://localhost:8080/v1/sandbox/list-huggingface-benchmark**

This endpoint makes an HTTP GET request to retrieve a list of HuggingFace benchmarks. The request includes query parameters for page number, and count. The response will include a list of benchmarks along with additional metadata such as success status, and flags for create and delete operations.

**Request**

- Query     Parameters:
  - page      (required): The page number of the results to retrieve.
  - count      (required): The number of benchmarks to retrieve per page.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

The response includes:

- ListTest:     An array of benchmark objects with their respective attributes like ID, VSI Name, VSI Profile, BertShortSentence,BertShortSentenceArray,RobertaShortSentence,RobertaShortSentenceArray, CPU Utilization, Memory     Utilization, Time.
- code (integer):     A code related to the response.
- createFlag (boolean):     A boolean indicating the create operation status.
- deleteFlag (boolean):     A boolean indicating the delete operation status.
- message (string):     Any additional message related to the response.
- success (boolean):     A boolean indicating the overall success status of the request.

***

**Bring Your Own Application (BYOA)**

**11 Create BYOA Instances**

Endpoint- **http://localhost:8080/v1/sandbox/create-byo-instances**

This endpoint makes an HTTP POST request. It is used to create a BYOA instance in the sandbox environment.

**Request Body**

- applicationName     (string, mandatory): The name of the application.
- instanceProfileName     (string, mandatory): The name of the instance profile.
- vpcID     (string, mandatory): The ID of the VPC.
- subnetID     (string, mandatory): The ID of the subnet.
- zone     (string, mandatory): The zone for the instance.
- resourcegroup     (string, mandatory): The resource group for the instance.
- userData(string,optional): The user data contains the script of the user to be executed in the BYOA application.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

The instanceProfileName will be the user input to create for 8xCPUs or 16xCPUs, and the rest of the parameters will be fetched from metadata API

 

**12 Get BYOA Instances**

Endpoint- **http://localhost:8080/v1/sandbox/get-byo-instances**

This endpoint makes an HTTP GET request to retrieve a BYOA instance from the sandbox. The request does not contain a request body. 

**Request**

- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

- Status:     200
- The     response body contains the following fields:
  - code      (number): The code for the response.
  - createFlag      (boolean): Indicates whether the create flag is true or false.
  - deleteFlag      (boolean): Indicates whether the delete flag is true or false.
  - byoPollingFlag (boolean): Indicates whether the byo polling flag is true or false.
  - error      (null): Indicates any error in the response.
  - instances      (array): An array of instances with the following fields:
    - id       (string): The ID of the instance.
    - vsiName       (string): The name of the VSI.
    - vsiProfile       (string): The profile of the VSI.
    - ipAddress       (string): The IP address of the VSI.
    - vsiStatus       (string): The status of the VSI.
    - createTime       (string): The creation time of the VSI.
    - deleteBit       (string): The delete bit of the VSI.
    - AppName       (string): The name of the application.
  - message      (string): Any message included in the response.
- success     (boolean): Indicates whether the request was successful or not.


**13 Delete BYOA Instances**

Endpoint- **http://localhost:8080/v1/sandbox/delete-byo-instances**

This endpoint makes an HTTP DELETE request. It is used to delete a BYOA instance.

**Request**

- instanceIDs     (array of strings): The ID of the BYOA instance to be deleted will be passed from get BYOA Instance API.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

- code     (integer): The status code.
- message     (string): Any additional message.
- status     (string): The status of the request.
- success     (boolean): Indicates if the request was successful.

 

**14 Run BYOA Benchmark**

Endpoint- **http://localhost:8080/v1/sandbox/run-byo-benchmark**

This endpoint makes an HTTP POST request which is used to run BYOA script passed by user.

**Request**
- address     ([]string, mandatory): The IP address of the instance.
- sshUsername     (string, mandatory): The username of the SSH.
- port     (string, mandatory): The Port where the SSH runs.
- byoScript(string,optional): The user data contains the script of the user to be executed in the BYOA application.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

- code     (integer): The status code.
- message     (string): Any additional message.
- status     (string): The status of the request.
- success     (boolean): Indicates if the request was successful.

**15 List BYOA Benchmark**

Endpoint- **http://localhost:8080/v1/sandbox/list-byo-benchmark**

This endpoint makes an HTTP GET request to retrieve a list of items based on the provided count, and page number.

**Request**

- count     (query parameter): The number of items to be included in the response.
- page     (query parameter): The page number for paginated results.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

The response to the request has a status code of 200 and includes the following fields:

- ListTest     (array): An array of objects containing information about the items retrieved, including ID, VSI type, VSI profile, current and maximum CPU utilization, current and maximum memory utilization, current and maximum network utilization of both Receiver and Transmitter, current and maximum IO utilization, and time.
- createFlag (boolean):     A boolean indicating the create operation status.
- deleteFlag (boolean):     A boolean indicating the delete operation status.
- code     (string): A code indicating the status of the response.
- message     (string): A message related to the response status.
- success     (boolean): Indicates whether the request was successful.

**16 BYOA Polling**

Endpoint- **http://localhost:8080/v1/sandbox/byopolling**

This endpoint makes an HTTP GET request to retrieve data from the API which will be updated in the database within an interval. Capturing the current and the maximum utilization parameters of the BYOA.

***

**DATA LAKE APPLICATION USING PRESTO**

**17 Create Presto Instances**

Endpoint- **http://localhost:8080/v1/sandbox/create-presto-instances**

This endpoint makes an HTTP POST request. It is used to create a Presto instance in the sandbox environment.

**Request Body**

- applicationName     (string, mandatory): The name of the application.
- instanceProfileName     (string, mandatory): The name of the instance profile.
- vpcID     (string, mandatory): The ID of the VPC.
- subnetID     (string, mandatory): The ID of the subnet.
- zone     (string, mandatory): The zone for the instance.
- resourcegroup     (string, mandatory): The resource group for the instance.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

The instanceProfileName will be provided by the user to create a 16xCPU instance, and the rest of the parameters will be fetched from the getMetadata API.

**Response**

- code     (integer): The status code.
- message     (string): Any additional message.
- status     (string): The status of the request.
- success     (boolean): Indicates if the request was successful.

 

**18 Get Presto Instances**

Endpoint- **http://localhost:8080/v1/sandbox/get-presto-instances**

This endpoint makes an HTTP GET request to retrieve a Presto instance from the sandbox. The request does not contain a request body. 

**Request**
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

- Status:     200
- The     response body contains the following fields:
  - code      (number): The code for the response.
  - createFlag      (boolean): Indicates whether the create flag is true or false.
  - deleteFlag      (boolean): Indicates whether the delete flag is true or false.
  - error      (null): Indicates any error in the response.
  - instances      (array): An array of instances with the following fields:
    - id       (string): The ID of the instance.
    - vsiName       (string): The name of the VSI.
    - vsiProfile       (string): The profile of the VSI.
    - ipAddress       (string): The IP address of the VSI.
    - vsiStatus       (string): The status of the VSI.
    - createTime       (string): The creation time of the VSI.
    - deleteBit       (string): The delete bit of the VSI.
    - AppName       (string): The name of the application.
  - message      (string): Any message included in the response.
- success     (boolean): Indicates whether the request was successful or not.

**19 Delete Presto Instances** 

Endpoint- **http://localhost:8080/v1/sandbox/delete-presto-instances**

This endpoint makes an HTTP DELETE request. It is used to delete a Presto instance.

**Request**

- instanceIDs     (array of strings): The ID of the Presto instance to be deleted will be passed.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

- code     (integer): The status code.
- message     (string): Any additional message.
- status     (string): The status of the request.
- success     (boolean): Indicates if the request was successful.


**20 Run Presto Benchmark**

Endpoint- **http://localhost:8080/v1/sandbox/run-presto-benchmark**

This endpoint makes an HTTP POST request. It is used to run a Presto benchmark in the sandbox environment.

**Request**

- address     ([]string, mandatory): The IP address of the instance.
- sshUsername     (string, mandatory): The username of the SSH.
- port     (string, mandatory): The port is listening.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

- code     (integer): The status code.
- message     (string): Any additional message.
- status     (string): The status of the request.
- success     (boolean): Indicates if the request was successful.

 
**21 Get Presto Becnhmark Status**

Endpoint- **http://localhost:8080/v1/sandbox/get-presto-benchmark-status**

This endpoint makes an HTTP GET request to collect the presto benchmark result from the output and store the result in the database.

**Request**

- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

The response includes:

- code (integer):     A code related to the response.
- message (string):     Any additional message related to the response.
- success (boolean):     A boolean indicating the overall success status of the request.
- error (string): Any error message, if applicable.

**22 List Presto Benchmark**

Endpoint- **http://localhost:8080/v1/sandbox/list-presto-benchmark**

This endpoint makes an HTTP GET request to retrieve a list of Presto benchmarks. The request includes query parameters for page number, and count. The response will include a list of benchmarks along with additional metadata such as success status, and flags for create and delete operations.

**Request**

- Query     Parameters:
  - page      (required): The page number of the results to retrieve.
  - count      (required): The number of benchmarks to retrieve per page.
  - Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

The response includes:

- ListTest ([]string):     An array of benchmark objects with their respective attributes like ID, VSI Name, VSI Profile, Performance metric(Opt/Sec), CPU Utilization, Memory     Utilization, Time.
- code (integer):     A code related to the response.
- createFlag (boolean):     A boolean indicating the create operation status.
- deleteFlag (boolean):     A boolean indicating the delete operation status.
- message (string):     Any additional message related to the response.
- success (boolean):     A boolean indicating the overall success status of the request.

***


**COMMON APIS**

**23 Get All Instances**

Endpoint- **http://localhost:8080/v1/sandbox/get-all-instances**

This API endpoint makes an HTTP POST request to retrieve all instances.

**Request**
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

- code     (number): The status code of the response.
- error     (string): Any error message, if applicable.
- instances     (array): An array of objects, each representing an instance with the following properties:
  - id      (string): The unique identifier of the instance.
  - vsiName      (string): The name of the instance.
  - vsiProfile      (string): The profile of the instance.
  - ipAddress      (string): The IP address of the instance.
  - vsiStatus      (string): The status of the instance.
  - createTime      (string): The creation time of the instance.
  - deleteBit      (string): The deletion status of the instance.
  - AppName      (string): The name of the application associated with the instance.
- message     (string): Any additional message from the server.
- success     (boolean): Indicates the success status of the request.

 

**24 Get Metadata**

Endpoint- **http://localhost:8080/v1/sandbox/getmetadata**

This HTTP GET request retrieves metadata for a specific resource. The request does not require any payload in the request body.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

The response to the request returns a status code of 200 along with a JSON object containing various metadata fields. The "code" field indicates the success status, and the "data" field contains detailed metadata information such as availability policy, bandwidth, boot volume attachment, creation details, disks information, image details, memory, network interfaces, vCPU details, volume attachments, VPC details, and zone information.

The response also includes a "message" field for any additional information and a "success" field indicating the overall success status of the request.

 

**25 Status Update**

Endpoint- **http://localhost:8080/v1/sandbox/statusupdate**

This HTTP GET request that checks and updates the status of the instances from IBM cloud to the local database. The request does not require any payload in the request body.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.
 

**26 List Logs**

Endpoint- **http://localhost:8080/v1/sandbox/listlogs**

This endpoint makes an HTTP POST request to retrieve a list of logs from the sandbox. The request payload includes parameters for count, page, search, logsFilter, and sort. The response will include a status code of 200 along with a JSON object containing code, count, data array, headers, message, pageNo, search, success, totalEntry, and totalPage.

**Request**

- count     (integer): The number of logs to retrieve.
- page     (integer): The page number for pagination.
- search     (string): A search keyword for filtering logs.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

- code     (string): The code related to the response.
- count     (integer): The count of logs in the response.
- data     (array): An array of log objects containing ID, Name, BenchMark, VSIName, Category, Status, Date, and Attachments.
- headers     (array): An array of headers related to the response.
- message     (string): A message related to the response.
- pageNo     (integer): The page number in the response.
- search     (string): The search keyword used in the response.
- success     (boolean): Indicates the success status of the response.
- totalEntry     (integer): The total number of log entries.
- totalPage     (integer): The total number of pages for pagination.

 

**27 Download Logs**

Endpoint- **http://localhost:8080/v1/sandbox/download-logs?filepath=**

This endpoint makes an HTTP GET request to download log files from the sandbox. The request should include the file path as a query parameter. 

**Request** 

- filepath:     The path of the log file to be downloaded.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

Upon a successful request, the response will have a status code of 200 and will include the following fields:

- FileContent (string):     The content of the downloaded log file.
- code (integer):     A code indicating the status of the request.
- message (string):     A message related to the request.
- success (boolean):     A boolean value indicating the success of the request.

If the request is successful, the "FileContent" field will contain the content of the downloaded log file.

**28 Reset Benchmark Run**
 Endpoint- **http://localhost:8080/v1/sandbox/reset-benchmark**

This endpoint makes an HTTP POST request to reset the benchmark run at anytime whenever there is a failure or error while executing the benchmark for the above applications.

**Request** 

- benchmarkName: The application name that needs its benchmark to reset.
- instanceIds: Array of instance id based on which we delete the benchmark record.
- Authorization (mandatory, headers): The token genarated while login, used to secure the API endpoints.

**Response**

Upon a successful request, the response will have a status code of 200 and will include the following fields:

- code (integer):     A code indicating the status of the request.
- message (string):     A message related to the request.
- success (boolean):     A boolean value indicating the success of the request.

If the request is successful, the records  will be deleted from the database and reset the benchmark to run again.
