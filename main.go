package main

import (
	"flashcards/wire"
	"net/http"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	engine, _ := wire.InitializeServer()

	db, err := wire.InitializeDatabase()

	if err != nil {
		engine.Logger.Log.DPanic("Error initializing database: ", zap.Error(err))
	}

	defer db.Close()

	engine.Engine.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "Server is running",
		})
	})

	engine.Engine.Run(":8080")
}
