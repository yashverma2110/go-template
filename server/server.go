package server

import (
	"flashcards/logger"

	"github.com/gin-gonic/gin"
)

type Server struct {
	Engine *gin.Engine
	Logger *logger.Logger
}

// NewServer creates a new instance of Server with the provided dependencies.
func NewServer(engine *gin.Engine, logger *logger.Logger) *Server {
	return &Server{
		Engine: engine,
		Logger: logger,
	}
}
