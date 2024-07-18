package sandbox

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"database/sql"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"log"
	random "math/rand"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/IBM/go-sdk-core/v5/core"
	"github.com/IBM/vpc-go-sdk/vpcv1"
	scp "github.com/bramvdbogaerde/go-scp"
	"github.com/golang-jwt/jwt"
	"golang.org/x/crypto/ssh"
)

var (
	seededRand *random.Rand = random.New(random.NewSource(time.Now().UnixNano()))
	client                  = &http.Client{}
)

func GenerateRandomString() string {

	b := make([]byte, int(Length))
	for i := range b {
		b[i] = Charset[seededRand.Intn(len(Charset))]
	}
	randValue := string(b)
	return randValue
}

func GetInstanceIdentityToken() (string, error) {
	req, err := http.NewRequest("PUT", InstanceIdentityTokenURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("Metadata-Flavor", "ibm")
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("error fetching instance identity token. Status code: %d", resp.StatusCode)
	}

	var tokenResponse TokenResponse
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	err = json.Unmarshal(body, &tokenResponse)
	if err != nil {
		return "", err
	}

	return tokenResponse.AccessToken, nil
}

func GetInstanceMetadata(instanceIdentityToken string) (string, error) {

	req, err := http.NewRequest("GET", InstanceMetadataURL, nil)
	if err != nil {
		return "", fmt.Errorf("error creating HTTP request: %s", err)
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("Authorization", "Bearer "+instanceIdentityToken)

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("error making HTTP request: %s", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("error fetching instance metadata. Status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("error reading response body: %s", err)
	}
	return string(body), nil
}

func CreateKey(Resourcegroup string, sshkeySuffix string, vpcService *vpcv1.VpcV1) (string, *string, error) {
	keyName := "sandbox-sshkey-" + sshkeySuffix
	publicKey := GenerateKeyPair(keyName)

	// Set the Resource Group ID
	resourceGroupID := Resourcegroup

	createKeyOptions := vpcService.NewCreateKeyOptions(publicKey)
	name := keyName
	createKeyOptions.SetName(name)
	createKeyOptions.SetPublicKey(publicKey)

	// Set the Resource Group for the Key
	createKeyOptions.SetResourceGroup(&vpcv1.ResourceGroupIdentityByID{ID: &resourceGroupID})

	key, _, err := vpcService.CreateKey(createKeyOptions)
	if err != nil {
		log.Println(err)
		return keyName, nil, fmt.Errorf("unable to create key: %s", err)
	}

	return keyName, key.ID, nil
}

func DeleteKey(KeyID string, vpcService *vpcv1.VpcV1) {

	keyID := KeyID

	// Set options for deleting the key
	deleteKeyOptions := vpcService.NewDeleteKeyOptions(keyID)

	// Delete the key
	_, err := vpcService.DeleteKey(deleteKeyOptions)
	if err != nil {
		log.Println(err)
		return
	}
}

func GenerateKeyPair(fileName string) string {
	projectDir, err := GetProjectDir()
	if err != nil {
		log.Println(err)
		return ""
	}
	keyDir := filepath.Join(projectDir, FolderName)
	err = os.MkdirAll(keyDir, os.ModePerm)
	if err != nil {
		log.Println(err)
		return ""
	}

	privateKey, err := GeneratePrivateKey(BitSize)
	if err != nil {
		log.Println(err.Error())
		return ""
	}

	publicKeyBytes, err := GeneratePublicKey(&privateKey.PublicKey)
	if err != nil {
		log.Println(err.Error())
		return ""
	}

	privateKeyBytes := EncodePrivateKeyToPEM(privateKey)

	path := filepath.Join(projectDir, FolderName)

	err = WriteKeyToFile(privateKeyBytes, path+"/"+fileName)
	if err != nil {
		log.Println(err.Error())
		return ""
	}
	return string(publicKeyBytes)
}

func GeneratePrivateKey(bitSize int) (*rsa.PrivateKey, error) {
	// Private Key generation
	privateKey, err := rsa.GenerateKey(rand.Reader, bitSize)
	if err != nil {
		return nil, err
	}
	// Validate Private Key
	err = privateKey.Validate()
	if err != nil {
		return nil, err
	}

	log.Println("Private Key generated")
	return privateKey, nil
}

func EncodePrivateKeyToPEM(privateKey *rsa.PrivateKey) []byte {
	// Get ASN.1 DER format
	privDER := x509.MarshalPKCS1PrivateKey(privateKey)

	// pem.Block
	privBlock := pem.Block{
		Type:    "RSA PRIVATE KEY",
		Headers: nil,
		Bytes:   privDER,
	}

	// Private key in PEM format
	privatePEM := pem.EncodeToMemory(&privBlock)

	return privatePEM
}

func GeneratePublicKey(privatekey *rsa.PublicKey) ([]byte, error) {
	publicRsaKey, err := ssh.NewPublicKey(privatekey)
	if err != nil {
		return nil, err
	}

	pubKeyBytes := ssh.MarshalAuthorizedKey(publicRsaKey)

	return pubKeyBytes, nil
}

func WriteKeyToFile(keyBytes []byte, saveFileTo string) error {
	err := os.WriteFile(saveFileTo, keyBytes, 0600)
	if err != nil {
		return err
	}

	return nil
}

func DeleteKeyFile(keyFilename string) {

	dir, err := GetProjectDir()
	if err != nil {
		log.Println(err)
		return
	}
	path := filepath.Join(dir, FolderName)
	err = os.Remove(path + "/" + keyFilename)
	if err != nil {
		log.Println(err)
		return
	}
}

func GetEnvVariable(key string) (string, error) {
	value, exists := os.LookupEnv(key)
	if !exists {
		return "", fmt.Errorf("environment variable %s not set", key)
	}
	return value, nil
}

func GetApplicationImageID(vpcService *vpcv1.VpcV1) (string, error) {
	listImagesOptions := &vpcv1.ListImagesOptions{}
	listImagesOptions.SetVisibility("public")
	listImagesOptions.SetName(ApplicationImage)

	pager, err := vpcService.NewImagesPager(listImagesOptions)
	if err != nil {
		log.Printf("error failed to list images: %s", err)
		return "", err
	}

	if pager.HasNext() {
		nextPage, err := pager.GetNext()
		if err != nil {
			log.Printf("error failed to get the image: %s", err)
			return "", err
		}
		return *nextPage[0].ID, nil
	}

	return "No images found", nil
}

func GetRegion() (string, error) {

	accessToken, err := GetInstanceIdentityToken()
	if err != nil {
		return "", fmt.Errorf("error getting instance identity token:%s", err)
	}

	instanceMetadata, err := GetInstanceMetadata(accessToken)
	if err != nil {
		return "", fmt.Errorf("error getting instance metadata:%s", err)
	}

	var metadataMap map[string]interface{}

	err = json.Unmarshal([]byte(instanceMetadata), &metadataMap)
	if err != nil {
		return "", fmt.Errorf("error unmarshaling instance metadata:%s", err)
	}

	region, ok := metadataMap["zone"].(map[string]interface{})["name"].(string)
	if !ok {
		return "", fmt.Errorf("failed to extract 'region'")
	}
	var regionName string
	parts := strings.Split(region, "-")
	if len(parts) >= 2 {
		regionName = parts[0] + "-" + parts[1]
	} else {
		regionName = region
	}

	return regionName, nil
}

func GetVPCEndpoint() (string, error) {

	region, err := GetRegion()
	if err != nil {
		return "", fmt.Errorf("error getting region:%s", err)
	}

	URL := "https://" + region + ".iaas.cloud.ibm.com/v1"
	return URL, nil
}

func GetProjectDir() (string, error) {
	// Get the current working directory
	currentDir, err := os.Getwd()
	if err != nil {
		return "", err
	}

	// Traverse up the directory tree until finding the project root
	for {
		if HasProjectMarker(currentDir) {
			return currentDir, nil
		}

		// Move up one directory
		parentDir := filepath.Dir(currentDir)

		// Break if parentDir is same as currentDir. It indicates we are at root.
		if parentDir == currentDir {
			break
		}
		currentDir = parentDir
	}
	return "", fmt.Errorf("project root directory not found")
}

// hasProjectMarker checks for a file or directory that indicates the project root
func HasProjectMarker(dir string) bool {
	_, err := os.Stat(filepath.Join(dir, "go.mod"))
	return err == nil
}

//------------------functions for authorization and login-------------------------

func IsAuthorized(endpoint func(http.ResponseWriter, *http.Request)) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header["Authorization"] != nil {
			token, err := jwt.Parse(r.Header["Authorization"][0], func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("failed to get token for authorization")
				}
				return mySigningKey, nil
			})
			if err != nil {
				SendErrorResponse(w, http.StatusBadRequest, "This session has expired. Refresh the session by logging in.", fmt.Sprint(err))
				return
			}

			if token.Valid {
				claims, ok := token.Claims.(jwt.MapClaims)
				if !ok {
					SendErrorResponse(w, http.StatusBadRequest, "Failed to valid the Claims", fmt.Sprint(err))
					return
				}

				newExpiration := time.Now().Add(time.Minute * 90)
				claims["exp"] = newExpiration.Unix()
				// Check if token has expired

				expirationTime := claims["exp"].(int64)

				currentTime := time.Now().Unix()
				if expirationTime < currentTime {
					SendErrorResponse(w, http.StatusBadRequest, "This session has expired. Refresh the session by logging in.", fmt.Sprint(err))
					return
				}

				endpoint(w, r)
			}
			return
		}
		SendErrorResponse(w, http.StatusBadRequest, "Not Authorized, Invalid Token", "Invalid Token, not Authorized")
	})
}

// ------------------database queries wrapped in functions----------------------------
func SetFlag(db *sql.DB, apiName string) {
	_, err := db.Exec("UPDATE flags SET flag = '1' WHERE api_name=$1", apiName)
	if err != nil {
		log.Printf("error setting flag in the database:%s", err)
		return
	}
}

func ResetFlag(db *sql.DB, apiName string) {
	_, err := db.Exec("UPDATE flags SET flag = '0' WHERE api_name=$1", apiName)
	if err != nil {
		log.Printf("error resetting flag in the database:%s", err)
		return
	}
}

func CheckInstancesExists(db *sql.DB, appType string) (int, error) {
	var count int
	countParameter := "sbox-" + appType + "-vm%"
	err := db.QueryRow("SELECT count(*) FROM vsi_info WHERE delete_bit='0' AND vsi_name LIKE $1", countParameter).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("unable to scan count: %s", err)
	}
	return count, nil
}

func GetFlagStatus(db *sql.DB, apiName string) (bool, error) {
	var flag bool
	err := db.QueryRow("SELECT flag FROM flags WHERE api_name=$1", apiName).Scan(&flag)
	if err != nil {
		return false, fmt.Errorf("unable to scan flag: %s", err)
	}
	return flag, nil
}

func GetVSIInfoFromDB(db *sql.DB, id string) (string, string, error) {
	var vsiname, appName string
	err := db.QueryRow("SELECT vsi_name, app_name FROM vsi_info WHERE id=$1", id).Scan(&vsiname, &appName)
	return vsiname, appName, err
}

func GetKeypairNameForIP(db *sql.DB, ipAddress string) (string, error) {
	var keyPairName string
	err := db.QueryRow("SELECT keypair_name FROM vsi_info WHERE delete_bit = '0' AND ip_address= $1", ipAddress).Scan(&keyPairName)
	if err != nil {
		return "", fmt.Errorf("unable to scan keypair name for IP %s: %s", ipAddress, err)
	}
	return keyPairName, nil
}

func GetActiveInstanceIDs(db *sql.DB) ([]string, error) {
	var ids []string
	rows, err := db.Query("SELECT id FROM vsi_info WHERE delete_bit = '0'")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var id string
		err := rows.Scan(&id)
		if err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

func UpdateBenchmarkStatusFailed(db *sql.DB, vsiName string) {
	query := "UPDATE benchmark_status SET run_status = 'Failed' WHERE vsi_name = $1"
	_, err := db.Exec(query, vsiName)
	if err != nil {
		log.Printf("error updating benchmark_status in the database: %s", err)
		return
	}
}

func ParseUtilizationValues(utilizationValue string) (float64, error) {
	if utilizationValue == "" {
		return 0.00, nil
	}
	utilization, err := strconv.ParseFloat(utilizationValue, 64)
	if err != nil {
		log.Printf("Unable to parse the utilization: %s", err)
		return 0.00, fmt.Errorf("unable to parse the utilization: %s", err)
	}
	return utilization, nil
}

func CalculateAverageUtilization(sumUtilization, maxUtilization, currentUtilization float64, count int) float64 {
	if sumUtilization == 0.0 {
		return (maxUtilization + currentUtilization) / 2
	}
	return sumUtilization / float64(count)
}

func GetInstanceDetails(db *sql.DB, vsiName string) ([]Instance, []string, error) {
	// Execute the SQL query to retrieve instances with delete_bit = 0
	query := `SELECT id, vsi_name, vsi_profile, ip_address, vsi_status, createtime, delete_bit,app_name 
	FROM vsi_info WHERE delete_bit = '0' AND vsi_name LIKE $1 ORDER BY createtime ASC`
	rows, err := db.Query(query, vsiName)
	if err != nil {
		return nil, nil, fmt.Errorf("error querying database: %s", err)
	}
	defer rows.Close()

	// Create a slice to hold instances
	var instances []Instance // Assuming you have a struct named Instance to represent your data
	var instance Instance
	var ipAddresses []string
	for rows.Next() {
		err := rows.Scan(&instance.ID, &instance.VSIName, &instance.VSIProfile, &instance.IPAddress, &instance.VSIStatus, &instance.CreateTime, &instance.DeleteBit, &instance.AppName)
		if err != nil {
			return nil, nil, fmt.Errorf("error scanning row: %s", err)
		}
		ipAddresses = append(ipAddresses, instance.IPAddress)
		instances = append(instances, instance)
	}
	return instances, ipAddresses, nil
}

func InsertMonteCarloBenchmarkData(db *sql.DB, outputStr string, vsiProfile string, timeStamp string, fileName string, id string, vsiName string) error {
	var vsi, cpuUsage, memoryUsage, optSec string
	lines := strings.Split(outputStr, "\n")
	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) >= 3 {
			switch fields[0] {
			case "VSI":
				vsi = fields[2]
			case "Memory":
				memoryUsage = fields[2]

			case "CPU":
				cpuUsage = fields[2]

			case "Operations":
				optSec = fields[2]
			}
		}

	}

	// Insert data into PostgreSQL database
	insertQuery := `INSERT INTO montecarlo(vsi_name, vsi_profile,performance_metric_1, cpu_utilization, memory_utilization, createtime, attachments,instance_id, delete_bit)
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0)`

	_, err := db.Exec(insertQuery, vsi, vsiProfile, optSec, cpuUsage, memoryUsage, timeStamp, fileName, id)
	if err != nil {
		query := "UPDATE benchmark_status SET run_status = 'Failed' WHERE vsi_name = $1"
		_, err = db.Exec(query, vsiName)
		if err != nil {
			return fmt.Errorf("error updating benchmark_status in the database: %s", err)
		}
		return fmt.Errorf("failed to insert data into database: %s", err)
	}
	return nil
}

func InsertHuggingFaceBenchmarkData(db *sql.DB, outputStr string, vsiProfile string, timeStamp string, fileName string, id string, vsiName string) error {
	var vsi, cpuUsage, memoryUsage, bertSS, bertSSA, robertSS, robertSSA string
	lines := strings.Split(outputStr, "\n")

	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) >= 2 {
			switch fields[0] {
			case "bert-base-uncased_short_sentence":
				bertSS = fields[1]
			case "bert-base-uncased_short_sentence_array":
				bertSSA = fields[1]
			case "roberta-base_short_sentence":
				robertSS = fields[1]
			case "roberta-base_short_sentence_array":
				robertSSA = fields[1]
			case "VSI":
				vsi = fields[2]
			case "Memory":
				memoryUsage = fields[2]

			case "CPU":
				cpuUsage = fields[2]

			}
		}
	}

	// Insert data into PostgreSQL database
	insertQuery := `INSERT INTO huggingface(vsi_name, vsi_profile, bert_short_sentence, bert_short_sentence_array, roberta_short_sentence,
                        roberta_short_sentence_array, cpu_utilization, memory_utilization, createtime, attachments,instance_id, delete_bit)
                        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,0)`

	_, err := db.Exec(insertQuery, vsi, vsiProfile, bertSS, bertSSA, robertSS, robertSSA, cpuUsage, memoryUsage, timeStamp, fileName, id)
	if err != nil {
		query := "UPDATE benchmark_status SET run_status = 'Failed' WHERE vsi_name = $1"
		_, err = db.Exec(query, vsiName)
		if err != nil {
			return fmt.Errorf("error updating benchmark_status in the database: %s", err)
		}
		return fmt.Errorf("failed to insert data into database: %s", err)
	}
	return nil
}

func InsertBYOBenchmarkData(db *sql.DB, outputStr string, addr string) error {
	var cpuUsage, memoryUsage, networkUtilizationRx, networkUtilizationTx, ioUtilization string
	lines := strings.Split(outputStr, "\n")

	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) >= 3 {
			switch fields[0] {
			case "Memory":
				memoryUsage = fields[2]

			case "CPU":
				cpuUsage = fields[2]

			case "IO":
				ioUtilization = fields[2]

			case "Network_Rx":
				networkUtilizationRx = fields[2]

			case "Network_Tx":
				networkUtilizationTx = fields[2]

			}
		}
	}
	var cpu, memory, networkRx, networkTx, io float64
	var err error

	cpu, err = ParseUtilizationValues(cpuUsage)
	if err != nil {
		return err
	}

	memory, err = ParseUtilizationValues(memoryUsage)
	if err != nil {
		return err
	}

	networkRx, err = ParseUtilizationValues(networkUtilizationRx)
	if err != nil {
		return err
	}

	networkTx, err = ParseUtilizationValues(networkUtilizationTx)
	if err != nil {
		return err
	}

	io, err = ParseUtilizationValues(ioUtilization)
	if err != nil {
		return err
	}

	var vsiName string
	var prevSumCPU, prevSumMemory, prevSumNetworkRx, prevSumNetworkTx, prevSumIo, sumCPU, sumMemory, sumNetworkRx, sumNetworkTx, sumIo float64
	var prevCountCPU, countCPU, prevCountMemory, countMemory, prevCountNetworkRx, countNetworkRx, prevCountNetworkTx, countNetworkTx, prevCountIo, countIo int

	vsiNameQuery := "SELECT vsi_name FROM vsi_info WHERE delete_bit = '0' AND app_name=$1 AND ip_address=$2"
	err = db.QueryRow(vsiNameQuery, BYO, addr).Scan(&vsiName)
	if err != nil {
		log.Printf("Unable to scan vsi name: %s", err)
		return fmt.Errorf("unable to scan vsi name: %s", err)
	}

	utilizationQuery := `SELECT COALESCE(count_cpu,0),COALESCE(count_memory,0),COALESCE(count_network_rx,0),COALESCE(count_network_tx,0),COALESCE(count_io,0),
	COALESCE(sum_cpu_utilization,0.0),COALESCE(sum_memory_utilization,0.0),COALESCE(sum_network_rx_utilization,0.0),COALESCE(sum_network_tx_utilization,0.0),COALESCE(sum_io_utilization,0.0)
	FROM byo WHERE vsi_name=$1`
	err = db.QueryRow(utilizationQuery, vsiName).Scan(&prevCountCPU, &prevCountMemory, &prevCountNetworkRx, &prevCountNetworkTx, &prevCountIo, &prevSumCPU, &prevSumMemory, &prevSumNetworkRx, &prevSumNetworkTx, &prevSumIo)
	if err != nil {
		log.Printf("error fetching the utilization details from database: %s", err)
		return fmt.Errorf("error fetching the utilization details from database: %s", err)
	}

	if cpu >= ThresholdCPUUtil {
		sumCPU = prevSumCPU + cpu
		countCPU = prevCountCPU + 1
	} else {
		sumCPU = prevSumCPU
		countCPU = prevCountCPU
	}

	if memory >= ThresholdMemoryUtil {
		sumMemory = prevSumMemory + memory
		countMemory = prevCountMemory + 1
	} else {
		sumMemory = prevSumMemory
		countMemory = prevCountMemory
	}

	if networkRx >= ThresholdNetworkRxUtil {
		sumNetworkRx = prevSumNetworkRx + networkRx
		countNetworkRx = prevCountNetworkRx + 1
	} else {
		sumNetworkRx = prevSumNetworkRx
		countNetworkRx = prevCountNetworkRx
	}

	if networkTx >= ThresholdNetworkTxUtil {
		sumNetworkTx = prevSumNetworkTx + networkTx
		countNetworkTx = prevCountNetworkTx + 1
	} else {
		sumNetworkTx = prevSumNetworkTx
		countNetworkTx = prevCountNetworkTx
	}

	if io >= ThresholdNetworkIoUtil {
		sumIo = prevSumIo + io
		countIo = prevCountIo + 1
	} else {
		sumIo = prevSumIo
		countIo = prevCountIo
	}

	// Insert data into PostgreSQL database
	_, err = db.Exec(`UPDATE byo
	SET
		current_cpu_utilization = $1::numeric,
		max_cpu_utilization = GREATEST(COALESCE(max_cpu_utilization, 0.0), $1::numeric),
		current_memory_utilization = $2::numeric,
		max_memory_utilization = GREATEST(COALESCE(max_memory_utilization, 0.0), $2::numeric),
		current_network_rx_utilization = $3::numeric,
		max_network_rx_utilization = GREATEST(COALESCE(max_network_rx_utilization, 0.0), $3::numeric),
		current_network_tx_utilization = $4::numeric,
		max_network_tx_utilization = GREATEST(COALESCE(max_network_tx_utilization, 0.0), $4::numeric),
		current_io_utilization = $5::numeric,
		max_io_utilization = GREATEST(COALESCE(max_io_utilization, 0.0), $5::numeric),
		sum_cpu_utilization = $6::numeric,
		count_cpu = $7,
		sum_memory_utilization = $8::numeric,
		count_memory = $9,
		sum_network_rx_utilization = $10::numeric,
		count_network_rx = $11,
		sum_network_tx_utilization = $12::numeric,
		count_network_tx = $13,
		sum_io_utilization = $14::numeric,
		count_io = $15
	WHERE
		vsi_name = $16;`,
		cpu, memory, networkRx, networkTx, io, sumCPU, countCPU, sumMemory, countMemory, sumNetworkRx, countNetworkRx, sumNetworkTx, countNetworkTx, sumIo, countIo, vsiName)
	if err != nil {
		log.Printf("Failed to insert data into database: %s", err)
		return fmt.Errorf("failed to insert data into database: %s", err)
	}
	return nil
}

func InsertPrestoBenchmarkData(db *sql.DB, dir string, keyPairName string, config *ssh.ClientConfig, appType string, outputCommand string, address string, logCommand string) error {

	var id, vsiProfile, vsiName, query string
	timeStamp := time.Now().Format("2006-01-02 15:04:05")

	err = db.QueryRow("SELECT id, vsi_profile,vsi_name FROM vsi_info WHERE delete_bit = '0' and ip_address=$1", address).Scan(&id, &vsiProfile, &vsiName)
	if err != nil {
		return fmt.Errorf("%s", err)
	}
	conn, err := ssh.Dial(Network, address+":"+Port, config)
	if err != nil {
		log.Printf("Error connecting via SSH for IP %s: %s", address, err)
		return fmt.Errorf("error connecting via SSH for IP %s: %s", address, err)
	}
	defer conn.Close()

	sessionLog, err := conn.NewSession()
	if err != nil {
		UpdateBenchmarkStatusFailed(db, vsiName)
		return fmt.Errorf("%s", err)
	}
	defer sessionLog.Close()

	// Capture the output
	logResult, err := sessionLog.Output(logCommand)
	if err != nil {
		UpdateBenchmarkStatusFailed(db, vsiName)
		log.Printf("unable to capture output: %s", err)
		return fmt.Errorf("unable to capture output: %s", err)
	}

	fileName := fmt.Sprintf("%s%s.log", time.Now().Format("20060102150405"), vsiName)
	// Create or open the logs folder
	keyDir := filepath.Join(dir, appType)
	err = os.MkdirAll(keyDir, os.ModePerm)
	if err != nil {
		UpdateBenchmarkStatusFailed(db, vsiName)
		log.Printf("failed to create logs folder: %s", err)
		return fmt.Errorf("failed to create logs folder: %s", err)
	}
	logPath := appType + "/" + fileName
	err = os.WriteFile(logPath, logResult, 0644)
	if err != nil {
		UpdateBenchmarkStatusFailed(db, vsiName)
		log.Printf("failed to save logs file: %s", err)
		return fmt.Errorf("failed to save logs file: %s", err)
	}

	sessionOutput, err := conn.NewSession()
	if err != nil {
		UpdateBenchmarkStatusFailed(db, vsiName)
		return fmt.Errorf("%s", err)
	}
	defer sessionOutput.Close()

	// Capture the output
	output, err := sessionOutput.Output(outputCommand)
	if err != nil {
		UpdateBenchmarkStatusFailed(db, vsiName)
		log.Printf("unable to capture output: %s", err)
		return fmt.Errorf("unable to capture output: %s", err)
	}

	outputStr := string(output)
	var vsi, status, cpuUsage, memoryUsage, queryExecTime string
	lines := strings.Split(outputStr, "\n")

	for _, line := range lines {
		fields := strings.Fields(line)
		if len(fields) >= 2 {
			switch fields[0] {
			case "VSI":
				vsi = fields[2]
			case "Status:":
				status = fields[1]
			case "Memory":
				memoryUsage = fields[2]
			case "CPU":
				cpuUsage = fields[2]
			case "Query":
				if len(fields) >= 4 {
					queryExecTime = fields[3] + "ms"
				}
			}
		}
	}

	// Insert data into PostgreSQL database
	insertQuery := `INSERT INTO presto(vsi_name, vsi_profile,query_execution_time, cpu_utilization, memory_utilization, createtime, attachments,instance_id, delete_bit)
            	VALUES ($1, $2, $3, $4, $5, $6, $7,$8,0)`

	_, err = db.Exec(insertQuery, vsi, vsiProfile, queryExecTime, cpuUsage, memoryUsage, timeStamp, fileName, id)
	if err != nil {
		query := "UPDATE benchmark_status SET run_status = 'Failed' WHERE vsi_name = $1"
		_, err = db.Exec(query, vsiName)
		if err != nil {
			log.Printf("error updating benchmark_status in the database: %s", err)
			return fmt.Errorf("error updating benchmark_status in the database: %s", err)
		}
		log.Printf("failed to insert data into database: %s", err)
		return fmt.Errorf("failed to insert data into database: %s", err)
	}
	switch status {
	case "PASSED":
		query = "UPDATE benchmark_status SET run_status = 'Completed',attachments=$2 WHERE vsi_name = $1"
		_, err = db.Exec(query, vsiName, fileName)
		if err != nil {
			log.Printf("error updating benchmark_status in the database: %s", err)
			return fmt.Errorf("error updating benchmark_status in the database: %s", err)
		}
	case "FAILED":
		UpdateBenchmarkStatusFailed(db, vsiName)
	default:
		UpdateBenchmarkStatusFailed(db, vsiName)
	}

	return nil
}

//--------------------functions used for instance and benchmark------------------------------

func GetSSHKeyID(vpcService *vpcv1.VpcV1, keyName string) (string, error) {
	// List all SSH keys
	listKeysOptions := vpcService.NewListKeysOptions()
	keys, _, err := vpcService.ListKeys(listKeysOptions)
	if err != nil {
		log.Printf("error listing keys: %s", err)
		return "", fmt.Errorf("error listing keys: %s", err)
	}

	// Iterate through the keys to find the one with the given name
	for _, key := range keys.Keys {
		if *key.Name == keyName {
			return *key.ID, nil
		}
	}
	log.Printf("SSH key with name %s not found", keyName)
	return "", fmt.Errorf("SSH key with name %s not found", keyName)
}

func CreateInstance(db *sql.DB, vpcService *vpcv1.VpcV1, appType string, apiName string, instProfilename8CPU []string, instProfilename16CPU []string, installerPath string, application string, req InstanceRequest) (string, error) {
	log.Printf("Creating Instance for %s", application)
	var appName, instanceProfileName []string
	sshkeySuffix := GenerateRandomString()

	if req.ApplicationName == appType {
		appName = []string{("sbox-" + appType + "-vm1-" + sshkeySuffix), ("sbox-" + appType + "-vm2-" + sshkeySuffix)}

		if req.InstanceProfileName == "8vCPUs" {
			instanceProfileName = instProfilename8CPU
		} else if req.InstanceProfileName == "16vCPUs" {
			instanceProfileName = instProfilename16CPU
		} else {
			ResetFlag(db, apiName)
			return "", fmt.Errorf("Instance Profile Name not selected")
		}
	} else {
		ResetFlag(db, apiName)
		return "", fmt.Errorf("application not selected")
	}

	keyName, keyID, err := CreateKey(req.Resourcegroup, sshkeySuffix, vpcService)
	if keyID == nil || err != nil {
		ResetFlag(db, apiName)
		return "", fmt.Errorf("error creating key for  %s", keyName)
	}
	var fetchedInstance *vpcv1.Instance
	for i := 0; i < len(appName); i++ {
		var userData string
		if appType == "montecarlo" || appType == "huggingface" || appType == "presto" {
			// Get the directory of the currently running file
			dir, err := GetProjectDir()
			if err != nil {
				DeleteKeyFile(keyName)
				DeleteKey(*keyID, vpcService)
				ResetFlag(db, apiName)
				return "", fmt.Errorf("unable to find the pwd path: %s", err)
			}

			// Construct the full path to the file
			fullPath := filepath.Join(dir, installerPath)

			// Read the file
			userDataBytes, err := os.ReadFile(fullPath)
			if err != nil {
				DeleteKeyFile(keyName)
				DeleteKey(*keyID, vpcService)
				ResetFlag(db, apiName)
				return "", fmt.Errorf("read file failed: %s", err)
			}

			userData = string(userDataBytes)
		} else if appType == "byo" {
			userData = req.UserData
		}
		// Construct identity models based on request parameters
		vpcID := req.VpcID
		imageID, err := GetApplicationImageID(vpcService)
		if imageID == "" || err != nil {
			DeleteKeyFile(keyName)
			DeleteKey(*keyID, vpcService)
			ResetFlag(db, apiName)
			return "", fmt.Errorf("error fetching ImageID: %s", err)
		}
		subnetID := req.SubnetID
		zone := req.Zone
		resourcegroup := req.Resourcegroup

		ibmSshKeyName := os.Getenv(IbmSshKeyName)
		var keys []vpcv1.KeyIdentityIntf

		keyIDentityModel := &vpcv1.KeyIdentityByID{ID: keyID}
		keys = append(keys, keyIDentityModel)
		if ibmSshKeyName != "" {
			ibmSshKeyId, err := GetSSHKeyID(vpcService, ibmSshKeyName)
			if err != nil {
				log.Println("Error fetching key ID:", err)
				DeleteKeyFile(keyName) //deletes the ssh key created for the vsi above
				DeleteKey(*keyID, vpcService)
				ResetFlag(db, apiName)
				return "", fmt.Errorf("error fetching key ID: %s", err)
			}
			IbmKeyIdModel := &vpcv1.KeyIdentityByID{ID: &ibmSshKeyId}
			keys = append(keys, IbmKeyIdModel)
		} else {
			log.Println("environment variable IBM_SSHKEY_NAME not set")
		}

		instanceProfileIdentityModel := &vpcv1.InstanceProfileIdentityByName{Name: &instanceProfileName[i]}
		vpcIDentityModel := &vpcv1.VPCIdentityByID{ID: &vpcID}
		imageIDentityModel := &vpcv1.ImageIdentityByID{ID: &imageID}
		subnetIDentityModel := &vpcv1.SubnetIdentityByID{ID: &subnetID}
		zoneIdentityModel := &vpcv1.ZoneIdentityByName{Name: &zone}
		resourcegroupModel := &vpcv1.ResourceGroupIdentityByID{ID: &resourcegroup}

		// Create instance
		instancePrototypeModel := &vpcv1.InstancePrototypeInstanceByImage{
			Keys:                    keys,
			Name:                    core.StringPtr(appName[i]),
			Profile:                 instanceProfileIdentityModel,
			VPC:                     vpcIDentityModel,
			Image:                   imageIDentityModel,
			PrimaryNetworkInterface: &vpcv1.NetworkInterfacePrototype{Name: &NetworkInterfaceName, Subnet: subnetIDentityModel},
			Zone:                    zoneIdentityModel,
			ResourceGroup:           resourcegroupModel,
			UserData:                &userData,
		}
		createInstanceOptions := vpcService.NewCreateInstanceOptions(instancePrototypeModel)
		instance, _, err := vpcService.CreateInstance(createInstanceOptions)
		if err != nil {
			DeleteKey(*keyID, vpcService)
			DeleteKeyFile(keyName)
			ResetFlag(db, apiName)
			return "", fmt.Errorf("error creating %s instance: %s", appType, err)
		}
		startTime := time.Now()
		// Check instance status periodically until it's running
		for {

			if time.Since(startTime) > Timeout {
				return "", fmt.Errorf("timeout exceeded while waiting for instance state")
			}

			getInstanceOptions := vpcService.NewGetInstanceOptions(*instance.ID)
			fetchedInstance, _, err = vpcService.GetInstance(getInstanceOptions)
			if err != nil {
				DeleteKey(*keyID, vpcService)
				DeleteKeyFile(keyName)
				ResetFlag(db, apiName)
				return "", fmt.Errorf("error fetching instance: %s", err)
			}
			if fetchedInstance != nil && fetchedInstance.Status != nil {
				if *fetchedInstance.Status == "running" {
					break
				} else if *fetchedInstance.Status == "failed" {
					return "", fmt.Errorf("instance creation failed for %s", appName[i])
				}
			}
		}

		// Insert instance information into the database
		query := `INSERT INTO vsi_info (id, vsi_name, vsi_profile, ip_address, vsi_status, createtime, delete_bit,keypair_id,keypair_name,app_name) 
			VALUES ($1, $2, $3, $4, $5, $6, 0,$7,$8,$9)`

		// Execute the SQL query
		_, err = db.Exec(query, *instance.ID, appName[i], instanceProfileName[i], *fetchedInstance.PrimaryNetworkInterface.PrimaryIP.Address, *fetchedInstance.Status, *fetchedInstance.CreatedAt, *keyID, keyName, application)
		if err != nil {
			DeleteKey(*keyID, vpcService)
			DeleteKeyFile(keyName)
			ResetFlag(db, apiName)
			return "", fmt.Errorf("error inserting into database: %s", err)
		}

		if appType == "byo" {
			query = `INSERT INTO byo (vsi_name, vsi_profile, createtime,  instance_id,delete_bit,count_cpu,count_memory,count_network_rx,count_network_tx,count_io) 
				VALUES ($1, $2, $3, $4, 0,1,1,1,1,1)`

			// Execute the SQL query
			_, err = db.Exec(query, appName[i], instanceProfileName[i], *fetchedInstance.CreatedAt, *instance.ID)
			if err != nil {
				DeleteKey(*keyID, vpcService)
				DeleteKeyFile(keyName)
				ResetFlag(db, CreateInstanceByo)
				return "", fmt.Errorf("error inserting into database: %s", err)
			}
		}
	}

	if appType == "byo" {
		SetFlag(db, RunByoPolling)
	}
	return *fetchedInstance.Status, nil
}

func GetInstallationStatus(db *sql.DB, ipAddresses []string, findFileCommand string, apiName string) error {
	for _, ipaddr := range ipAddresses {
		dir, err := GetProjectDir()
		if err != nil {
			return fmt.Errorf("unable to find the pwd path: %s", err)
		}

		keyPairName, err := GetKeypairNameForIP(db, ipaddr)
		if err != nil {
			log.Printf("unable to scan keypair name for IP %s: %s", ipaddr, err)
			return fmt.Errorf("unable to scan keypair name for IP %s: %s", ipaddr, err)
		}
		config, err := GetSSHConfig(db, dir, keyPairName, SSHUsername)
		if err != nil {
			log.Printf("Failed to configure client: %s", err)
			return fmt.Errorf("failed to configure client: %s", err)
		}

		conn, err := ssh.Dial(Network, ipaddr+":"+Port, config)
		if err != nil {
			log.Printf("error connecting via SSH for IP %s: %s", ipaddr, err)
			break
		}
		defer conn.Close()
		//checking for the file installed while creating the instance
		check, err := conn.NewSession()
		if err != nil {
			log.Printf("unable to create session: %s", err)
			break
		}
		defer check.Close()

		findMc, err := check.CombinedOutput(findFileCommand)
		if err != nil {
			log.Printf("Installation in progress, Please wait for server to be ready for %s: %s", ipaddr, string(findMc))
			break
		}
		ResetFlag(db, apiName)
	}
	return nil
}

func DeleteInstanceNotFound(vpcService *vpcv1.VpcV1, instanceID string) error {

	options := &vpcv1.DeleteInstanceOptions{
		ID: &instanceID,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()
	_, err := vpcService.DeleteInstanceWithContext(ctx, options)
	if err != nil {
		return fmt.Errorf("error deleting instance for %s: %s", instanceID, err)
	}
	startTime := time.Now()
	// Wait for the instance to be deleted (wait for 404 response)
	for {
		if time.Since(startTime) > Timeout {
			return fmt.Errorf("timeout exceeded while waiting for instance state")
		}
		// Check if the instance still exists
		getInstanceOptions := &vpcv1.GetInstanceOptions{
			ID: &instanceID,
		}
		_, response, err := vpcService.GetInstanceWithContext(ctx, getInstanceOptions)
		if err != nil {
			if response != nil && response.StatusCode == http.StatusNotFound {
				break // Instance deleted successfully
			}
			return fmt.Errorf("error checking instance status for %s: %s", instanceID, err)
		}
	}
	return nil
}

func DeleteInstance(db *sql.DB, vpcService *vpcv1.VpcV1, instanceIDs []string, apiName string, appType string) error {
	log.Printf("Deleting Instance for %s", apiName)
	for _, instanceID := range instanceIDs {
		err := DeleteInstanceNotFound(vpcService, instanceID)
		if err != nil {
			return fmt.Errorf("error deleting instance for %s: %s", instanceID, err)

		}
		// Execute the SQL query to update the delete_bit flag
		query := "UPDATE vsi_info SET vsi_status='deleted',delete_bit = '1' WHERE id =$1"
		_, err = db.Exec(query, instanceID)
		if err != nil {
			return fmt.Errorf("error updating delete_bit in the database: %s", err)
		}

		if appType == "montecarlo" {
			query = "UPDATE montecarlo SET delete_bit = '1' WHERE instance_id =$1"
		} else if appType == "huggingface" {
			query = "UPDATE huggingface SET delete_bit = '1' WHERE instance_id =$1"
		} else if appType == "byo" {
			query = "UPDATE byo SET delete_bit = '1' WHERE instance_id =$1"
		} else if appType == "presto" {
			query = "UPDATE presto SET delete_bit = '1' WHERE instance_id =$1"
		}
		_, err = db.Exec(query, instanceID)
		if err != nil {
			return fmt.Errorf("error updating delete_bit in the database: %s", err)
		}

		if appType == "montecarlo" || appType == "huggingface" || appType == "presto" {
			var vsiName string
			query = "SELECT vsi_name FROM vsi_info WHERE id = $1"
			err := db.QueryRow(query, instanceID).Scan(&vsiName)
			if err != nil {
				return fmt.Errorf("unable to scan vsi name for instance id %s: %s", instanceID, err)
			}
			query = "UPDATE benchmark_status SET run_status = 'Deleted' WHERE vsi_name= $1"
			_, err = db.Exec(query, vsiName)
			if err != nil {
				return fmt.Errorf("error updating benchmark_status in the database: %s", err)
			}
		}

	}

	var keypairid, keypairname string
	err := db.QueryRow("SELECT keypair_id,keypair_name from vsi_info where id=$1", instanceIDs[0]).Scan(&keypairid, &keypairname)
	if err != nil {
		return fmt.Errorf("unable to scan keypair id and name: %s", err)
	}

	DeleteKeyFile(keypairname)
	DeleteKey(keypairid, vpcService)
	ResetFlag(db, apiName)

	if appType == "byo" {
		ResetFlag(db, RunByoPolling)
	}

	return nil

}

func RunBenchmark(db *sql.DB, req SSHServer, appType string, apiName string, findFileCommand string, application string, category string, benchMarkFileName string, runCommand string, logCommand string, outputCommand string, userScriptCommand string) error {
	log.Printf("Running Benchmark for %s", apiName)
	var wg sync.WaitGroup
	errChan := make(chan error, len(req.Address))
	dir, err := GetProjectDir()
	if err != nil {
		return fmt.Errorf("unable to find the pwd path: %s", err)
	}

	keyPairName, err := GetKeypairNameForIP(db, req.Address[0])
	if err != nil {
		log.Printf("unable to scan keypair name for IP %s: %s", req.Address[0], err)
		return fmt.Errorf("unable to scan keypair name for IP %s: %s", req.Address[0], err)
	}
	config, err := GetSSHConfig(db, dir, keyPairName, req.Username)
	if err != nil {
		log.Printf("Failed to configure client: %s", err)
		return fmt.Errorf("failed to configure client: %s", err)
	}

	conn, err := ssh.Dial(Network, req.Address[0]+":"+req.Port, config)
	if err != nil {
		return fmt.Errorf("error connecting via SSH for IP %s: %s", req.Address[0], err)
	}
	defer conn.Close()

	//checking for the file installed while creating the instance
	check, err := conn.NewSession()
	if err != nil {
		return fmt.Errorf("unable to create sesion: %s", err)
	}
	defer check.Close()

	checkOutput, err := check.CombinedOutput(findFileCommand)
	if err != nil {
		return fmt.Errorf("installation in progress, Please wait for server to be ready for %s", req.Address[0])
	}
	projectDir, err := GetProjectDir()
	if err != nil {
		log.Println(err)
		return fmt.Errorf("unable to get project directory: %s", err)
	}
	if appType == "byo" {
		keyDir := filepath.Join(projectDir, "byo")
		err = os.MkdirAll(keyDir, os.ModePerm)
		if err != nil {
			return fmt.Errorf("failed to create logs folder: %s", err)
		}
		byoPath := "byo/" + BYOScriptFile
		//byo result
		err = os.WriteFile(byoPath, []byte(req.BYOScript), 0755)
		if err != nil {
			return fmt.Errorf("failed to save logs file: %s", err)
		}
	}

	if len(checkOutput) > 0 {
		for _, address := range req.Address {
			wg.Add(1)

			go func(server SSHServer, addr string) {
				defer wg.Done()
				var id, vsiProfile, vsiName, query string
				timeStamp := time.Now().Format("2006-01-02 15:04:05")

				err := db.QueryRow("SELECT id, vsi_profile,vsi_name FROM vsi_info WHERE delete_bit = '0' and ip_address=$1", addr).Scan(&id, &vsiProfile, &vsiName)
				if err != nil {
					log.Printf("unable to scan vsi info: %s", err)
					errChan <- fmt.Errorf("unable to scan vsi info: %w", err)
					return
				}

				conn, err := ssh.Dial(Network, addr+":"+req.Port, config)
				if err != nil {
					log.Printf("error connecting via SSH for IP %s: %s", addr, err)
					errChan <- fmt.Errorf("error connecting via SSH for IP %s: %s", addr, err)
					return
				}
				defer conn.Close()

				// Create a session for the command
				session, err := conn.NewSession()
				if err != nil {
					log.Printf("unable to create session for %s: %s", appType, err)
					errChan <- fmt.Errorf("unable to create session for %s: %s", appType, err)
					return
				}
				defer session.Close()
				if appType == "huggingface" || appType == "montecarlo" || appType == "presto" {
					insertQuery1 := `INSERT INTO benchmark_status(name,vsi_name, benchmark, category, run_status, start_date) VALUES ($1,$2,$3,$4,$5,$6)`

					_, err = db.Exec(insertQuery1, benchMarkFileName, vsiName, application, category, "Started", timeStamp)
					if err != nil {
						log.Printf("failed to insert data of %s into database: %s", appType, err)
						errChan <- fmt.Errorf("failed to insert data of %s into database: %s", appType, err)
						return
					}
				}
				switch appType {
				case "byo":
					client := scp.NewClient(addr+":"+req.Port, config)

					// Connect to the remote server
					err := client.Connect()
					if err != nil {
						log.Printf("couldn't establish a connection to the remote server: %s", err)
						errChan <- fmt.Errorf("couldn't establish a connection to the remote server: %s", err)
						return
					}
					defer client.Close()
					f, err := os.Open(filepath.Join(dir, "byo/byo_user_script.sh"))
					if err != nil {
						log.Printf("couldn't open byo_user_script.sh: %s", err)
						errChan <- fmt.Errorf("couldn't open byo_user_script.sh: %s", err)
						return
					}
					defer f.Close()
					err = client.CopyFromFile(context.Background(), *f, userScriptCommand, "0755")
					if err != nil {
						log.Printf("error while copying file: %s", err)
						errChan <- fmt.Errorf("error while copying file: %s", err)
						return
					}

					if err := session.Start(userScriptCommand); err != nil {
						log.Printf("unable to run command: %s", err)
						errChan <- fmt.Errorf("unable to run command: %s", err)
						return
					}

					query := "UPDATE byo SET createtime = $2 WHERE vsi_name = $1"
					_, err = db.Exec(query, vsiName, timeStamp)
					if err != nil {
						log.Printf("error updating benchmark_status in the database: %s", err)
						errChan <- fmt.Errorf("error updating benchmark_status in the database: %s", err)
						return
					}
				case "presto":
					if err := session.Start(runCommand); err != nil {
						log.Printf("unable to run command: %s", err)
						errChan <- fmt.Errorf("unable to run command: %s", err)
						return
					}
				case "huggingface", "montecarlo":

					if err := session.Run(runCommand); err != nil {
						UpdateBenchmarkStatusFailed(db, vsiName)
						log.Printf("unable to run command: %s", err)
						errChan <- fmt.Errorf("unable to run command: %s", err)
						return
					}

					sessionRunner, err := conn.NewSession()
					if err != nil {
						UpdateBenchmarkStatusFailed(db, vsiName)
						log.Printf("unable to create session for %s: %s", appType, err)
						errChan <- fmt.Errorf("unable to create session for %s: %s", appType, err)
						return
					}
					defer sessionRunner.Close()

					// Capture the output
					result, err := sessionRunner.Output(logCommand)
					if err != nil {
						UpdateBenchmarkStatusFailed(db, vsiName)
						log.Printf("unable to capture output: %s", err)
						errChan <- fmt.Errorf("unable to capture output: %s", err)
						return
					}

					sessionOutput, err := conn.NewSession()
					if err != nil {
						UpdateBenchmarkStatusFailed(db, vsiName)
						log.Printf("unable to create session for %s: %s", appType, err)
						errChan <- fmt.Errorf("unable to create session for %s: %s", appType, err)
						return
					}
					defer sessionOutput.Close()

					output, err := sessionOutput.Output(outputCommand)
					if err != nil {
						UpdateBenchmarkStatusFailed(db, vsiName)
						log.Printf("unable to capture output: %s", err)
						errChan <- fmt.Errorf("unable to capture output: %s", err)
						return
					}

					fileName := fmt.Sprintf("%s%s.log", time.Now().Format("20060102150405"), "VSI")
					// Create or open the logs folder
					keyDir := filepath.Join(projectDir, appType)
					err = os.MkdirAll(keyDir, os.ModePerm)
					if err != nil {
						UpdateBenchmarkStatusFailed(db, vsiName)
						log.Printf("failed to create logs folder: %s", err)
						errChan <- fmt.Errorf("failed to create logs folder: %s", err)
						return
					}
					logPath := appType + "/" + fileName
					//montecarlo result
					err = os.WriteFile(logPath, result, 0644)
					if err != nil {
						UpdateBenchmarkStatusFailed(db, vsiName)
						log.Printf("failed to save logs file: %s", err)
						errChan <- fmt.Errorf("failed to save logs file: %s", err)
						return
					}

					// Process the output for database insertion
					outputStr := string(output)
					switch appType {
					case "huggingface":
						err = InsertHuggingFaceBenchmarkData(db, outputStr, vsiProfile, timeStamp, fileName, id, vsiName)
						if err != nil {
							log.Printf("error inserting data into database for %s: %s", appType, err)
							errChan <- fmt.Errorf("error inserting data into database for %s: %s", appType, err)
							return
						}
					case "montecarlo":
						err = InsertMonteCarloBenchmarkData(db, outputStr, vsiProfile, timeStamp, fileName, id, vsiName)
						if err != nil {
							log.Printf("error inserting data into database for %s: %s", appType, err)
							errChan <- fmt.Errorf("error inserting data into database for %s: %s", appType, err)
							return
						}
					}
					query = "UPDATE benchmark_status SET run_status = 'Completed',attachments=$1 WHERE vsi_name = $2"
					_, err = db.Exec(query, fileName, vsiName)
					if err != nil {
						log.Printf("error updating benchmark_status in the database: %s", err)
						errChan <- fmt.Errorf("error updating benchmark_status in the database: %s", err)
						return
					}

				}

			}(req, address)
		}
		wg.Wait()
		close(errChan)
		if appType != "presto" {
			ResetFlag(db, apiName)
		}
	}
	return nil
}

func GetInstanceIDsFromVPC() ([]string, error) {
	vpcService := GetVPCService()

	options := &vpcv1.ListInstancesOptions{}
	response, _, err := vpcService.ListInstances(options)
	if err != nil {
		return nil, err
	}

	var instanceIDs []string
	for _, instance := range response.Instances {
		instanceIDs = append(instanceIDs, *instance.ID)
	}
	return instanceIDs, nil
}

func CheckVsiInCloud(slice []string, item string) bool {
	for _, i := range slice {
		if i == item {
			return true
		}
	}
	return false
}

func GetSSHConfig(db *sql.DB, dir string, keyPairName string, userName string) (*ssh.ClientConfig, error) {

	path := filepath.Join(dir, FolderName)
	key, err := os.ReadFile(filepath.Join(path, keyPairName))
	if err != nil {
		return nil, fmt.Errorf("error reading private key for %s: %s", path+"/"+keyPairName, err)
	}

	signer, err := ssh.ParsePrivateKey(key)
	if err != nil {
		return nil, fmt.Errorf("error parsing private key: %s", err)
	}

	return &ssh.ClientConfig{
		User: userName,
		Auth: []ssh.AuthMethod{
			ssh.PublicKeys(signer),
		},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}, nil
}

func HandleBYOInstallation(conn *ssh.Client, count int, dir string, addr string, config *ssh.ClientConfig) {
	pollingSession, err := conn.NewSession()
	if err != nil {
		log.Printf("Unable to create session: %s", err)
		return
	}
	defer pollingSession.Close()

	if count == 0 {
		findByoPoll, err := pollingSession.CombinedOutput("find byo_polling.sh")
		if err != nil {
			log.Printf("Installation in progress, Please wait for server to be ready for %s: %s", addr, string(findByoPoll))
			client := scp.NewClient(addr+":"+Port, config)
			// Connect to the remote server
			err := client.Connect()
			if err != nil {
				log.Printf("Couldn't establish a connection to the remote server: %s ", err)
				return
			}
			defer client.Close()

			f, err := os.Open(filepath.Join(dir, BYOPolling))
			if err != nil {
				log.Printf("Couldn't open file BYO_polling: %s ", err)
				return
			}
			defer f.Close()
			err = client.CopyFromFile(context.Background(), *f, "/home/ubuntu/byo_polling.sh", "0755")

			if err != nil {
				log.Printf("Error while copying file for create instance byo: %s ", err)
				return
			}
			session, err := conn.NewSession()
			if err != nil {
				log.Printf("Unable to create sesion: %s", err)
				return
			}
			defer session.Close()

			if err := session.Start("/home/ubuntu/byo_polling.sh"); err != nil {
				log.Printf("Unable to run command: %s", err)
				return
			}
			return
		}
		runnerSession, err := conn.NewSession()
		if err != nil {
			log.Printf("Unable to create session: %s", err)
			return
		}
		defer runnerSession.Close()
		findByoRun, err := runnerSession.CombinedOutput("find byo_runner.sh")
		if err != nil {
			log.Printf("Installation in progress, Please wait for server to be ready for %s: %s", addr, string(findByoRun))
			return
		}
	}
}

func GenerateBenchmarkFilePath(dir string, attachments string, folderName string) (string, error) {
	var path, relPath, finalpath string
	path = filepath.Join(dir, folderName)
	relPath, err := filepath.Rel(dir, path)
	if err != nil {
		log.Printf("Error computing relative path: %s", err)
		return "", fmt.Errorf("error computing relative path: %s", err)
	}
	finalpath = "./" + relPath + "/" + attachments
	return finalpath, nil
}

func ParseQueryParams(r *http.Request) (int, int, error) {
	queryParams := r.URL.Query()
	pageStr := queryParams.Get("page")
	countStr := queryParams.Get("count")
	count, err := strconv.Atoi(countStr)
	if err != nil || count <= 0 {
		log.Printf("Invalid 'count' parameter: %s", err)
		return 0, 0, fmt.Errorf(fmt.Sprintf("Invalid 'count' parameter: %s", err))

	}
	page, err := strconv.Atoi(pageStr)
	if err != nil || page <= 0 {
		log.Printf("Invalid 'page' parameter: %s", err)
		return 0, 0, fmt.Errorf(fmt.Sprintf("Invalid 'page' parameter: %s", err))

	}
	return count, page, nil
}

func CheckAndSetFlagStatus(db *sql.DB, apiName string, appType string) error {
	FlagMutex.Lock()
	defer FlagMutex.Unlock()

	flag, err := GetFlagStatus(db, apiName)
	if err != nil {
		log.Println(err)
		return fmt.Errorf("error getting flag status: %s", err)
	}
	if flag == true {
		log.Printf("Instance for %s in progress", appType)
		return fmt.Errorf("Instance for %s in progress", appType)
	}
	SetFlag(db, apiName)
	return nil
}

func SendErrorResponse(w http.ResponseWriter, statusCode int, message string, errMessage string) {
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"code":    statusCode,
		"message": message,
		"success": false,
		"error":   errMessage,
	})
}

func PrestoBenchmarkResult(db *sql.DB, ipAddresses []string, findFileCommand string, apiName string, appType string, outputCommand string, logCommand string) ([]string, error) {
	var wg sync.WaitGroup
	status := make([]string, len(ipAddresses))
	fileReadyChan := make(chan string, len(ipAddresses))

	dir, err := GetProjectDir()
	if err != nil {
		log.Printf("unable to find the pwd path: %s", err)
		return nil, err
	}
	for i, ipaddr := range ipAddresses {
		wg.Add(1)
		go func(i int, ipaddr string) {
			defer wg.Done()

			keyPairName, err := GetKeypairNameForIP(db, ipaddr)
			if err != nil {
				log.Printf("unable to scan keypair name for IP %s: %s", ipaddr, err)
				return
			}

			config, err := GetSSHConfig(db, dir, keyPairName, SSHUsername)
			if err != nil {
				log.Printf("failed to configure client: %s", err)
				return
			}

			conn, err := ssh.Dial(Network, ipaddr+":"+Port, config)
			if err != nil {
				log.Printf("error connecting via SSH for IP %s: %s", ipaddr, err)
				return
			}
			defer conn.Close()

			// Checking for the file installed while creating the instance
			check, err := conn.NewSession()
			if err != nil {
				log.Printf("unable to create session: %s", err)
				return
			}
			defer check.Close()

			findFile, err := check.CombinedOutput(findFileCommand)
			if err != nil || len(findFile) == 0 {
				log.Printf("operation in progress, please wait for server to be ready for %s: %s", ipaddr, string(findFile))
				return
			}

			if len(findFile) > 0 {
				fileReadyChan <- ipaddr
			}
		}(i, ipaddr)
	}

	// Wait for all goroutines to finish
	wg.Wait()
	close(fileReadyChan)

	// Collect all IPs that are ready
	readyIPs := make(map[string]bool)
	for ipaddr := range fileReadyChan {
		readyIPs[ipaddr] = true
	}

	// Check if all IPs are ready before proceeding to insert data
	if len(readyIPs) == len(ipAddresses) {
		for i, ipaddr := range ipAddresses {
			if readyIPs[ipaddr] {
				dir, err := GetProjectDir()
				if err != nil {
					log.Printf("unable to find the pwd path: %s", err)
					return nil, err
				}

				keyPairName, err := GetKeypairNameForIP(db, ipaddr)
				if err != nil {
					log.Printf("unable to scan keypair name for IP %s: %s", ipaddr, err)
					return nil, err
				}

				config, err := GetSSHConfig(db, dir, keyPairName, SSHUsername)
				if err != nil {
					log.Printf("failed to configure client: %s", err)
					return nil, err
				}

				if err = InsertPrestoBenchmarkData(db, dir, keyPairName, config, appType, outputCommand, ipaddr, logCommand); err != nil {
					log.Printf("error inserting data into database for %s: %s", ipaddr, err)
					return nil, err
				}

				var runStatus string
				err = db.QueryRow(`SELECT bs.run_status
					FROM benchmark_status bs
					JOIN vsi_info vi ON bs.vsi_name = vi.vsi_name
					WHERE vi.ip_address = $1
					ORDER BY bs.start_date DESC
					LIMIT 1;`, ipaddr).Scan(&runStatus)
				if err != nil {
					log.Printf("error fetching data from database for %s: %s", ipaddr, err)
					return nil, err
				}
				status[i] = runStatus
			}
		}
	} else {
		for _, ipaddr := range ipAddresses {
			if !readyIPs[ipaddr] {
				log.Printf("IP %s is not ready for processing", ipaddr)
			}
		}
	}
	return status, nil
}

// TimeoutHandler is a middleware function to handle timeouts.
func TimeoutHandler(h http.HandlerFunc, timeout time.Duration) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), timeout)
		defer cancel()

		r = r.WithContext(ctx)

		done := make(chan struct{})
		go func() {
			h.ServeHTTP(w, r)
			close(done)
		}()

		select {
		case <-done:
			// Handler finished successfully
		case <-ctx.Done():
			if ctx.Err() == context.DeadlineExceeded {
				log.Printf("Request timed out for %s", r.URL)
				SendErrorResponse(w, http.StatusGatewayTimeout, fmt.Sprintf("Request timed out for %s", r.URL), fmt.Sprint(err))
			}
		}
	}
}
