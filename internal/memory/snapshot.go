package memory

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"
)

const snapshotsDir = "/tmp/openagent_snapshots"

type SnapshotManager struct{}

func NewSnapshotManager() *SnapshotManager {
	os.MkdirAll(snapshotsDir, 0755)
	return &SnapshotManager{}
}

func (s *SnapshotManager) TakeSnapshot(filePath string) (string, error) {
	sourceFile, err := os.Open(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to open file %s: %w", filePath, err)
	}
	defer sourceFile.Close()

	// Cria hash do arquivo pra ID única
	hash := sha256.New()
	if _, err := io.Copy(hash, sourceFile); err != nil {
		return "", err
	}
	fileHash := hex.EncodeToString(hash.Sum(nil))
	
	// Adiciona timestamp para não sobrescrever caso seja o mesmo arquivo
	snapshotID := fmt.Sprintf("%s-%d", fileHash[:12], time.Now().UnixMilli())
	
	snapshotPath := filepath.Join(snapshotsDir, snapshotID+".backup")
	
	// Rebobina o source
	sourceFile.Seek(0, 0)
	
	destFile, err := os.Create(snapshotPath)
	if err != nil {
		return "", fmt.Errorf("failed to create snapshot file: %w", err)
	}
	defer destFile.Close()

	if _, err := io.Copy(destFile, sourceFile); err != nil {
		return "", err
	}

	return snapshotID, nil
}

func (s *SnapshotManager) RestoreSnapshot(filePath string, snapshotID string) error {
	snapshotPath := filepath.Join(snapshotsDir, snapshotID+".backup")
	
	sourceFile, err := os.Open(snapshotPath)
	if err != nil {
		return fmt.Errorf("failed to open snapshot %s: %w", snapshotID, err)
	}
	defer sourceFile.Close()

	destFile, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("failed to restore file %s: %w", filePath, err)
	}
	defer destFile.Close()

	if _, err := io.Copy(destFile, sourceFile); err != nil {
		return err
	}

	return nil
}
