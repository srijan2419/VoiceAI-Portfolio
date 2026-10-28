package models

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
}

type LoginResponse struct {
	Token string `json:"token"`
}
