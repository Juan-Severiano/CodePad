package cron

import (
	"context"
	"fmt"

	"github.com/robfig/cron/v3"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type AgentTriggerFunc func(taskDescription string, model string) (string, error)

type Scheduler struct {
	ctx          context.Context
	cron         *cron.Cron
	agentTrigger AgentTriggerFunc
}

func NewScheduler(trigger AgentTriggerFunc) *Scheduler {
	c := cron.New()
	c.Start()
	return &Scheduler{
		cron:         c,
		agentTrigger: trigger,
	}
}

func (s *Scheduler) SetContext(ctx context.Context) {
	s.ctx = ctx
}

func (s *Scheduler) Schedule(expression string, scriptName string) error {
	_, err := s.cron.AddFunc(expression, func() {
		if s.ctx != nil {
			runtime.EventsEmit(s.ctx, "routine-started", scriptName)
			runtime.LogInfof(s.ctx, "Cron routine %s triggered", scriptName)
		}
		
		if s.agentTrigger != nil {
			// Invoca o agente simulando a execução autônoma
			s.agentTrigger(fmt.Sprintf("Execute routine: %s", scriptName), "Auto")
		}
	})

	if err != nil {
		return fmt.Errorf("invalid cron expression: %v", err)
	}

	return nil
}

func (s *Scheduler) Stop() {
	s.cron.Stop()
}
