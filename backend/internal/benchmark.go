package sandbox

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"os"
	"strings"
	"sync"

	"golang.org/x/crypto/ssh"
)

// ==================================Monte Carlo Application========================
// -----------------------------Run Benchmark for Monte Carlo ----------------------
func RunMonteCarloBenchmark(w http.ResponseWriter, r *http.Request, db *sql.DB) {

	const (
		failedMessage   = "Monte Carlo failed to run benchmark."
		successMessage  = "Monte Carlo benchmark ran successfully"
		appType         = "montecarlo"
		findFileCommand = "find MonteCarlo"
		runCommand      = "/home/ubuntu/montecarlo_runner.sh"
		logCommand      = "cat montecarlo-results/montecarlo.log"
		outputCommand   = "cat montecarlo-results/output.log"
	)
	benchMarkFileName := "mc-benchmark-" + GenerateRandomString()

	var req SSHServer
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Invalid request body: %s", err))
		return
	}

	if len(req.Address) == 0 {
		log.Printf("Please send the IP address of the instance")
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, "Please send the IP address of the instance")
		return
	}

	err = CheckAndSetFlagStatus(db, RunBenchmarkMontecarlo, appType)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("error setting flag status:%s", err))
		return
	}
	// Run the benchmark

	err = RunBenchmark(db, req, appType, RunBenchmarkMontecarlo, findFileCommand, MonteCarlo, MonteCarloCategory,
		benchMarkFileName, runCommand, logCommand, outputCommand, "")
	if err != nil {
		log.Println(err)
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		ResetFlag(db, RunBenchmarkMontecarlo)
		return
	}

	log.Println(successMessage)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": successMessage,
		"success": true,
		"code":    http.StatusOK,
		"error":   nil,
	})
}

// ------------------------------------List Monte Carlo Benchmark-------------------
func ListMonteCarloBenchmark(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const failedMessage = "Monte Carlo list benchmark failed."

	count, page, err := ParseQueryParams(r)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Invalid Query Parameters: %s", err))
		return
	}

	rows, err := db.Query(`SELECT ID, vsi_name, vsi_profile, 
		COALESCE(Performance_Metric_1,'') AS Performance_Metric_1, 
		COALESCE(CPU_Utilization,'') AS CPU_Utilization,
		COALESCE(Memory_Utilization,'') AS Memory_Utilization, 
		COALESCE(createtime,'') AS createtime 
		FROM montecarlo WHERE delete_bit = '0'
	 	ORDER BY ID DESC LIMIT $1 OFFSET ($2-1)*$1;`, count, page)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}
	defer rows.Close()
	result := []ListBenchmark{}
	for rows.Next() {
		var id int
		var performanceMetric1, vsiProfile, cpuUtilization, memoryUtilization, vsiName, time string

		err := rows.Scan(&id, &vsiName, &vsiProfile, &performanceMetric1, &cpuUtilization, &memoryUtilization, &time)

		if err != nil {
			SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		}

		result = append(result, ListBenchmark{ID: id, VSIName: vsiName, VSIProfile: vsiProfile, PerformanceMetric1: performanceMetric1,
			CPUUtilization: cpuUtilization, MemoryUtilization: memoryUtilization, Time: time})
	}

	createFlag, err := GetFlagStatus(db, RunBenchmarkMontecarlo)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to scan create flag: %s", err))
		return
	}
	deleteFlag, err := GetFlagStatus(db, DeleteInstanceMontecarlo)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to scan delete flag: %s", err))
		return
	}

	if len(result) >= 2 {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"createFlag": createFlag,
			"deleteFlag": deleteFlag,
			"ListTest":   result,
			"code":       http.StatusOK,
			"message":    "Listing Monte Carlo Benchmark",
			"success":    true,
			"error":      nil,
		})
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{
		"createFlag": createFlag,
		"deleteFlag": deleteFlag,
		"ListTest":   []ListBenchmark{},
		"code":       http.StatusOK,
		"message":    "Listing Monte Carlo Benchmark",
		"success":    true,
		"error":      nil,
	})
}

// ====================================HuggingFace==================================
// -----------------------------Run Benchmark for HuggingFace ----------------------
func RunHuggingFaceBenchmark(w http.ResponseWriter, r *http.Request, db *sql.DB) {

	const (
		failedMessage   = "HuggingFace failed to run benchmark."
		successMessage  = "HuggingFace benchmark ran successfully"
		appType         = "huggingface"
		findFileCommand = "find huggingface_runner.sh"
		runCommand      = "/home/ubuntu/huggingface_runner.sh"
		logCommand      = "cat benchmark.log"
		outputCommand   = "cat output.log"
	)
	benchMarkFileName := "hf-benchmark-" + GenerateRandomString()

	//Database Connection

	var req SSHServer
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Invalid request body: %s", err))
		return
	}

	if len(req.Address) == 0 {
		log.Printf("Please send the IP address of the instance")
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, "Please send the IP address of the instance")
		return
	}

	err = CheckAndSetFlagStatus(db, RunBenchmarkHuggingface, appType)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("error setting flag status:%s", err))
		return
	}

	err = RunBenchmark(db, req, appType, RunBenchmarkHuggingface, findFileCommand, HuggingFace, HuggingFaceCategory,
		benchMarkFileName, runCommand, logCommand, outputCommand, "")
	if err != nil {
		log.Println(err)
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}

	log.Println(successMessage)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": successMessage,
		"success": true,
		"code":    http.StatusOK,
		"error":   nil,
	})

}

// -----------------------------List HuggingFace Benchmark---------------------------
func ListHuggingFaceBenchmark(w http.ResponseWriter, r *http.Request, db *sql.DB) {

	const (
		failedMessage  = "HuggingFace list benchmark failed."
		successMessage = "Listing HuggingFace Benchmark"
	)
	count, page, err := ParseQueryParams(r)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Invalid Query Parameters: %s", err))
		return
	}

	rows, err := db.Query(`SELECT ID, vsi_name, vsi_profile, 
		COALESCE(bert_short_sentence,'') AS bert_short_sentence, 
		COALESCE(bert_short_sentence_array,'') AS bert_short_sentence_array,
		COALESCE(roberta_short_sentence,'') AS roberta_short_sentence, 
		COALESCE(roberta_short_sentence_array,'') AS roberta_short_sentence_array,
		COALESCE(cpu_utilization,'') AS cpu_utilization, 
		COALESCE(memory_utilization,'') AS memory_utilization, 
		COALESCE(createtime,'') AS createtime 
		FROM huggingface WHERE delete_bit = '0'
     	ORDER BY ID DESC LIMIT $1 OFFSET ($2-1)*$1;`, count, page)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}
	defer rows.Close()
	result := []ListHuggingFace{}
	for rows.Next() {
		var id int
		var bertShortSentence, bertShortSentenceArray, robertaShortSentence, robertaShortSentenceArray, vsiProfile, cpuUtilization, memoryUtilization, vsiName, time string

		err := rows.Scan(&id, &vsiName, &vsiProfile, &bertShortSentence, &bertShortSentenceArray, &robertaShortSentence,
			&robertaShortSentenceArray, &cpuUtilization, &memoryUtilization, &time)

		if err != nil {
			SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
			return
		}

		result = append(result, ListHuggingFace{ID: id, VSIName: vsiName, VSIProfile: vsiProfile,
			Bert:              Bert{BertShortSentence: bertShortSentence, BertShortSentenceArray: bertShortSentenceArray},
			Roberta:           Roberta{RobertaShortSentence: robertaShortSentence, RobertaShortSentenceArray: robertaShortSentenceArray},
			CPUUtilization:    cpuUtilization,
			MemoryUtilization: memoryUtilization,
			Time:              time,
		})
	}

	createFlag, err := GetFlagStatus(db, RunBenchmarkHuggingface)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to scan create flag: %s", err))
		return
	}

	deleteFlag, err := GetFlagStatus(db, DeleteInstanceHuggingface)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to scan delete flag: %s", err))
		return
	}

	if len(result) >= 2 {
		json.NewEncoder(w).Encode(map[string]interface{}{"createFlag": createFlag,
			"deleteFlag": deleteFlag,
			"ListTest":   result,
			"code":       http.StatusOK,
			"message":    successMessage,
			"success":    true})
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"createFlag": createFlag,
		"deleteFlag": deleteFlag,
		"ListTest":   []ListHuggingFace{},
		"code":       http.StatusOK,
		"message":    successMessage,
		"success":    true})
}

// ====================================BYOA===========================================
// -----------------------------Run Benchmark for BYOA -------------------------------

func RunBYOBenchmark(w http.ResponseWriter, r *http.Request, db *sql.DB) {

	const (
		failedMessage     = "BYOA failed to run benchmark."
		successMessage    = "BYOA benchmark ran successfully"
		appType           = "byo"
		findFileCommand   = "find byo_runner.sh"
		userScriptCommand = "/home/ubuntu/byo_user_script.sh"
	)

	//Database Connection

	var req SSHServer
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Invalid request body: %s", err))
		return
	}

	if len(req.Address) == 0 {
		log.Printf("Please send the IP address of the instance")
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, "Please send the IP address of the instance")
		return
	}

	err = CheckAndSetFlagStatus(db, RunBenchmarkByo, appType)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("error setting flag status:%s", err))
		return
	}
	err = RunBenchmark(db, req, appType, RunBenchmarkByo, findFileCommand, "", "", "", "", "", "", userScriptCommand)
	if err != nil {
		log.Println(err)
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}

	log.Println(successMessage)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": successMessage,
		"success": true,
		"code":    http.StatusOK,
		"error":   nil,
	})

}

// -------------------------Polling BYOA for utilization------------------------------
func RunBYOPolling(w http.ResponseWriter, r *http.Request, db *sql.DB) {

	const failedMessage = "BYOA failed to fetch metrics."

	var wg sync.WaitGroup

	rows, err := db.Query("SELECT ip_address FROM vsi_info WHERE delete_bit = '0' AND app_name=$1", BYO)
	if err != nil {
		log.Printf("Error querying database: %s", err)
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Error querying database: %s", err))
		return
	}
	defer rows.Close()

	var addresses []string
	for rows.Next() {
		var ipaddress string
		if err := rows.Scan(&ipaddress); err != nil {
			log.Printf("Error scanning rows: %s", err)
			SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Error scanning rows: %s", err))
			return
		}
		addresses = append(addresses, ipaddress)
	}

	for _, address := range addresses {
		wg.Add(1)

		go func(addr string) {
			defer wg.Done()

			dir, err := GetProjectDir()
			if err != nil {
				log.Printf("Unable to find the pwd path: %s", err)
				SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to find the pwd path: %s", err))
				return
			}

			keyPairName, err := GetKeypairNameForIP(db, addresses[0])
			if err != nil {
				log.Printf("unable to scan keypair name for IP %s: %s", addresses[0], err)
				SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("unable to scan keypair name for IP %s: %s", addresses[0], err))
				return
			}
			config, err := GetSSHConfig(db, dir, keyPairName, SSHUsername)
			if err != nil {
				log.Printf("Failed to configure client: %s", err)
				SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Failed to configure client: %s", err))
				return
			}

			conn, err := ssh.Dial(Network, addr+":"+Port, config)
			if err != nil {
				log.Printf("Error connecting via SSH for IP %s: %s", addr, err)
				SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Error connecting via SSH: %s", err))
				return
			}
			defer conn.Close()

			var count int
			query := `SELECT count(max_cpu_utilization) FROM byo WHERE instance_id=(SELECT id FROM vsi_info WHERE delete_bit='0' and ip_address=$1);`
			err = db.QueryRow(query, addr).Scan(&count)
			if err != nil {
				log.Printf("Unable to scan count for IP %s : %s", addr, err)
				SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to scan count: %s", err))
				return
			}

			HandleBYOInstallation(conn, count, dir, addr, config)

			// Create a session for the command
			session, err := conn.NewSession()
			if err != nil {
				log.Printf("Unable to create session: %s", err)
				SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to create session: %s", err))
				return
			}
			defer session.Close()

			if err := session.Run("/home/ubuntu/byo_runner.sh"); err != nil {
				log.Printf("Unable to run command: %s", err)
				SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to run command: %s", err))
				return
			}

			sessionOutput, err := conn.NewSession()
			if err != nil {
				log.Printf("Unable to create session: %s", err)
				SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to create session: %s", err))
				return
			}
			defer sessionOutput.Close()

			// Capture the output
			output, err := sessionOutput.Output("cat output.log")
			if err != nil {
				log.Printf("Unable to capture output: %s", err)
				SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to capture output: %s", err))
				return
			}

			// Process the output for database insertion
			outputStr := string(output)
			err = InsertBYOBenchmarkData(db, outputStr, addr)
			if err != nil {
				log.Printf("error inserting data into database: %s", err)
				SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("error inserting data into database: %s", err))
				return
			}
		}(address)
	}

	wg.Wait()
}

// ------------------------------------List BYOA-------------------------------------
func ListBYOBenchmark(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const failedMessage = "BYOA failed to list benchmark."

	count, page, err := ParseQueryParams(r)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Invalid Query Parameters: %s", err))
		return
	}

	str := `SELECT ID, vsi_name, vsi_profile,
	COALESCE(current_cpu_utilization, 0.0), COALESCE(max_cpu_utilization, 0.0),
	COALESCE(current_memory_utilization, 0.0), COALESCE(max_memory_utilization, 0.0),
	COALESCE(current_network_rx_utilization, 0.0), COALESCE(max_network_rx_utilization, 0.0),
	COALESCE(current_network_tx_utilization, 0.0), COALESCE(max_network_tx_utilization, 0.0),
	COALESCE(current_io_utilization, 0.0), COALESCE(max_io_utilization, 0.0),
	COALESCE(createtime, ''), COALESCE(sum_cpu_utilization, 0.0), COALESCE(count_cpu, 0),
	COALESCE(sum_memory_utilization, 0.0), COALESCE(count_memory, 0),
	COALESCE(sum_network_rx_utilization, 0.0), COALESCE(count_network_rx, 0),
	COALESCE(sum_network_tx_utilization, 0.0), COALESCE(count_network_tx, 0),
	COALESCE(sum_io_utilization, 0.0), COALESCE(count_io, 0)
	FROM byo WHERE delete_bit = '0'
    ORDER BY ID DESC LIMIT $1 OFFSET ($2-1)*$1;`

	rows, err := db.Query(str, count, page)
	if err != nil {
		log.Printf("Failed to insert data into database: %s", err)
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}
	defer rows.Close()
	result := []ListBYO{} // creating slice
	for rows.Next() {
		var id, countCPU, countMemory, countNetworkRx, countNetworkTx, countIo int
		var (
			currentCPUUtilization, maxCPUUtilization, sumCPU, averageCPUUtilization                         float64
			currentMemoryUtilization, maxMemoryUtilization, sumMemory, averageMemoryUtilization             float64
			currentNetworkRxUtilization, maxNetworkRxUtilization, sumNetworkRx, averageNetworkRxUtilization float64
			currentNetworkTxUtilization, maxNetworkTxUtilization, sumNetworkTx, averageNetworkTxUtilization float64
			currentIoUtilization, maxIoUtilization, sumIo, averageIoUtilization                             float64
		)
		var vsiProfile, vsiName, time string

		err := rows.Scan(&id, &vsiName, &vsiProfile, &currentCPUUtilization, &maxCPUUtilization, &currentMemoryUtilization, &maxMemoryUtilization,
			&currentNetworkRxUtilization, &maxNetworkRxUtilization, &currentNetworkTxUtilization, &maxNetworkTxUtilization, &currentIoUtilization,
			&maxIoUtilization, &time, &sumCPU, &countCPU, &sumMemory, &countMemory, &sumNetworkRx, &countNetworkRx, &sumNetworkTx,
			&countNetworkTx, &sumIo, &countIo)

		if err != nil {
			SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
			return
		}

		if sumCPU == 0.0 {
			averageCPUUtilization = (maxCPUUtilization + currentCPUUtilization) / 2
		} else {
			averageCPUUtilization = sumCPU / float64(countCPU)
		}

		if sumMemory == 0.0 {
			averageMemoryUtilization = (maxMemoryUtilization + currentMemoryUtilization) / 2
		} else {
			averageMemoryUtilization = sumMemory / float64(countMemory)
		}

		if sumNetworkRx == 0.0 {
			averageNetworkRxUtilization = (maxNetworkRxUtilization + currentNetworkRxUtilization) / 2
		} else {
			averageNetworkRxUtilization = sumNetworkRx / float64(countNetworkRx)
		}

		if sumNetworkTx == 0.0 {
			averageNetworkTxUtilization = (maxNetworkTxUtilization + currentNetworkTxUtilization) / 2
		} else {
			averageNetworkTxUtilization = sumNetworkTx / float64(countNetworkTx)
		}

		if sumIo == 0.0 {
			averageIoUtilization = (maxIoUtilization + currentIoUtilization) / 2
		} else {
			averageIoUtilization = sumIo / float64(countIo)
		}
		result = append(result, ListBYO{ID: id,
			VSIName:           vsiName,
			VSIProfile:        vsiProfile,
			MaxCPUUtilization: fmt.Sprintf("%.2f%%", maxCPUUtilization), CurrentCPUUtilization: fmt.Sprintf("%.2f%%", currentCPUUtilization),
			MaxMemoryUtilization: fmt.Sprintf("%.2f%%", maxMemoryUtilization), CurrentMemoryUtilization: fmt.Sprintf("%.2f%%", currentMemoryUtilization),
			MaxNetworkRxUtilization: fmt.Sprintf("%.2f%%", maxNetworkRxUtilization), CurrentNetworkRxUtilization: fmt.Sprintf("%.2f%%", currentNetworkRxUtilization),
			MaxNetworkTxUtilization: fmt.Sprintf("%.2f%%", maxNetworkTxUtilization), CurrentNetworkTxUtilization: fmt.Sprintf("%.2f%%", currentNetworkTxUtilization),
			MaxIOUtilization: fmt.Sprintf("%.2f%%", maxIoUtilization), CurrentIOUtilization: fmt.Sprintf("%.2f%%", currentIoUtilization),
			AverageCPUUtilization: fmt.Sprintf("%.2f%%", averageCPUUtilization), AverageMemoryUtilization: fmt.Sprintf("%.2f%%", averageMemoryUtilization),
			AverageNetworkRxUtilization: fmt.Sprintf("%.2f%%", averageNetworkRxUtilization),
			AverageNetworkTxUtilization: fmt.Sprintf("%.2f%%", averageNetworkTxUtilization),
			AverageIOUtilization:        fmt.Sprintf("%.2f%%", averageIoUtilization), Time: time})

	}

	createFlag, err := GetFlagStatus(db, RunBenchmarkByo)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to scan create flag: %s", err))
		return
	}

	deleteFlag, err := GetFlagStatus(db, DeleteInstanceByo)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to scan delete flag: %s", err))
		return
	}

	if len(result) == 2 {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"createFlag": createFlag,
			"deleteFlag": deleteFlag,
			"ListTest":   result,
			"code":       http.StatusOK,
			"message":    "Listing BYOA Benchmark",
			"success":    true,
		})
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{
		"createFlag": createFlag,
		"deleteFlag": deleteFlag,
		"ListTest":   []ListBYO{},
		"code":       http.StatusOK,
		"message":    "Listing BYOA Benchmark",
		"success":    true,
	})
}

// ==================================Presto Application========================
// -----------------------------Run Benchmark for Presto ----------------------
func RunPrestoBenchmark(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const (
		failedMessage   = "Presto failed to run benchmark."
		successMessage  = "Presto benchmark initiated successfully."
		appType         = "presto"
		apiName         = RunBenchmarkPresto
		findFileCommand = "find presto_runner_metrics.sh"
	)
	benchMarkFileName := "ps-benchmark-" + GenerateRandomString()

	a, err := io.ReadAll(r.Body)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}
	var req SSHServer
	if err := json.Unmarshal(a, &req); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}

	var pq PrestoQuery
	if err := json.Unmarshal(a, &pq); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}

	err = pq.Validate()
	if err != nil {
		log.Printf("Validation failed: %s", err)
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Validation failed: %s", err))
		return
	}
	var runCommand = fmt.Sprintf("/home/ubuntu/presto_runner_metrics.sh %s", pq.PrestoQuery)

	err = CheckAndSetFlagStatus(db, apiName, appType)
	if err != nil {
		ResetFlag(db, apiName)
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("error setting flag status:%s", err))
		return
	}

	err = RunBenchmark(db, req, appType, apiName, findFileCommand, Presto, PrestoCategory, benchMarkFileName, runCommand, "", "", "")
	if err != nil {
		log.Println(err)
		ResetFlag(db, apiName)
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}

	log.Println(successMessage)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": successMessage,
		"success": true,
		"code":    http.StatusOK,
		"error":   nil,
	})
}

// -----------------------------Get Presto Benchmark Status-------------------------
func GetPrestoBenchmarkStatus(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const (
		failedMessage   = "Presto run benchmark failed"
		vsiName         = "sbox-presto-vm%"
		findFileCommand = "find output.log"
		apiName         = RunBenchmarkPresto
		appType         = "presto"
		outputCommand   = "cat output.log"
		logCommand      = "cat presto.log"
	)
	createFlag, err := GetFlagStatus(db, apiName)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to scan create flag: %s", err))
		return
	}
	if createFlag == true {
		_, ipAddresses, err := GetInstanceDetails(db, vsiName)
		if err != nil {
			SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
			return
		}
		status, err := PrestoBenchmarkResult(db, ipAddresses, findFileCommand, apiName, appType, outputCommand, logCommand)
		if err != nil {
			fmt.Println(err)
			log.Printf("Presto benchmark execution failed: %s", err)
			SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
			return
		}
		if len(status) == 2 {

			allCompleted := true
			anyFailed := false

			for _, runStatus := range status {
				if runStatus != "Completed" {
					allCompleted = false
				}
				if runStatus == "Failed" {
					anyFailed = true
				}
			}

			if allCompleted {
				ResetFlag(db, apiName)
				log.Println("Presto benchmark ran successfully")
				json.NewEncoder(w).Encode(map[string]interface{}{
					"code":    http.StatusOK,
					"message": "Presto benchmark ran successfully",
					"success": true,
					"error":   nil,
				})
				return
			} else if anyFailed {
				ResetFlag(db, apiName)
				log.Println(failedMessage)
				SendErrorResponse(w, http.StatusBadRequest, failedMessage, failedMessage)
				return
			}
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"code":    http.StatusBadRequest,
			"message": "Benchmark in progress",
			"success": nil,
			"error":   "Benchmark in progress",
		})
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{
		"code":    http.StatusBadRequest,
		"message": "No running benchmark",
		"success": nil,
		"error":   "No running benchmark",
	})
}

// ------------------------------------List Presto Benchmark-------------------
func ListPrestoBenchmark(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const (
		failedMessage  = "Presto list benchmark failed."
		successMessage = "Listing Presto Benchmark."
	)

	count, page, err := ParseQueryParams(r)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Invalid Query Parameters: %s", err))
		return
	}

	rows, err := db.Query(`SELECT ID,vsi_name,vsi_profile,
		COALESCE(query_execution_time,'') AS query_execution_time ,
		COALESCE(cpu_utilization,'') AS cpu_utilization,
		COALESCE(memory_utilization,'') AS memory_utilization ,
		COALESCE(createtime,'') AS createtime 
		FROM presto WHERE delete_bit = '0'
	 	ORDER BY ID DESC LIMIT $1 OFFSET ($2-1)*$1;`, count, page)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}
	defer rows.Close()
	result := []ListBenchmark{}
	for rows.Next() {
		var id int
		var performanceMetric1, vsiProfile, cpuUtilization, memoryUtilization, vsiName, time string

		err := rows.Scan(&id, &vsiName, &vsiProfile, &performanceMetric1, &cpuUtilization, &memoryUtilization, &time)
		if err != nil {
			SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		}

		result = append(result, ListBenchmark{ID: id, VSIName: vsiName, VSIProfile: vsiProfile, PerformanceMetric1: performanceMetric1, CPUUtilization: cpuUtilization, MemoryUtilization: memoryUtilization, Time: time})
	}
	createFlag, err := GetFlagStatus(db, RunBenchmarkPresto)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to scan create flag: %s", err))
		return
	}
	deleteFlag, err := GetFlagStatus(db, DeleteInstancesPresto)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to scan delete flag: %s", err))
		return
	}

	if len(result) >= 2 {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"createFlag": createFlag,
			"deleteFlag": deleteFlag,
			"ListTest":   result,
			"code":       http.StatusOK,
			"message":    successMessage,
			"success":    true,
			"error":      nil,
		})
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{
		"createFlag": createFlag,
		"deleteFlag": deleteFlag,
		"ListTest":   []ListBenchmark{},
		"code":       http.StatusOK,
		"message":    successMessage,
		"success":    true,
		"error":      nil,
	})
}

// -------------------------------------List Benchmark Logs--------------------------
func GetLogs(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const failedMessage = "List benchmark logs failed."

	WriteStatusUpdatesToDatabase(w, r, db)

	a, err := io.ReadAll(r.Body)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}
	var l Logs
	if err := json.Unmarshal(a, &l); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}

	var total int

	query := `SELECT count(id) FROM benchmark_status WHERE benchmark_status ::text ~* $1`
	err = db.QueryRow(query, l.Search).Scan(&total) // exporting table
	if err != nil {
		log.Println(err)
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}

	str := `SELECT id,COALESCE(name,''),
			COALESCE(benchmark,''),COALESCE(vsi_name,''),
			COALESCE(category,''),COALESCE(run_status,''),
			COALESCE(start_date,''),COALESCE(attachments,'') 
			FROM benchmark_status WHERE benchmark_status ::text ~* $1
			ORDER BY id DESC LIMIT $2 OFFSET $3`

	offset := (l.Page - 1) * l.Count

	rows, err := db.Query(str, l.Search, l.Count, offset)
	if err != nil {
		log.Println(err)
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}
	defer rows.Close()
	result := []ListLogs{}
	for rows.Next() {
		var ID int
		var name, benchMark, vsiName, category, status, date, attachments string
		err := rows.Scan(&ID, &name, &benchMark, &vsiName, &category, &status, &date, &attachments)

		if err != nil {
			SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
			return
		}
		dir, err := GetProjectDir()
		if err != nil {
			log.Printf("Unable to find the pwd path: %s", err)
			SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to find the pwd path: %s", err))
			return
		}
		var finalpath string
		switch benchMark {
		case MonteCarlo:
			finalpath, err = GenerateBenchmarkFilePath(dir, attachments, MonteCarloResults)
		case HuggingFace:
			finalpath, err = GenerateBenchmarkFilePath(dir, attachments, HuggingfaceResults)
		case Presto:
			finalpath, err = GenerateBenchmarkFilePath(dir, attachments, PrestoResults)
		}
		if err != nil {
			SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Error computing final path: %s", err))
			return
		}

		result = append(result, ListLogs{ID: ID, Name: name, BenchMark: benchMark, VSIName: vsiName, Category: category, Status: status, Date: date, Attachments: finalpath})
	}

	totalPage := math.Ceil(float64(total*1.0) / float64(l.Count*1.0))
	json.NewEncoder(w).Encode(map[string]interface{}{
		"count":      l.Count,
		"pageNo":     l.Page,
		"totalEntry": total,
		"search":     l.Search,
		"totalPage":  totalPage,
		"data":       result,
		"code":       http.StatusOK,
		"message":    "Listing Benchmark Logs",
		"success":    true,
	})
}

// -------------------------------Download Logs file---------------------------------
func DownloadLogs(w http.ResponseWriter, r *http.Request) {
	const failedMessage = "Download benchmark logs failed."

	queryParams := r.URL.Query()
	filepath := queryParams.Get("filepath")

	// Define the allowed absolute file path prefixes
	allowedFilePathPrefixes := []string{
		"./montecarlo",
		"./huggingface",
		"./presto",
	}

	// Check if the requested file path matches any allowed prefix
	var isAllowed bool
	for _, prefix := range allowedFilePathPrefixes {
		if strings.HasPrefix(filepath, prefix) {
			isAllowed = true
			break
		}
	}

	// If the requested file path does not match any allowed prefix, return an error
	if !isAllowed {
		log.Printf("Unauthorized file access attempt: %s", filepath)
		SendErrorResponse(w, http.StatusUnauthorized, failedMessage, "Unauthorized Access")
		return
	}

	content, err := os.ReadFile(filepath)
	if err != nil {
		log.Printf("File Not Found in the Disk: %s", err)
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"FileContent": string(content),
		"code":        http.StatusOK,
		"message":     "File Content",
		"success":     true,
	})
}

// -----------------------------------Reset Benchmark-----------------------------------
func ResetBenchmark(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const failedMessage = "Reset benchmark failed."

	var reset Reset
	err := json.NewDecoder(r.Body).Decode(&reset)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Invalid request body: %s", err))
		return
	}

	if len(reset.InstanceIds) == 0 {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, "No instance IDs provided in the request body")
		return
	}

	var query string
	switch reset.BenchmarkName {
	case MonteCarlo:
		query = "DELETE FROM montecarlo WHERE instance_id=$1"
		ResetFlag(db, RunBenchmarkMontecarlo)
	case HuggingFace:
		query = "DELETE FROM huggingface WHERE instance_id=$1"
		ResetFlag(db, RunBenchmarkHuggingface)
	case BYO:
		query = `UPDATE byo SET 
				max_cpu_utilization=0.0,current_cpu_utilization=0.0,
				max_memory_utilization=0.0,current_memory_utilization=0.0,
				max_network_rx_utilization=0.0,current_network_rx_utilization=0.0,
				max_network_tx_utilization=0.0,current_network_tx_utilization=0.0,
				max_io_utilization=0.0,current_io_utilization=0.0,
				sum_cpu_utilization=0.0,count_cpu=1,
				sum_memory_utilization=0.0,count_memory=1,
				sum_network_rx_utilization=0.0,count_network_rx=1,
				sum_network_tx_utilization=0.0,count_network_tx=1,
				sum_io_utilization=0.0,count_io=1 
				WHERE instance_id =$1`
		ResetFlag(db, RunBenchmarkByo)
	case Presto:
		query = "DELETE FROM presto WHERE instance_id=$1"
		ResetFlag(db, RunBenchmarkPresto)
	default:
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, "Invalid Benchmark Name")
		return
	}

	for _, instanceID := range reset.InstanceIds {
		result, err := db.Exec(query, instanceID)
		if err != nil {
			SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Error deleting benchmark in the database: %s", err))
			return
		}

		rowsAffected, err := result.RowsAffected()
		if err != nil {
			SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Error fetching rows affected: %s", err))
			return
		}
		if rowsAffected == 0 {
			log.Printf("Data with instance ID %s not found for deletion", instanceID)
			SendErrorResponse(w, http.StatusNotFound, failedMessage, fmt.Sprintf("Data with instance ID %s not found for deletion", instanceID))
			return
		}
	}

	log.Println("Benchmark reset successfully")
	responseJSON := map[string]interface{}{
		"code":    http.StatusOK,
		"message": "Benchmark reset successfully",
		"success": true,
		"error":   nil,
	}
	json.NewEncoder(w).Encode(responseJSON)

}
