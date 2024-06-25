package sandbox

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func GetMetaData(w http.ResponseWriter, r *http.Request) {

	accessToken, err := GetInstanceIdentityToken()
	if err != nil {
		log.Printf("Error getting instance identity token:%s", err)
		SendErrorResponse(w, http.StatusBadRequest, "Error getting instance identity token", fmt.Sprintf("Error getting instance identity token:%s", err))
		return
	}

	instanceMetadata, err := GetInstanceMetadata(accessToken)
	if err != nil {
		log.Printf("Error getting instance metadata:%s", err)
		SendErrorResponse(w, http.StatusBadRequest, "Error getting instance metadata", fmt.Sprintf("Error getting instance metadata:%s", err))
		return
	}

	var metadataMap map[string]interface{}

	err = json.Unmarshal([]byte(instanceMetadata), &metadataMap)
	if err != nil {
		log.Println("Error unmarshaling instance metadata")
		SendErrorResponse(w, http.StatusBadRequest, "Error unmarshaling instance metadata", fmt.Sprint(err))
		return
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"message": "Meta Data fetched successfully ", "data": metadataMap, "code": http.StatusOK, "success": true})

}
