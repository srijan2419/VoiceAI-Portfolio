package handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/srijanai/ai_voice/internal/models"
	"github.com/srijanai/ai_voice/internal/service"
)

type UserHandler struct {
	userService *service.UserService
}

func NewUserHandler(userService *service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var loginReq models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID, err := h.userService.CreateUser(loginReq.Username, loginReq.Password, loginReq.FullName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	loginResp := models.LoginResponse{
		Token: userID,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(loginResp)
}

func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var loginReq models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	userID, err := h.userService.Login(loginReq.Username, loginReq.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	loginResp := models.LoginResponse{
		Token: userID,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(loginResp)
}

func (h *UserHandler) GetCallHistory(w http.ResponseWriter, r *http.Request) {
	clientId := r.URL.Query().Get("clientId")

	// Get account SID and Auth Token for the given clientId
	accountSid, authToken, err := h.userService.GetCallHistory(clientId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Construct the URL to fetch all records
	url := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Calls.json?Direction=inbound&Status=completed&PageSize=10000000", accountSid)

	// Create new request
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Set authentication and headers
	req.SetBasicAuth(accountSid, authToken)
	req.Header.Set("Content-Type", "application/json")

	// Make the request
	httpClient := &http.Client{}
	resp, err := httpClient.Do(req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		errorBody, _ := io.ReadAll(resp.Body)
		http.Error(w, fmt.Sprintf("Failed to fetch call history: %d, Details: %s", resp.StatusCode, string(errorBody)), http.StatusInternalServerError)
		return
	}

	// Parse the Twilio response
	var twilioResponse struct {
		Calls []struct {
			Sid         string `json:"sid"`
			From        string `json:"from"`
			To          string `json:"to"`
			Direction   string `json:"direction"`
			Duration    string `json:"duration"`
			Status      string `json:"status"`
			StartTime   string `json:"start_time"`
			EndTime     string `json:"end_time"`
			DateCreated string `json:"date_created"`
		} `json:"calls"`
		Total int `json:"total"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&twilioResponse); err != nil {
		http.Error(w, fmt.Sprintf("Failed to decode response from Twilio: %v", err), http.StatusInternalServerError)
		return
	}

	// Transform the calls data
	transformedCalls := make([]map[string]interface{}, len(twilioResponse.Calls))
	for i, call := range twilioResponse.Calls {
		transformedCalls[i] = map[string]interface{}{
			"sid":         call.Sid,
			"from":        call.From,
			"to":          call.To,
			"direction":   call.Direction,
			"duration":    call.Duration,
			"status":      call.Status,
			"startTime":   call.StartTime,
			"endTime":     call.EndTime,
			"dateCreated": call.DateCreated,
		}
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"calls": transformedCalls,
		"total": twilioResponse.Total,
	})
}
