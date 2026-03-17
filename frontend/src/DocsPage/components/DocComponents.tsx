import React from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { ContentCopy, CheckCircle, Info, Warning, Error as ErrorIcon } from "@mui/icons-material";

/* -------------------------------------------------------------------------- */
/*                                 DocHeader                                  */
/* -------------------------------------------------------------------------- */

interface DocHeaderProps {
  level: 1 | 2 | 3;
  id: string;
  children: React.ReactNode;
}

export const DocHeader: React.FC<DocHeaderProps> = ({ level, id, children }) => {
  const styles = {
    1: { fontSize: "2.5rem", fontWeight: 700, margin: "10px 0", letterSpacing: "-0.02em" },
    2: { fontSize: "1.75rem", fontWeight: 600, margin: "48px 0 16px", letterSpacing: "-0.01em", scrollMarginTop: "80px" },
    3: { fontSize: "1.25rem", fontWeight: 600, margin: "32px 0 12px", letterSpacing: "-0.01em", scrollMarginTop: "80px" },
  };

  const Component = `h${level}` as React.ElementType;

  return (
    <Component id={id} style={{ fontFamily: "'Inter', sans-serif", ...styles[level] }}>
      {children}
    </Component>
  );
};

/* -------------------------------------------------------------------------- */
/*                                DocCodeBlock                                */
/* -------------------------------------------------------------------------- */

interface DocCodeBlockProps {
  code: string;
}

export const DocCodeBlock: React.FC<DocCodeBlockProps> = ({ code }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box sx={{ position: "relative", mt: 2, mb: 2 }}>
      <pre
        style={{
          whiteSpace: "pre",
          overflowX: "auto",
          backgroundColor: "#000000",
          color: "#f8f9fa",
          padding: "16px 20px",
          borderRadius: "8px",
          fontSize: "0.875rem",
          margin: 0,
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          fontFamily: "'Source Code Pro', monospace",
        }}
      >
        {code}
      </pre>
      <IconButton
        onClick={handleCopy}
        size="small"
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
          color: "#9ca3af",
          "&:hover": { color: "#f9fafb" },
        }}
      >
        {copied ? <CheckCircle sx={{ fontSize: "1rem" }} /> : <ContentCopy sx={{ fontSize: "1rem" }} />}
      </IconButton>
    </Box>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  DocText                                   */
/* -------------------------------------------------------------------------- */

export const DocText: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography sx={{ fontFamily: "'Inter', sans-serif", lineHeight: 1.6, color: "#374151", mb: 2 }}>
    {children}
  </Typography>
);

/* -------------------------------------------------------------------------- */
/*                                  DocLink                                   */
/* -------------------------------------------------------------------------- */

export const DocLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} style={{ fontFamily: "'Inter', sans-serif", color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>
    {children}
  </a>
);

/* -------------------------------------------------------------------------- */
/*                                 DocCallout                                 */
/* -------------------------------------------------------------------------- */

interface DocCalloutProps {
  type: "info" | "warning" | "error";
  children: React.ReactNode;
}

export const DocCallout: React.FC<DocCalloutProps> = ({ type, children }) => {
  const config = {
    info: { color: "#2563eb", bgcolor: "#eff6ff", icon: <Info sx={{ color: "#3b82f6", mt: 0.25 }} /> },
    warning: { color: "#d97706", bgcolor: "#fffbeb", icon: <Warning sx={{ color: "#f59e0b", mt: 0.25 }} /> },
    error: { color: "#dc2626", bgcolor: "#fef2f2", icon: <ErrorIcon sx={{ color: "#ef4444", mt: 0.25 }} /> },
  };

  const { color, bgcolor, icon } = config[type];

  return (
    <Box sx={{ display: "flex", p: 2, mb: 2, borderRadius: "8px", bgcolor, borderLeft: `4px solid ${color}` }}>
      <Box sx={{ mr: 1.5 }}>{icon}</Box>
      <Box sx={{ fontFamily: "'Inter', sans-serif", color: "#374151", fontSize: "0.875rem", lineHeight: 1.5 }}>
        {children}
      </Box>
    </Box>
  );
};

/* -------------------------------------------------------------------------- */
/*                                  DocList                                   */
/* -------------------------------------------------------------------------- */

export const DocList: React.FC<{ children: React.ReactNode; ordered?: boolean }> = ({ children, ordered = false }) => {
  const Component = ordered ? "ol" : "ul";
  return (
    <Component style={{ fontFamily: "'Inter', sans-serif", lineHeight: 1.6, color: "#374151", marginBottom: "16px", paddingLeft: "24px" }}>
      {children}
    </Component>
  );
};

export const DocListItem: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li style={{ marginBottom: "8px" }}>{children}</li>
);

export const DocInlineCode: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code
    style={{
      fontFamily: "'Source Code Pro', monospace",
      fontSize: "0.875rem",
      backgroundColor: "#f3f4f6",
      color: "#111827",
      padding: "3px 6px",
      borderRadius: "6px",
      fontWeight: 500,
    }}
  >
    {children}
  </code>
);
