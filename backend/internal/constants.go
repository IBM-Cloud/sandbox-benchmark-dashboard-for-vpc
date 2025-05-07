package sandbox

import (
	"sync"
	"time"
)

const (
	MonteCarloInstaller = "/scripts/mc_installer.sh"
	MonteCarloResults   = "/montecarlo/"
	MonteCarloCategory  = "Financial Services Workload"
	MonteCarlo          = "Monte Carlo simulation"

	HuggingfaceResults   = "/huggingface/"
	HuggingFaceInstaller = "/scripts/huggingface_installer.sh"
	HuggingFaceCategory  = "CPU Inference Workload"
	HuggingFace          = "HuggingFace inference application"

	BYOResults    = "/byo/"
	BYOPolling    = "/scripts/byo_polling.sh"
	BYO           = "BYO application"
	BYOScriptFile = "byo_user_script.sh"

	PrestoInstaller = "/scripts/presto_installer.sh"
	PrestoResults   = "/presto/"
	PrestoCategory  = "Database Application"
	Presto          = "Presto TPC-H Benchmark"

	ApplicationImage = "ibm-ubuntu-22-04-4-minimal-amd64-3"

	SSHUsername = "ubuntu"
	Port        = "22"
	Network     = "tcp"

	SecretKey          = "IBMSandbox"
	MaxConnections     = 1000
	MaxIdleConnections = 100

	ThresholdCPUUtil       = 20.0
	ThresholdMemoryUtil    = 20.0
	ThresholdNetworkRxUtil = 20.0
	ThresholdNetworkTxUtil = 20.0
	ThresholdNetworkIoUtil = 20.0

	CreateInstanceMontecarlo  = "create_instance_montecarlo"
	CreateInstanceHuggingface = "create_instance_huggingface"
	CreateInstanceByo         = "create_instance_byo"
	CreateInstancesPresto     = "create_instance_presto"
	DeleteInstanceMontecarlo  = "delete_instance_montecarlo"
	DeleteInstanceHuggingface = "delete_instance_huggingface"
	DeleteInstanceByo         = "delete_instance_byo"
	DeleteInstancesPresto     = "delete_instance_presto"
	RunBenchmarkMontecarlo    = "run_benchmark_montecarlo"
	RunBenchmarkHuggingface   = "run_benchmark_huggingface"
	RunBenchmarkByo           = "run_benchmark_byo"
	RunByoPolling             = "run_byo_polling"
	RunBenchmarkPresto        = "run_benchmark_presto"
)

var (
	// Define the connection parameters
	DbUsername = "DB_USERNAME"
	DbPassword = "DB_PASSWORD"
	DbHost     = "DB_HOST"
	DbPort     = "DB_PORT"
	DbName     = "ibm_sandbox"

	APIPrefix  = "/sandbox"
	APIVersion = "/v1"
	APIPort    = "API_PORT" // Port to host backend

	IAMTrustedProfileIDEnv = "IAM_TRUSTED_PROFILEID"
	IbmSshKeyID            = "IBM_SSHKEY_ID"
	NetworkInterfaceName   = "eth0"

	InstanceIdentityTokenURL = "http://169.254.169.254/instance_identity/v1/token?version=2024-03-01"
	InstanceMetadataURL      = "http://169.254.169.254/metadata/v1/instance?version=2024-03-01"

	InstProfile8CPU  = []string{"bx2d-8x32", "bx3d-8x40"}
	InstProfile16CPU = []string{"bx2d-16x64", "bx3d-16x80"}

	FolderName = "ssh_keys/"
	BitSize    = 4096

	Charset = "abcdefghijklmnopqrstuvwxyz0123456789"
	Length  = 5

	mySigningKey = []byte(SecretKey)

	Timeout = 115 * time.Second

	FlagMutex sync.Mutex
)
