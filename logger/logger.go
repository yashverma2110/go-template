package logger

import (
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// logger is the singleton instance of the Logger.
var logger *Logger

// Logger is a structure that holds the logger instance.
type Logger struct {
	Log *zap.Logger
}

// GetLogger returns the singleton instance of the logger.
func GetLogger() *Logger {
	return logger
}

// NewLogger creates a new logger instance.
func NewLogger() (*Logger, error) {
	return logger, nil
}

// init initializes the logger instance.
func init() {
	var zapLogger *zap.Logger
	var err error

	if os.Getenv("ENV") == "local" {
		config := zap.NewDevelopmentConfig()
		config.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
		zapLogger, err = config.Build()
	} else {
		zapLogger, err = zap.NewProduction()
	}

	if err != nil {
		panic(err)
	}

	defer zapLogger.Sync()

	logger = &Logger{Log: zapLogger}
}
