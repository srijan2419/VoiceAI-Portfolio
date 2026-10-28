package routes

import (
	"database/sql"
	"net/http"

	"github.com/srijanai/ai_voice/internal/handler"
	"github.com/srijanai/ai_voice/internal/repository"
	"github.com/srijanai/ai_voice/internal/service"
)

// SetupRoutes configures all application routes
func SetupRoutes(db *sql.DB) http.Handler {
	// Initialize repositories
	loginRepo := repository.NewLoginRepository(db)

	// Initialize services
	userService := service.NewUserService(loginRepo)

	// Initialize handlers
	userHandler := handler.NewUserHandler(userService)

	// Create router (using standard http mux)
	mux := http.NewServeMux()

	// User routes
	mux.HandleFunc("/api/users/register", userHandler.CreateUser)
	mux.HandleFunc("/api/users/login", userHandler.Login)
	mux.HandleFunc("/api/users/call-history", userHandler.GetCallHistory)

	// Add middleware
	handler := corsMiddleware(mux)

	return handler
}

// corsMiddleware adds CORS headers to all responses
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Pass to next handler
		next.ServeHTTP(w, r)
	})
}
