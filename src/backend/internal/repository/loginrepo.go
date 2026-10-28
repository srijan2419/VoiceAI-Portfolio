package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
)

type LoginRepository struct {
	db *sql.DB
}

func NewLoginRepository(db *sql.DB) *LoginRepository {
	return &LoginRepository{db: db}
}

func (r *LoginRepository) CreateUser(username, password, fullname string) (string, error) {
	query := `INSERT INTO users (username, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id`

	row := r.db.QueryRowContext(context.Background(), query, username, password, fullname)

	var id int
	err := row.Scan(&id)
	if err != nil {
		return "", err
	}

	return strconv.Itoa(id), nil
}

func (r *LoginRepository) Login(username, password string) (string, error) {
	// This method is now deprecated - password checking should be done in the service layer
	// Get the user ID and password hash
	userID, _, err := r.GetUserByUsername(username)
	if err != nil {
		return "", err
	}

	return userID, nil
}

func (r *LoginRepository) GetUserByUsername(username string) (string, string, error) {
	query := `SELECT id, password_hash FROM users WHERE username = $1`

	row := r.db.QueryRowContext(context.Background(), query, username)

	var id int
	var storedHash string
	err := row.Scan(&id, &storedHash)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", "", fmt.Errorf("invalid username")
		}
		return "", "", err
	}

	return strconv.Itoa(id), storedHash, nil
}

func (r *LoginRepository) GetTwillioCred(clientId string) (string, string, error) {
	query := `SELECT account_sid, auth_token FROM twillio_cred WHERE id = $1`

	row := r.db.QueryRowContext(context.Background(), query, clientId)

	var accountSid string
	var authToken string
	err := row.Scan(&accountSid, &authToken)
	if err != nil {
		return "", "", err
	}

	return accountSid, authToken, nil
}
