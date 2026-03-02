import React from 'react';
import {
  Stepper,
  Step,
  StepLabel,
  StepButton,
  Paper,
  Typography,
  Collapse,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { WORKFLOW_STEPS, GuidanceConditionState } from './guidanceConfig';
import { useGuidanceContext } from './GuidanceContext';

interface WorkflowStepperProps {
  conditionState: GuidanceConditionState;
  onStepClick?: (stepId: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
}

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  conditionState,
  onStepClick,
  visible,
  onToggleVisibility,
}) => {
  const { isStepComplete } = useGuidanceContext();

  const isComplete = (step: typeof WORKFLOW_STEPS[number]) =>
    step.isComplete(conditionState) || isStepComplete(step.id);

  const requiredSteps = WORKFLOW_STEPS.filter((s) => !s.optional);
  const activeStepIndex = WORKFLOW_STEPS.findIndex((step) => !step.optional && !isComplete(step));

  const completedCount = requiredSteps.filter(isComplete).length;

  return (
    <Paper
      elevation={0}
      sx={{
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#fafbfc',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          pt: 1.5,
          pb: 1.5,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={onToggleVisibility}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, overflow: 'hidden' }}>
          <HelpOutlineIcon sx={{ fontSize: 16, color: '#1976d2', flexShrink: 0 }} />
          <Typography variant="caption" sx={{ color: '#555', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Workflow Guide
            {!visible && activeStepIndex >= 0 && (
              <span style={{ fontWeight: 400, marginLeft: 8 }}>
                — Next: {WORKFLOW_STEPS[activeStepIndex].label}
              </span>
            )}
            {!visible && activeStepIndex === -1 && (
              <span style={{ fontWeight: 400, marginLeft: 8, color: '#4caf50' }}>
                — All steps complete!
              </span>
            )}
          </Typography>
          <Typography variant="caption" sx={{ color: '#888', ml: 1 }}>
            ({completedCount}/{requiredSteps.length})
          </Typography>
        </Box>
        <IconButton size="small" tabIndex={-1} sx={{ flexShrink: 0, ml: 0.5 }}>
          {visible
            ? <KeyboardArrowUpIcon fontSize="small" />
            : <KeyboardArrowDownIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Collapse in={visible}>
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Stepper
            activeStep={activeStepIndex === -1 ? WORKFLOW_STEPS.length : activeStepIndex}
            alternativeLabel
            nonLinear
            sx={{
              '& .MuiStepLabel-label': { fontSize: '0.7rem' },
              '& .MuiStepIcon-root': { fontSize: '1.2rem' },
            }}
          >
            {WORKFLOW_STEPS.map((step) => {
              const completed = isComplete(step);
              const iconColor = completed ? '#4caf50' : step.optional ? 'rgba(25,118,210,0.4)' : '#bbb';
              return (
                <Step key={step.id} completed={completed}>
                  <Tooltip title={step.description} arrow placement="bottom">
                    <StepButton onClick={(e) => { e.stopPropagation(); onStepClick?.(step.id); }}>
                      <StepLabel
                        optional={step.optional && !completed ? (
                          <Typography variant="caption" sx={{ color: '#90a4ae', lineHeight: 1 }}>
                            (optional)
                          </Typography>
                        ) : undefined}
                        StepIconComponent={() =>
                          completed ? (
                            <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
                          ) : (
                            <RadioButtonUncheckedIcon sx={{ color: iconColor, fontSize: 20 }} />
                          )
                        }
                      >
                        {step.label}
                      </StepLabel>
                    </StepButton>
                  </Tooltip>
                </Step>
              );
            })}
          </Stepper>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default WorkflowStepper;
