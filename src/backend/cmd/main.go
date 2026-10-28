package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/joho/godotenv"
	"github.com/srijanai/ai_voice/db"
	internal "github.com/srijanai/ai_voice/internal/logger"
	"github.com/srijanai/ai_voice/internal/routes"
)

func main() {
	internal.InitLogger()
	internal.InfoLogger.Println("Starting the application")

	if err := godotenv.Load(); err != nil {
		internal.ErrorLogger.Println("Error loading .env file:", err)
		return
	}

	dbName := os.Getenv("DB_NAME")
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASS")
	dbPort := os.Getenv("DB_PORT")
	dbHost := os.Getenv("DB_HOST")

	if err := db.InitDB(dbName, dbUser, dbPass, dbHost, dbPort); err != nil {
		internal.ErrorLogger.Println("Failed to initialize DB:", err)
		return
	}

	internal.InfoLogger.Println("DB connection established successfully")

	// Setup routes
	handler := routes.SetupRoutes(db.DB)

	// Get server port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start HTTP server
	addr := fmt.Sprintf(":%s", port)
	internal.InfoLogger.Printf("Server starting on port %s\n", port)

	if err := http.ListenAndServe(addr, handler); err != nil {
		internal.ErrorLogger.Fatalf("Server failed to start: %v", err)
	}
}
