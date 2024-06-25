package sandbox

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	_ "github.com/lib/pq"
	"github.com/rs/cors"
)

func DbHandler(fn func(http.ResponseWriter, *http.Request, *sql.DB)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		db, dbErr := DbConnect()
		if dbErr != nil {
			log.Printf("Error in Database Connection: %s", dbErr)
			SendErrorResponse(w, http.StatusInternalServerError, "Error in Database Connection", fmt.Sprintf("Error in Database Connection: %s", dbErr))
			return
		}
		defer db.Close()
		fn(w, r, db)
	}
}

func Handler() http.Handler { //Handler contains the router connection and endpoints of the API

	router := mux.NewRouter()

	apiRouter := router.PathPrefix(APIVersion + APIPrefix).Subrouter()
	corsHandler := cors.New(cors.Options{
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders: []string{"Content-Type", "Authorization"},
	})
	handler := corsHandler.Handler(router)
	// -------------------Endpoint for Login------------------------------------
	apiRouter.HandleFunc("/login", TimeoutHandler(DbHandler(Login), Timeout)).Methods("POST")

	// =====================================Monte Carlo====================================
	// -------------------Endpoint for creating instance------------------------------------
	apiRouter.Handle("/create-montecarlo-instances", IsAuthorized(TimeoutHandler(DbHandler(CreateInstanceMonteCarlo), Timeout))).Methods("POST")

	// -------------------Endpoint for Listing of an Instance(Monte Carlo)--------------------
	apiRouter.Handle("/get-montecarlo-instances", IsAuthorized(TimeoutHandler(DbHandler(GetInstanceMonteCarlo), Timeout))).Methods("GET")

	// -------------------Endpoint for delete instance--------------------------------------
	apiRouter.Handle("/delete-montecarlo-instances", IsAuthorized(TimeoutHandler(DbHandler(DeleteInstanceMonteCarlo), Timeout))).Methods("DELETE")

	//-------------------Endpoint for Monte Carlo Benchmark----------------------------------------
	apiRouter.Handle("/run-montecarlo-benchmark", IsAuthorized(TimeoutHandler(DbHandler(RunMonteCarloBenchmark), Timeout))).Methods("POST")

	//-------------------Endpoint for listing Monte Carlo Benchmark---------------------------------
	apiRouter.Handle("/list-montecarlo-benchmark", IsAuthorized(TimeoutHandler(DbHandler(ListMonteCarloBenchmark), Timeout))).Methods("GET")

	// ===================================HuggingFace Application=================================
	// -------------------Endpoint for creating instance------------------------------------
	apiRouter.Handle("/create-huggingface-instances", IsAuthorized(TimeoutHandler(DbHandler(CreateInstanceHuggingFace), Timeout))).Methods("POST")

	// -------------------Endpoint for list instances --------------------------------------
	apiRouter.Handle("/get-huggingface-instances", IsAuthorized(TimeoutHandler(DbHandler(GetInstanceHuggingFace), Timeout))).Methods("GET")

	// -------------------Endpoint for delete instance--------------------------------------
	apiRouter.Handle("/delete-huggingface-instances", IsAuthorized(TimeoutHandler(DbHandler(DeleteInstanceHuggingFace), Timeout))).Methods("DELETE")

	//-------------------Endpoint for Huggingface Benchmark----------------------------------------
	apiRouter.Handle("/run-huggingface-benchmark", IsAuthorized(TimeoutHandler(DbHandler(RunHuggingFaceBenchmark), Timeout))).Methods("POST")

	//-------------------Endpoint for listing Huggingface Benchmark---------------------------------
	apiRouter.Handle("/list-huggingface-benchmark", IsAuthorized(TimeoutHandler(DbHandler(ListHuggingFaceBenchmark), Timeout))).Methods("GET")

	// ======================================BYOA=======================================
	// -------------------Endpoint for creation of an Instance(BYOA)----------------------------
	apiRouter.Handle("/create-byo-instances", IsAuthorized(TimeoutHandler(DbHandler(CreateInstanceBYO), Timeout))).Methods("POST")
	// -------------------Endpoint for Listing  of an Instance(BYOA)------------------------------
	apiRouter.Handle("/get-byo-instances", IsAuthorized(TimeoutHandler(DbHandler(GetInstanceBYO), Timeout))).Methods("GET")

	// -------------------Endpoint for Deletion of an Instance(BYOA)------------------------------
	apiRouter.Handle("/delete-byo-instances", IsAuthorized(TimeoutHandler(DbHandler(DeleteInstanceBYO), Timeout))).Methods("DELETE")

	// ---------------------------Endpoint for Run BYO Application-----------------------------------
	apiRouter.Handle("/run-byo-benchmark", IsAuthorized(TimeoutHandler(DbHandler(RunBYOBenchmark), Timeout))).Methods("POST")

	// ---------------------------Endpoint for List BYO runner-----------------------------------
	apiRouter.Handle("/list-byo-benchmark", IsAuthorized(TimeoutHandler(DbHandler(ListBYOBenchmark), Timeout))).Methods("GET")

	// ---------------------------Endpoint for List BYO runner-----------------------------------
	apiRouter.Handle("/byopolling", IsAuthorized(TimeoutHandler(DbHandler(RunBYOPolling), Timeout))).Methods("GET")

	// ======================================Presto=======================================
	// -------------------Endpoint for creation of an Instances(Presto)----------------------------
	apiRouter.Handle("/create-presto-instances", IsAuthorized(TimeoutHandler(DbHandler(CreateInstancePresto), Timeout))).Methods("POST")

	// -------------------Endpoint for Listing  of an Instances(Presto)----------------------------
	apiRouter.Handle("/get-presto-instances", IsAuthorized(TimeoutHandler(DbHandler(GetInstancePresto), Timeout))).Methods("GET")

	// -------------------Endpoint for Deletion of an Instances(Presto)----------------------------
	apiRouter.Handle("/delete-presto-instances", IsAuthorized(TimeoutHandler(DbHandler(DeleteInstancePresto), Timeout))).Methods("DELETE")

	//-------------------Endpoint for Presto Benchmark---------------------------------------------
	apiRouter.Handle("/run-presto-benchmark", IsAuthorized(TimeoutHandler(DbHandler(RunPrestoBenchmark), Timeout))).Methods("POST")

	//-------------------Endpoint for Presto Benchmark Status-----------------------------------------
	apiRouter.Handle("/get-presto-benchmark-status", IsAuthorized(TimeoutHandler(DbHandler(GetPrestoBenchmarkStatus), Timeout))).Methods("GET")

	//-------------------Endpoint for listing Presto Benchmark-------------------------------------
	apiRouter.Handle("/list-presto-benchmark", IsAuthorized(TimeoutHandler(DbHandler(ListPrestoBenchmark), Timeout))).Methods("GET")

	//===============================General APIs=======================================
	// -------------------Endpoint for list instances --------------------------------------
	apiRouter.Handle("/get-all-instances", IsAuthorized(TimeoutHandler(DbHandler(GetAllInstances), Timeout))).Methods("POST")

	// -------------------Endpoint for Listing Benchmark Logs--------------------------------
	apiRouter.Handle("/listlogs", IsAuthorized(TimeoutHandler(DbHandler(GetLogs), Timeout))).Methods("POST")

	// -------------------Endpoint for Listing Metadata of an Instance-------------------------
	apiRouter.Handle("/getmetadata", IsAuthorized(TimeoutHandler(func(w http.ResponseWriter, r *http.Request) {
		GetMetaData(w, r)
	}, Timeout))).Methods("GET")

	// ---------------------------Endpoint for Update Status-----------------------------------
	apiRouter.Handle("/statusupdate", IsAuthorized(TimeoutHandler(DbHandler(WriteStatusUpdatesToDatabase), Timeout))).Methods("GET")

	// ---------------------------Endpoint for Downloading Logs-----------------------------------
	apiRouter.Handle("/download-logs", IsAuthorized(TimeoutHandler(func(w http.ResponseWriter, r *http.Request) {
		DownloadLogs(w, r)
	}, Timeout))).Methods("GET")

	// ---------------------------Endpoint for Resetting Benchmark-----------------------------------
	apiRouter.Handle("/reset-benchmark", IsAuthorized(TimeoutHandler(DbHandler(ResetBenchmark), Timeout))).Methods("POST")

	return handler
}
