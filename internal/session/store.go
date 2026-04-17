package session

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

type Message struct {
	Role      string    `json:"role"`      // "user" | "assistant"
	Content   string    `json:"content"`
	Timestamp time.Time `json:"timestamp"`
}

type Session struct {
	ID        string       `json:"id"`
	ProjectID string       `json:"project_id"`
	Title     string       `json:"title"`
	CreatedAt time.Time    `json:"created_at"`
	UpdatedAt time.Time    `json:"updated_at"`
	Messages  []Message    `json:"messages"`
	Status    string       `json:"status"` // "idle" | "running" | "done" | "error"
	Model     string       `json:"model"`
}

type Project struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	WorkingDir string `json:"working_dir"`
	CreatedAt  time.Time `json:"created_at"`
}

type Store struct {
	Projects   []Project            `json:"projects"`
	Sessions   map[string][]Session `json:"sessions"` // projectID -> sessions
	RecentDirs []string             `json:"recent_dirs"`
	filePath   string
}

var defaultStorePath = filepath.Join(os.Getenv("HOME"), ".codepad", "sessions.json")

func init() {
	home, err := os.UserHomeDir()
	if err == nil {
		defaultStorePath = filepath.Join(home, ".codepad", "sessions.json")
	}
}

func NewStore() (*Store, error) {
	store := &Store{
		Projects: []Project{},
		Sessions: make(map[string][]Session),
		filePath: defaultStorePath,
	}

	// Ensure directory exists
	dir := filepath.Dir(store.filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create codepad directory: %w", err)
	}

	// Load existing data
	if err := store.load(); err != nil && !os.IsNotExist(err) {
		return nil, fmt.Errorf("failed to load store: %w", err)
	}

	return store, nil
}

func (s *Store) load() error {
	data, err := os.ReadFile(s.filePath)
	if err != nil {
		return err
	}

	return json.Unmarshal(data, s)
}

func (s *Store) save() error {
	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.filePath, data, 0644)
}

func (s *Store) CreateProject(name, workingDir string) (Project, error) {
	proj := Project{
		ID:         uuid.New().String()[:8],
		Name:       name,
		WorkingDir: workingDir,
		CreatedAt:  time.Now(),
	}

	s.Projects = append(s.Projects, proj)
	s.Sessions[proj.ID] = []Session{}

	if err := s.save(); err != nil {
		return Project{}, err
	}

	return proj, nil
}

func (s *Store) DeleteProject(projectID string) error {
	for i, p := range s.Projects {
		if p.ID == projectID {
			s.Projects = append(s.Projects[:i], s.Projects[i+1:]...)
			delete(s.Sessions, projectID)
			return s.save()
		}
	}
	return fmt.Errorf("project not found")
}

func (s *Store) CreateSession(projectID, title string) (Session, error) {
	sessions, ok := s.Sessions[projectID]
	if !ok {
		return Session{}, fmt.Errorf("project not found")
	}

	sess := Session{
		ID:        uuid.New().String()[:8],
		ProjectID: projectID,
		Title:     title,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Messages:  []Message{},
		Status:    "idle",
		Model:     "claude-3-5-sonnet-20241022",
	}

	s.Sessions[projectID] = append(sessions, sess)

	if err := s.save(); err != nil {
		return Session{}, err
	}

	return sess, nil
}

func (s *Store) DeleteSession(sessionID string) error {
	for projID, sessions := range s.Sessions {
		for i, sess := range sessions {
			if sess.ID == sessionID {
				s.Sessions[projID] = append(sessions[:i], sessions[i+1:]...)
				return s.save()
			}
		}
	}
	return fmt.Errorf("session not found")
}

func (s *Store) GetSession(sessionID string) *Session {
	for _, sessions := range s.Sessions {
		for i, sess := range sessions {
			if sess.ID == sessionID {
				return &sessions[i]
			}
		}
	}
	return nil
}

func (s *Store) AppendMessage(sessionID, role, content string) error {
	for projID, sessions := range s.Sessions {
		for i, sess := range sessions {
			if sess.ID == sessionID {
				s.Sessions[projID][i].Messages = append(s.Sessions[projID][i].Messages, Message{
					Role:      role,
					Content:   content,
					Timestamp: time.Now(),
				})
				s.Sessions[projID][i].UpdatedAt = time.Now()
				return s.save()
			}
		}
	}
	return fmt.Errorf("session not found")
}

func (s *Store) SetSessionStatus(sessionID, status string) error {
	for projID, sessions := range s.Sessions {
		for i, sess := range sessions {
			if sess.ID == sessionID {
				s.Sessions[projID][i].Status = status
				s.Sessions[projID][i].UpdatedAt = time.Now()
				return s.save()
			}
		}
	}
	return fmt.Errorf("session not found")
}

func (s *Store) AddRecentDir(path string) {
	for i, d := range s.RecentDirs {
		if d == path {
			s.RecentDirs = append(s.RecentDirs[:i], s.RecentDirs[i+1:]...)
			break
		}
	}
	s.RecentDirs = append([]string{path}, s.RecentDirs...)
	if len(s.RecentDirs) > 10 {
		s.RecentDirs = s.RecentDirs[:10]
	}
	_ = s.save()
}

func (s *Store) GetRecentDirectories() []string {
	if s.RecentDirs == nil {
		return []string{}
	}
	return s.RecentDirs
}
