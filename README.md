# IBM Cloud Virtual Servers for VPC Sandbox

Welcome to the IBM Cloud Virtual Servers for VPC Sandbox repository. The basic VPC infrastructure
for the sandbox environment is established by the [sandbox-benchmark-for-vpc](https://github.com/IBM-Cloud/sandbox-benchmark-for-vpc) repo. This
project provides a dashboard portal to manage virtual server instances and run benchmarks within
this environment.

The user-guide can be found [here](https://github.com/IBM-Cloud/sandbox-benchmark-for-vpc/blob/main/user-guide/sandbox-user-guide.md)

## Prerequisites

Before setting up and using this project, ensure you have the following prerequisites installed:

1. **Go Language**:
   - Install Go to manage backend services. [Go Installation Guide](https://golang.org/doc/install)

2. **Node.js and npm**:
   - Install Node.js and npm for frontend development. [Node.js Installation Guide](https://nodejs.org/en/download/)

## Backend: Golang

### Overview

The backend of this project is developed in Golang, handling server-side logic, API endpoints, and
interactions with IBM Cloud services. It manages the lifecycle of virtual server instances, runs
benchmarks, and stores results.

### Key Features

- **API Development**: Implements RESTful API endpoints for managing instances and benchmarks.
- **IBM Cloud Integration**: Uses IBM Cloud SDKs and APIs for service interactions.
- **Data Management**: Stores benchmark results and server configurations.
- **Concurrency**: Utilizes Go's concurrency for efficient request handling.

### Code Structure

- **main.go**: Entry point of the application.
- **internal/**: Contains HTTP handlers, API endpoints, authentication, data models, and database
  connections.
- **scripts/**: Includes application-specific benchmark scripts.
- **sshkeys/**: Stores generated SSH keys for server connections.
- **montecarlo/**, **huggingface/**, **byo/**, **presto/**: Holds log files for benchmark results
  of respective applications.

## Frontend: ReactJS

### Overview

The frontend is built using ReactJS, providing an intuitive interface for managing instances,
running benchmarks, and viewing results.

### Key Features

- **User Interface**: Responsive UI for seamless interaction with backend services.
- **API Integration**: Communicates with backend APIs for various operations.
- **Component-Based**: Modular components for scalability and maintenance.

### Code Structure

- **src/**: Contains React application source code.
- **components/**: Reusable UI components.
- **pages/**: Different views of the application.
- **services/**: API service functions.
- **context/**: Context API for state management.
- **public/**: Static assets and HTML template.

### Support

Though the materials provided herein are not supported by the IBM Service organization, your comments are welcomed by the developers, who reserve the right to revise or remove the materials at any time. For reporting a problem, providing suggestions, or comments regarding the IBM Cloud Virtual Servers for VPC Sandbox, users can open a [GitHub issue](https://github.com/IBM-Cloud/sandbox-benchmark-for-vpc/issues). All issues will be addressed as best effort by developers.

Please note that there are no warranties of any kind, and there is no service or technical support available for these materials from IBM. As a recommended practice, carefully review any materials before using them.
