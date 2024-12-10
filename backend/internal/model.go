package sandbox

import (
	"regexp"

	"github.com/go-playground/validator/v10"
	"github.com/golang-jwt/jwt/v4"
)

// InstanceRequest represents a request for creating a sandbox instance.
type InstanceRequest struct {
	ApplicationName     string `json:"applicationName" validate:"required"`
	InstanceProfileName string `json:"instanceProfileName" validate:"required"`
	VpcID               string `json:"vpcID" validate:"required"`
	SubnetID            string `json:"subnetID" validate:"required"`
	Zone                string `json:"zone" validate:"required"`
	Resourcegroup       string `json:"resourcegroup" validate:"required"`
	UserData            string `json:"userData" validate:"required"`
}

// Validate validates the InstanceRequest struct.
func (ir *InstanceRequest) Validate() error {
	validate := validator.New()
	return validate.Struct(ir)
}

// Instance represents information about a sandbox instance.
type Instance struct {
	ID         string `json:"id"`
	VSIName    string `json:"vsiName"`
	VSIProfile string `json:"vsiProfile"`
	IPAddress  string `json:"ipAddress"`
	VSIStatus  string `json:"vsiStatus"`
	CreateTime string `json:"createTime"`
	DeleteBit  string `json:"deleteBit"`
	AppName    string `json:"appName"`
}

// ListMonteCarlo used for Listing Monte Carlo Benchmark.
type ListBenchmark struct {
	ID                 int    `json:"id"`
	VSIName            string `json:"vsiName"`
	VSIProfile         string `json:"vsiProfile"`
	PerformanceMetric1 string `json:"performanceMetric1"`
	CPUUtilization     string `json:"cpuUtilization"`
	MemoryUtilization  string `json:"memoryUtilization"`
	Time               string `json:"time"`
}

// ListHuggingFace used for Listing HuggingFace Benchmark.
type ListHuggingFace struct {
	ID                int     `json:"id"`
	VSIName           string  `json:"vsiName"`
	VSIProfile        string  `json:"vsiProfile"`
	Bert              Bert    `json:"bertModelType"`
	Roberta           Roberta `json:"robertaModelType"`
	CPUUtilization    string  `json:"cpuUtilization"`
	MemoryUtilization string  `json:"memoryUtilization"`
	Time              string  `json:"time"`
}

type Bert struct {
	BertShortSentence      string `json:"shortSentence"`
	BertShortSentenceArray string `json:"shortSentenceArray"`
}

type Roberta struct {
	RobertaShortSentence      string `json:"shortSentence"`
	RobertaShortSentenceArray string `json:"shortSentenceArray"`
}

// ListBYO used for Listing BYO Benchmark.
type ListBYO struct {
	ID                          int    `json:"id"`
	VSIName                     string `json:"vsiName"`
	VSIProfile                  string `json:"vsiuProfile"`
	MaxCPUUtilization           string `json:"maxCpuUtilization"`
	CurrentCPUUtilization       string `json:"currentCpuUtilization"`
	AverageCPUUtilization       string `json:"averageCpuUtilization"`
	MaxMemoryUtilization        string `json:"maxMemoryUtilization"`
	CurrentMemoryUtilization    string `json:"currentMemoryUtilization"`
	AverageMemoryUtilization    string `json:"averageMemoryUtilization"`
	MaxNetworkRxUtilization     string `json:"maxNetworkRxUtilization"`
	CurrentNetworkRxUtilization string `json:"currentNetworkRxUtilization"`
	AverageNetworkRxUtilization string `json:"averageNetworkRxUtilization"`
	MaxNetworkTxUtilization     string `json:"maxNetworkTxUtilization"`
	CurrentNetworkTxUtilization string `json:"currentNetworkTxUtilization"`
	AverageNetworkTxUtilization string `json:"averageNetworkTxUtilization"`
	MaxIOUtilization            string `json:"maxIoUtilization"`
	CurrentIOUtilization        string `json:"currentIoUtilization"`
	AverageIOUtilization        string `json:"averageIoUtilization"`
	Time                        string `json:"time"`
}

type Logs struct {
	Count  int    `json:"count" validate:"required"`
	Page   int    `json:"page" validate:"required"`
	Search string `json:"search"  validate:"omitempty"`
}

func (ld *Logs) Validate() error {
	validate := validator.New()
	return validate.Struct(ld)
}

// ListLogs used for Listing Benchmark.
type ListLogs struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	BenchMark   string `json:"benchMark"`
	VSIName     string `json:"vsiName"`
	Category    string `json:"category"`
	Status      string `json:"status"`
	Date        string `json:"date"`
	Attachments string `json:"attachments"`
}

// SSHServer used for SSH Connection.
type SSHServer struct {
	Address   []string `json:"address" validate:"required,min=2,dive"`
	Username  string   `json:"sshUsername" validate:"required"`
	Port      string   `json:"port" validate:"required"`
	BYOScript string   `json:"byoScript" validate:"required"`
}

func (ld *SSHServer) Validate() error {
	validate := validator.New()
	return validate.Struct(ld)
}

type PrestoQuery struct {
	PrestoQuery string `json:"prestoQuery" validate:"required,prestoquery"`
}

// Custom validator function
func validatePrestoQuery(fl validator.FieldLevel) bool {
	query := fl.Field().String()
	match, _ := regexp.MatchString(`^(q0[1-9]|q1[0-9]|q2[0-2]|ALL)$`, query)
	return match
}

func (ld *PrestoQuery) Validate() error {
	validate := validator.New()
	// Register the custom validation function
	validate.RegisterValidation("prestoquery", validatePrestoQuery)
	return validate.Struct(ld)
}

type TokenResponse struct {
	AccessToken string `json:"access_token"`
}

type LoginDetails struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

func (ld *LoginDetails) Validate() error {
	validate := validator.New()
	return validate.Struct(ld)
}

type Claims struct {
	Username string `json:"username"`
	jwt.StandardClaims
}

// Reset used for Reset Benchmark.
type Reset struct {
	BenchmarkName string   `json:"benchmarkName" validate:"required"`
	InstanceIds   []string `json:"instanceIds" validate:"required"`
}

func (ld *Reset) Validate() error {
	validate := validator.New()
	return validate.Struct(ld)
}
