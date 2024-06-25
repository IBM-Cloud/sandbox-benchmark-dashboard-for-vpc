package sandbox

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/IBM/vpc-go-sdk/vpcv1"
	"github.com/go-playground/validator/v10"
)

// ===============================Monte Carlo=====================================
// ------------------API for create instance based on the application name-------
func CreateInstanceMonteCarlo(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const (
		appType        = "montecarlo"
		failedMessage  = "Monte Carlo failed to create instances."
		successMessage = "Monte Carlo instances created successfully"
	)

	count, err := CheckInstancesExists(db, appType)
	if err != nil {
		log.Println(err)
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}
	if count != 0 {
		SendErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Instance for %s already running", appType), "")
		return
	}

	vpcService := GetVPCService()

	err = CheckAndSetFlagStatus(db, CreateInstanceMontecarlo, appType)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("error setting flag status:%s", err))
		return
	}

	var req InstanceRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		ResetFlag(db, CreateInstanceMontecarlo)
		return
	}

	instanceStatus, err := CreateInstance(db, vpcService, appType, CreateInstanceMontecarlo, InstProfile8CPU, InstProfile16CPU, MonteCarloInstaller, MonteCarlo, req)
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
		"status":  instanceStatus,
	})

}

// -------------------------------get instance for Monte Carlo-------------------
func GetInstanceMonteCarlo(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const failedMessage = "Monte Carlo failed to list instances."

	createFlag, err := GetFlagStatus(db, CreateInstanceMontecarlo)
	if err != nil {
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}

	deleteFlag, err := GetFlagStatus(db, DeleteInstanceMontecarlo)
	if err != nil {
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}

	if createFlag == false && deleteFlag == false {
		WriteStatusUpdatesToDatabase(w, r, db)
	}

	vsiName := "sbox-montecarlo-vm%"
	instances, ipAddresses, err := GetInstanceDetails(db, vsiName)
	if err != nil {
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}
	// Respond with the list of instances
	if len(instances) == 2 && createFlag == true {

		findFileCommand := "find MonteCarlo"
		apiName := CreateInstanceMontecarlo
		err := GetInstallationStatus(db, ipAddresses, findFileCommand, apiName)
		if err != nil {
			log.Println(err)
			SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
			return
		}

		log.Println("Instances retrieved successfully")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"createFlag": createFlag,
			"deleteFlag": deleteFlag,
			"instances":  instances,
			"code":       http.StatusOK,
			"message":    "Instances retrieved successfully",
			"success":    true,
			"error":      nil,
		})
		return
	} else if len(instances) == 2 && createFlag == false {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"createFlag": createFlag,
			"deleteFlag": deleteFlag,
			"instances":  instances,
			"code":       http.StatusOK,
			"message":    "Instances retrieved successfully",
			"success":    true,
			"error":      nil,
		})
		return
	} else if len(instances) == 1 && createFlag == false {

		vpcService := GetVPCService()

		var instanceIDs []string
		instanceIDs = append(instanceIDs, instances[0].ID)
		err := DeleteInstance(db, vpcService, instanceIDs, CreateInstanceMontecarlo, "montecarlo")
		if err != nil {
			log.Println(err)
			SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprintf("Error deleting instance: %s", err))
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"createFlag": createFlag,
			"deleteFlag": deleteFlag,
			"instances":  []Instance{},
			"code":       http.StatusOK,
			"message":    "Instances creation failed for the application, please check the ibm cloud console",
			"success":    false,
			"error":      nil,
		})
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{
		"createFlag": createFlag,
		"deleteFlag": deleteFlag,
		"instances":  []Instance{},
		"code":       http.StatusOK,
		"message":    "No instances found",
		"success":    true,
		"error":      nil,
	})
}

// ------------------API for deleting instance based on instance id--------------
func DeleteInstanceMonteCarlo(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const (
		failedMessage  = "Monte Carlo failed to delete instances."
		successMessage = "Monte Carlo Instances deleted successfully"
		appType        = "montecarlo"
	)

	var request struct {
		InstanceIDs []string `json:"instanceIDs" validate:"required,min=1,dive"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}
	validate := validator.New()
	if err := validate.Struct(request); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Validation error: %s", err))
		return
	}

	vpcService := GetVPCService()

	flag, err := GetFlagStatus(db, DeleteInstanceMontecarlo)
	if err != nil {
		log.Println(err)
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}
	if flag == true {
		SendErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Instance for %s in progress", appType), "")
		return
	}
	SetFlag(db, DeleteInstanceMontecarlo)

	err = DeleteInstance(db, vpcService, request.InstanceIDs, DeleteInstanceMontecarlo, appType)
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

// ===================================HuggingFace=================================
// ------------------API for create instance based on the application name--------
func CreateInstanceHuggingFace(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const (
		failedMessage  = "HuggingFace failed to create instances."
		successMessage = "HuggingFace instances created successfully"
		appType        = "huggingface"
	)

	count, err := CheckInstancesExists(db, appType)
	if err != nil {
		log.Println(err)
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}
	if count != 0 {
		SendErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Instance for %s already running", appType), "")
		return
	}

	vpcService := GetVPCService()

	err = CheckAndSetFlagStatus(db, CreateInstanceHuggingface, appType)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("error setting flag status:%s", err))
		return
	}

	var req InstanceRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		ResetFlag(db, CreateInstanceHuggingface)
		return
	}

	instanceStatus, err := CreateInstance(db, vpcService, appType, CreateInstanceHuggingface, []string{}, InstProfile16CPU, HuggingFaceInstaller, HuggingFace, req)
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
		"status":  instanceStatus,
	})

}

// -------------------------------get instance for HuggingFace---------------------
func GetInstanceHuggingFace(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const failedMessage = "HuggingFace failed to list instances."

	createFlag, err := GetFlagStatus(db, CreateInstanceHuggingface)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to scan create flag: %s", err))
		return
	}

	deleteFlag, err := GetFlagStatus(db, DeleteInstanceHuggingface)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to scan delete flag: %s", err))
		return
	}

	if createFlag == false && deleteFlag == false {
		WriteStatusUpdatesToDatabase(w, r, db)
	}

	vsiName := "sbox-huggingface-vm%"
	instances, ipAddresses, err := GetInstanceDetails(db, vsiName)
	if err != nil {
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}

	// Respond with the list of instances
	if len(instances) == 2 && createFlag == true {

		findFileCommand := "find huggingface_runner.sh"
		apiName := CreateInstanceHuggingface
		err := GetInstallationStatus(db, ipAddresses, findFileCommand, apiName)
		if err != nil {
			SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
			return
		}
		log.Println("Instances retrieved successfully")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"createFlag": createFlag,
			"deleteFlag": deleteFlag,
			"instances":  instances,
			"code":       http.StatusOK,
			"message":    "Instances retrieved successfully",
			"success":    true,
			"error":      nil,
		})
		return
	} else if len(instances) == 2 && createFlag == false {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"createFlag": createFlag,
			"deleteFlag": deleteFlag,
			"instances":  instances,
			"code":       http.StatusOK,
			"message":    "Instances retrieved successfully",
			"success":    true,
			"error":      nil,
		})
		return
	} else if len(instances) == 1 && createFlag == false {
		vpcService := GetVPCService()

		var instanceIDs []string
		instanceIDs = append(instanceIDs, instances[0].ID)
		err := DeleteInstance(db, vpcService, instanceIDs, CreateInstanceHuggingface, "huggingface")
		if err != nil {
			log.Println(err)
			SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprintf("Error deleting instance: %s", err))
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"createFlag": createFlag,
			"deleteFlag": deleteFlag,
			"instances":  []Instance{},
			"code":       http.StatusOK,
			"message":    "Instances creation failed for the application, pls check the ibm cloud console",
			"success":    false,
			"error":      nil,
		})
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{
		"createFlag": createFlag,
		"deleteFlag": deleteFlag,
		"instances":  []Instance{},
		"code":       http.StatusOK,
		"message":    "No instances found",
		"success":    true,
		"error":      nil,
	})
}

// ------------------API for deleting instance based on instance id----------------
func DeleteInstanceHuggingFace(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const (
		failedMessage  = "HuggingFace failed to delete instances."
		successMessage = "HuggingFace Instances deleted successfully"
		appType        = "huggingface"
	)

	var request struct {
		InstanceIDs []string `json:"instanceIDs" validate:"required,min=1,dive"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}
	validate := validator.New()
	if err := validate.Struct(request); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Validation error: %s", err))
		return
	}

	flag, err := GetFlagStatus(db, DeleteInstanceHuggingface)
	if err != nil {
		log.Println(err)
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}
	vpcService := GetVPCService()

	if flag == true {
		SendErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Instance for %s in progress", appType), "")
		return
	}
	SetFlag(db, DeleteInstanceHuggingface)

	err = DeleteInstance(db, vpcService, request.InstanceIDs, DeleteInstanceHuggingface, appType)
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

// ======================================BYO Application=======================================
// ------------------------create instance for byo---------------------------------
func CreateInstanceBYO(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const (
		failedMessage  = "BYO Application failed to create instances."
		successMessage = "BYO Application instances created successfully"
		appType        = "byo"
	)

	count, err := CheckInstancesExists(db, appType)
	if err != nil {
		log.Println(err)
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}
	if count != 0 {
		SendErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Instance for %s already running", appType), "")
		return
	}

	vpcService := GetVPCService()

	err = CheckAndSetFlagStatus(db, CreateInstanceByo, appType)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("error setting flag status:%s", err))
		return
	}

	var req InstanceRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		ResetFlag(db, CreateInstanceByo)
		return
	}

	instanceStatus, err := CreateInstance(db, vpcService, appType, CreateInstanceByo, InstProfile8CPU, InstProfile16CPU, "", BYO, req)
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
		"status":  instanceStatus,
	})

}

// -------------------------------get instance for BYO Application-----------------------------
func GetInstanceBYO(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const failedMessage = "BYO Application failed to list instances."

	createFlag, err := GetFlagStatus(db, CreateInstanceByo)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to scan create flag: %s", err))
		return
	}

	deleteFlag, err := GetFlagStatus(db, DeleteInstanceByo)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to scan delete flag: %s", err))
		return
	}

	if createFlag == false && deleteFlag == false {
		WriteStatusUpdatesToDatabase(w, r, db)
	}

	vsiName := "sbox-byo-vm%"
	instances, ipAddresses, err := GetInstanceDetails(db, vsiName)
	if err != nil {
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}

	byoPollingFlag, err := GetFlagStatus(db, RunByoPolling)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Unable to scan run byo polling flag: %s", err))
		return
	}

	// Respond with the list of instances
	if len(instances) == 2 && createFlag == true {

		findFileCommand := "find output.log"
		apiName := CreateInstanceByo
		err := GetInstallationStatus(db, ipAddresses, findFileCommand, apiName)
		if err != nil {
			SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
			return
		}
		log.Println("Instances retrieved successfully")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"createFlag":     createFlag,
			"deleteFlag":     deleteFlag,
			"byoPollingFlag": byoPollingFlag,
			"instances":      instances,
			"code":           http.StatusOK,
			"message":        "Instances retrieved successfully",
			"success":        true,
			"error":          nil,
		})
		return
	} else if len(instances) == 2 && createFlag == false {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"createFlag":     createFlag,
			"deleteFlag":     deleteFlag,
			"byoPollingFlag": byoPollingFlag,
			"instances":      instances,
			"code":           http.StatusOK,
			"message":        "Instances retrieved successfully",
			"success":        true,
			"error":          nil,
		})
		return
	} else if len(instances) == 1 && createFlag == false {
		vpcService := GetVPCService()

		var instanceIDs []string
		instanceIDs = append(instanceIDs, instances[0].ID)
		err := DeleteInstance(db, vpcService, instanceIDs, CreateInstanceByo, "byo")
		if err != nil {
			log.Println(err)
			SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprintf("Error deleting instance: %s", err))
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"createFlag":     createFlag,
			"deleteFlag":     deleteFlag,
			"byoPollingFlag": byoPollingFlag,
			"instances":      []Instance{},
			"code":           http.StatusOK,
			"message":        "Instances creation failed for the application, pls check the ibm cloud console",
			"success":        false,
			"error":          nil,
		})
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{
		"createFlag":     createFlag,
		"deleteFlag":     deleteFlag,
		"byoPollingFlag": byoPollingFlag,
		"instances":      []Instance{},
		"code":           http.StatusOK,
		"message":        "No instances found",
		"success":        true,
		"error":          nil,
	})
}

// ------------------API for deleting instance based on instance id(byo)------------
func DeleteInstanceBYO(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const (
		failedMessage  = "BYO Application failed to delete instances."
		successMessage = "BYO Application Instances deleted successfully"
		appType        = "byo"
	)

	var request struct {
		InstanceIDs []string `json:"instanceIDs" validate:"required,min=1,dive"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}
	validate := validator.New()
	if err := validate.Struct(request); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Validation error: %s", err))
		return
	}

	flag, err := GetFlagStatus(db, DeleteInstanceByo)
	if err != nil {
		log.Println(err)
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}

	vpcService := GetVPCService()

	if flag == true {
		SendErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Instance for %s in progress", appType), "")
		return
	}
	SetFlag(db, DeleteInstanceByo)

	err = DeleteInstance(db, vpcService, request.InstanceIDs, DeleteInstanceByo, appType)
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

// ===================================Presto=====================================
// ------------------API for create instance based on the application name----------
func CreateInstancePresto(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const (
		appType        = "presto"
		failedMessage  = "Presto failed to create instances."
		successMessage = "Presto instances created successfully"
	)

	count, err := CheckInstancesExists(db, appType)
	if err != nil {
		log.Println(err)
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}
	if count != 0 {
		SendErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Instance for %s already running", appType), "")
		return
	}

	vpcService := GetVPCService()

	err = CheckAndSetFlagStatus(db, CreateInstancesPresto, appType)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("error setting flag status:%s", err))
		return
	}

	var req InstanceRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		ResetFlag(db, CreateInstancesPresto)
		return
	}

	instanceStatus, err := CreateInstance(db, vpcService, appType, CreateInstancesPresto, []string{}, InstProfile16CPU, PrestoInstaller, Presto, req)
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
		"status":  instanceStatus,
	})
}

// -------------------------------get instance for presto-----------------------
func GetInstancePresto(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const failedMessage = "Presto failed to list instances."

	createFlag, err := GetFlagStatus(db, CreateInstancesPresto)
	if err != nil {
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}

	deleteFlag, err := GetFlagStatus(db, DeleteInstancesPresto)
	if err != nil {
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}
	if createFlag == false && deleteFlag == false {
		WriteStatusUpdatesToDatabase(w, r, db)
	}

	vsiName := "sbox-presto-vm%"
	instances, ipAddresses, err := GetInstanceDetails(db, vsiName)
	if err != nil {
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}

	// Respond with the list of instances
	if len(instances) == 2 && createFlag == true {

		findFileCommand := "find presto_runner_metrics.sh"
		apiName := CreateInstancesPresto
		err := GetInstallationStatus(db, ipAddresses, findFileCommand, apiName)
		if err != nil {
			log.Println(err)
			SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
			return
		}

		log.Println("Instances retrieved successfully")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"createFlag": createFlag,
			"deleteFlag": deleteFlag,
			"instances":  instances,
			"code":       http.StatusOK,
			"message":    "Instances retrieved successfully",
			"success":    true,
			"error":      nil,
		})
		return
	} else if len(instances) == 2 && createFlag == false {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"createFlag": createFlag,
			"deleteFlag": deleteFlag,
			"instances":  instances,
			"code":       http.StatusOK,
			"message":    "Instances retrieved successfully",
			"success":    true,
			"error":      nil,
		})
		return
	} else if len(instances) == 1 && createFlag == false {

		vpcService := GetVPCService()

		var instanceIDs []string
		instanceIDs = append(instanceIDs, instances[0].ID)
		err := DeleteInstance(db, vpcService, instanceIDs, CreateInstancesPresto, "presto")
		if err != nil {
			log.Println(err)
			SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprintf("Error deleting instance: %s", err))
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"createFlag": createFlag,
			"deleteFlag": deleteFlag,
			"instances":  []Instance{},
			"code":       http.StatusOK,
			"message":    "Instances creation failed for the application, please check the ibm cloud console",
			"success":    false,
			"error":      nil,
		})
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{
		"createFlag": createFlag,
		"deleteFlag": deleteFlag,
		"instances":  []Instance{},
		"code":       http.StatusOK,
		"message":    "No instances found",
		"success":    true,
		"error":      nil,
	})
}

// ------------------API for deleting instance based on instance id-----------------
func DeleteInstancePresto(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const (
		failedMessage  = "Presto failed to delete instances."
		successMessage = "Presto Instances deleted successfully"
		appType        = "presto"
	)

	var request struct {
		InstanceIDs []string `json:"instanceIDs" validate:"required,min=1,dive"`
	}

	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprint(err))
		return
	}
	validate := validator.New()
	if err := validate.Struct(request); err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Validation error: %s", err))
		return
	}

	vpcService := GetVPCService()

	flag, err := GetFlagStatus(db, DeleteInstancesPresto)
	if err != nil {
		log.Println(err)
		SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
		return
	}
	if flag == true {
		SendErrorResponse(w, http.StatusBadRequest, fmt.Sprintf("Instance for %s in progress", appType), "")
		return
	}
	SetFlag(db, DeleteInstancesPresto)

	err = DeleteInstance(db, vpcService, request.InstanceIDs, DeleteInstancesPresto, appType)
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

// ===============================List All Instances================================
// -------------------------------API for listing instance--------------------------
func GetAllInstances(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	const failedMessage = "Failed to list all instances."

	WriteStatusUpdatesToDatabase(w, r, db)

	// Execute the SQL query to retrieve instances with delete_bit = 0
	rows, err := db.Query(`SELECT id, vsi_name, vsi_profile, 
		ip_address, vsi_status, createtime, delete_bit,app_name 
		FROM vsi_info WHERE delete_bit = '0' ORDER BY createtime DESC`)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Error querying database: %s", err))
		return
	}
	defer rows.Close()

	// Create a slice to hold instances
	var instances []Instance
	for rows.Next() {
		var instance Instance
		err := rows.Scan(&instance.ID, &instance.VSIName, &instance.VSIProfile, &instance.IPAddress,
			&instance.VSIStatus, &instance.CreateTime, &instance.DeleteBit, &instance.AppName)
		if err != nil {
			SendErrorResponse(w, http.StatusBadRequest, failedMessage, fmt.Sprintf("Error scanning row: %s", err))
			return
		}
		instances = append(instances, instance)
	}

	if len(instances) > 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"instances": instances,
			"code":      http.StatusOK,
			"message":   "Instances retrieved successfully",
			"success":   true,
			"error":     nil,
		})
	} else {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"instances": []Instance{},
			"code":      http.StatusOK,
			"message":   "No instances found",
			"success":   true,
			"error":     nil,
		})
	}
}

// -------------------------------------------Status Update-------------------------
func WriteStatusUpdatesToDatabase(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	w.Header().Set("Content-Type", "application/json")

	ids, err := GetActiveInstanceIDs(db)
	if err != nil {
		log.Printf("Error fetching active instance IDs: %s", err)
		return
	}

	instanceIDs, err := GetInstanceIDsFromVPC()
	if err != nil {
		log.Printf("Error fetching instance IDs from VPC: %s", err)
		return
	}

	for _, id := range ids {
		vsiname, appName, err := GetVSIInfoFromDB(db, id)
		if err != nil {
			log.Printf("Error fetching vsi name and app name for instance id %s: %s", id, err)
			continue
		}

		if !CheckVsiInCloud(instanceIDs, id) {
			_, err := db.Exec(`UPDATE vsi_info SET vsi_status='Deleted', delete_bit = 1 WHERE id=$1`, id)
			if err != nil {
				log.Printf("Error updating vsi_status in the database instance id %s: %s", id, err)
				continue
			}

			_, err = db.Exec(`UPDATE benchmark_status SET run_status ='Deleted' WHERE vsi_name = $1`, vsiname)
			if err != nil {
				log.Printf("Failed to update status for instances vsiname %s: %s", vsiname, err)
				continue
			}

			switch appName {
			case MonteCarlo:
				_, err = db.Exec(`UPDATE montecarlo SET delete_bit =1  WHERE instance_id = $1`, id)
				ResetFlag(db, CreateInstanceMontecarlo)
				ResetFlag(db, RunBenchmarkMontecarlo)
			case HuggingFace:
				_, err = db.Exec(`UPDATE huggingface SET delete_bit =1  WHERE instance_id = $1`, id)
				ResetFlag(db, CreateInstanceHuggingface)
				ResetFlag(db, RunBenchmarkHuggingface)
			case BYO:
				_, err = db.Exec(`UPDATE byo SET delete_bit = 1 WHERE instance_id = $1`, id)
				ResetFlag(db, CreateInstanceByo)
				ResetFlag(db, RunBenchmarkByo)
				ResetFlag(db, RunByoPolling)
			case Presto:
				_, err = db.Exec(`UPDATE presto SET delete_bit =1  WHERE instance_id = $1`, id)
				ResetFlag(db, CreateInstancesPresto)
				ResetFlag(db, RunBenchmarkPresto)
			}

			if err != nil {
				log.Printf("Error updating run_status in the database instance id %s: %s", id, err)
				continue
			}
		} else {
			vpcService := GetVPCService()

			options := &vpcv1.GetInstanceOptions{
				ID: &id,
			}

			instance, _, err := vpcService.GetInstance(options)
			if err != nil {
				log.Printf("Error getting instance:%s", err)
				continue
			}

			_, err = db.Exec(`UPDATE vsi_info SET vsi_status=$1 WHERE id =$2`, *instance.Status, id)
			if err != nil {
				log.Printf("Error updating vsi_status in the database:%s", err)
				continue
			}
		}
	}
}
