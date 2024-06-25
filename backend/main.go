package main

import (
	"fmt"
	"log"
	"net/http"
	"os/user"
	"strconv"

	inst "github.com/IBM-Cloud/sandbox-benchmark-dashboard-for-vpc/internal"
)

func main() {
	currentUser, err := user.Current()
	if err != nil {
		log.Printf("Failed to get current user: %s", err)
	} else {
		log.Printf("Current user: %s", currentUser.Username)
	}

	handler := inst.Handler()
	APIPortStr, err := inst.GetEnvVariable(inst.APIPort)
	if err != nil {
		log.Println("failed to retrieve the URL from environment variable:", err)
		return
	}
	// Convert the API port string to an integer
	APIPort, err := strconv.Atoi(APIPortStr)
	if err != nil {
		log.Printf("API port must be an integer value: %s", APIPortStr)
		return
	}
	log.Printf("Application running on the port: %d", APIPort)
	log.Println(http.ListenAndServe(fmt.Sprintf(":%d", APIPort), handler))
}
