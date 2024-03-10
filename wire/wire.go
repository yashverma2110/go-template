//go:build wireinject
// +build wireinject

package wire

import (
	"database/sql"
	"flashcards/config"
	"flashcards/database"
	"flashcards/logger"
	"flashcards/resources"
	"flashcards/server"

	"github.com/google/wire"
)

func InitializeServer() (*server.Server, error) {
	wire.Build(
		server.NewServer,
		resources.NewGinEngine,
		logger.NewLogger,
	)
	return nil, nil // This return value will be filled by Wire
}

func InitializeDatabase() (*sql.DB, error) {
	wire.Build(database.NewDatabase, config.NewDatabaseConfig)
	return nil, nil
}
