package tools

import "errors"

var (
	ErrToolNotFound = errors.New("tool not found")
	ErrInvalidInput = errors.New("invalid input for tool")
)
