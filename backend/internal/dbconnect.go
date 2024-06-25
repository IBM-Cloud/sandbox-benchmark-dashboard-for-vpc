package sandbox

import (
	"database/sql"
	"fmt"
	"log"
	"time"
)

var stopSignal = make(chan struct{})

func DbConnect() (*sql.DB, error) {

	DbUsername, err := GetEnvVariable(DbUsername)
	if err != nil {
		log.Println(err)
		return nil, fmt.Errorf("DbUsername environment variable not set: %s", err)
	}
	DbPassword, err := GetEnvVariable(DbPassword)
	if err != nil {
		log.Println(err)
		return nil, fmt.Errorf("DbPassword environment variable not set: %s", err)
	}
	DbHost, err := GetEnvVariable(DbHost)
	if err != nil {
		log.Println(err)
		return nil, fmt.Errorf("DbHost environment variable not set: %s", err)
	}
	DbPort, err := GetEnvVariable(DbPort)
	if err != nil {
		log.Println(err)
		return nil, fmt.Errorf("DbPort environment variable not set: %s", err)
	}

	db, err := sql.Open("postgres", fmt.Sprintf("user=%s password=%s host=%s port=%s dbname=%s sslmode=disable",
		DbUsername, DbPassword, DbHost, DbPort, DbName))
	if err != nil {
		log.Println(err)
		return nil, fmt.Errorf("database Connection Failed: %s", err)
	}

	db.SetMaxOpenConns(MaxConnections)
	// Test the database connection
	err = db.Ping()
	if err != nil {
		log.Println(err)
		return nil, fmt.Errorf("unable to ping the Database Connection: %s", err)
	}

	go func() {
		defer close(stopSignal)
		for {
			select {
			case <-stopSignal:
				return
			default:
				stats := db.Stats()

				if stats.OpenConnections >= MaxConnections {
					db.Close()
					db, err = sql.Open("postgres", fmt.Sprintf("user=%s password=%s host=%s port=%s dbname=%s sslmode=disable",
						DbUsername, DbPassword, DbHost, DbPort, DbName))
					if err != nil {
						log.Println(err)
						return
					}
					db.SetMaxOpenConns(MaxConnections)
					log.Println("Database connection restarted")
				}
				time.Sleep(5 * time.Second)
			}
		}
	}()
	maxLifetime := time.Minute * 30

	db.SetConnMaxLifetime(maxLifetime)
	db.SetMaxIdleConns(MaxIdleConnections)

	return db, nil
}
