import React from 'react';
import { Alert, AlertTitle, Button, Collapse, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

interface GuidanceBannerProps {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
  onDismiss: (id: string) => void;
  visible: boolean;
  severity?: 'info' | 'success' | 'warning';
}

const GuidanceBanner: React.FC<GuidanceBannerProps> = ({
  id,
  title,
  description,
  actionLabel,
  onAction,
  onDismiss,
  visible,
  severity = 'info',
}) => {
  return (
    <Collapse in={visible}>
      <Alert
        severity={severity}
        icon={<LightbulbIcon fontSize="inherit" />}
        action={
          <IconButton
            aria-label="dismiss"
            color="inherit"
            size="small"
            onClick={() => onDismiss(id)}
          >
            <CloseIcon fontSize="inherit" />
          </IconButton>
        }
        sx={{
          mx: 1,
          mb: 1,
          mt: 1,
          '& .MuiAlert-message': { width: '100%' },
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <AlertTitle sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{title}</AlertTitle>
        <span style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>{description}</span>
        {onAction && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              onAction();
              onDismiss(id);
            }}
            sx={{
              mt: 1,
              display: 'block',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Alert>
    </Collapse>
  );
};

export default GuidanceBanner;
