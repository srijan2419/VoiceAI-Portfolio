package service

import (
	"fmt"

	internal "github.com/srijanai/ai_voice/internal/logger"
	"github.com/srijanai/ai_voice/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type UserService struct {
	loginRepo *repository.LoginRepository
}

func NewUserService(loginRepo *repository.LoginRepository) *UserService {
	return &UserService{loginRepo: loginRepo}
}

func (s *UserService) CreateUser(username, password, fullname string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		internal.ErrorLogger.Println("Error hashing password:", err)
		return "", err
	}

	userID, err := s.loginRepo.CreateUser(username, string(hashedPassword), fullname)
	if err != nil {
		internal.ErrorLogger.Println("Error creating user:", err)
		return "", err
	}

	return userID, nil
}

func (s *UserService) Login(username, password string) (string, error) {
	// Get the user and hashed password from the repository
	userID, storedHash, err := s.loginRepo.GetUserByUsername(username)
	if err != nil {
		internal.ErrorLogger.Println("Error retrieving user:", err)
		return "", err
	}

	// Compare the provided password with the stored hash
	err = bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password))
	if err != nil {
		internal.ErrorLogger.Println("Invalid password attempt")
		return "", fmt.Errorf("invalid username or password")
	}

	return userID, nil
}

func (h *UserService) GetCallHistory(clientId string) (string, string, error) {

	accountSid, authToken, err := h.loginRepo.GetTwillioCred(clientId)
	if err != nil {
		return "", "", err
	}

	return accountSid, authToken, nil
}
