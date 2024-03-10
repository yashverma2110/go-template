// Code generated by Wire. DO NOT EDIT.

//go:generate go run -mod=mod github.com/google/wire/cmd/wire
//go:build !wireinject
// +build !wireinject

package wire

import (
	"database/sql"
	"flashcards/config"
	"flashcards/database"
	"flashcards/logger"
	"flashcards/resources"
	"flashcards/server"
)

// Injectors from wire.go:

func InitializeServer() (*server.Server, error) {
	engine := resources.NewGinEngine()
	loggerLogger, err := logger.NewLogger()
	if err != nil {
		return nil, err
	}
	serverServer := server.NewServer(engine, loggerLogger)
	return serverServer, nil
}

func InitializeDatabase() (*sql.DB, error) {
	databaseConfig := config.NewDatabaseConfig()
	db, err := database.NewDatabase(databaseConfig)
	if err != nil {
		return nil, err
	}
	return db, nil
}