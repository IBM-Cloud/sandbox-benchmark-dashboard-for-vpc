package sandbox

import (
	"fmt"
	"log"
	"sync" // Import sync package for mutex

	"github.com/IBM/go-sdk-core/v5/core"
	"github.com/IBM/vpc-go-sdk/vpcv1"
)

var (
	vpcService *vpcv1.VpcV1
	err        error
	onceInit   sync.Once  // Use sync.Once for one-time initialization
	mutex      sync.Mutex // Use sync.Mutex for locking
)

// Fetch VPC service
func GetVPCService() *vpcv1.VpcV1 { //GetVPCService fetches VPC Service
	onceInit.Do(func() { // Use sync.Once to ensure initialization is done only once

		vpcService, err = newVPCService()
		if err != nil {
			log.Printf("Failed to Get VPC Service: %s", err)
			return
		}
	})
	mutex.Lock()
	defer mutex.Unlock()
	return vpcService
}

// New VPC Service
func newVPCService() (svc *vpcv1.VpcV1, err error) {
	trustedProfileID, err := GetEnvVariable(IAMTrustedProfileIDEnv) //use IAMTrustedProfileID to connect to VPC
	if err != nil {
		log.Printf("failed to get env variable %s", err)
		return nil, fmt.Errorf("failed to get env variable %s", err)
	}

	URL, err := GetVPCEndpoint()
	if err != nil {
		log.Printf("failed to get VPC Endpoint %s", err)
		return nil, fmt.Errorf("failed to get VPC Endpoint %s", err)
	}

	// Create the authenticator.
	authenticator, err := core.NewVpcInstanceAuthenticatorBuilder().
		SetIAMProfileID(trustedProfileID).Build()

	if err != nil {
		log.Printf("error during authenticating: %s", err)
		return
	}

	// Create VPC Service
	return vpcv1.NewVpcV1(&vpcv1.VpcV1Options{
		URL:           URL,
		Authenticator: authenticator,
	})
}
