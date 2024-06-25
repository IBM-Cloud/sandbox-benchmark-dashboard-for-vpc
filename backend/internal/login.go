package sandbox

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt"
	"golang.org/x/crypto/bcrypt"
)

// Login handles user authentication and generates JWT token upon successful login

func Login(w http.ResponseWriter, r *http.Request, db *sql.DB) {

	failedMessage := "Failed to Login"

	var login LoginDetails
	err := json.NewDecoder(r.Body).Decode(&login)
	if err != nil {
		SendErrorResponse(w, http.StatusBadRequest, "Invalid Input Syntax", "Invalid Input Syntax")
		return
	}

	if login.Username == "" || login.Password == "" {
		log.Println("Username/Password can't be empty")
		SendErrorResponse(w, http.StatusBadRequest, "Password is not valid", "Password is not valid")
		return
	}

	var hashedPassword string
	query := "SELECT password FROM users WHERE username = $1"
	err = db.QueryRow(query, login.Username).Scan(&hashedPassword)
	if err != nil {
		log.Println("Password is not valid")
		SendErrorResponse(w, http.StatusUnauthorized, "Password is not valid", "Password is not valid")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(login.Password)); err == nil {
		expirationTime := time.Now().Add(time.Minute * 90)
		claims := &Claims{
			Username: login.Username,
			StandardClaims: jwt.StandardClaims{
				ExpiresAt: expirationTime.Unix(),
			},
		}

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		tokenString, err := token.SignedString(mySigningKey)
		if err != nil {
			log.Printf("Error in generating JWT: %s", err)
			SendErrorResponse(w, http.StatusInternalServerError, failedMessage, fmt.Sprint(err))
			return
		}

		log.Println("Login Successful")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"code":     http.StatusOK,
			"token":    tokenString,
			"message":  "Login Successful",
			"success":  true,
			"username": login.Username,
		})
	} else {
		log.Println("Password is not valid")
		SendErrorResponse(w, http.StatusUnauthorized, "Password is not valid", "Password is not valid")
	}
}
