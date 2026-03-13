// DocsPage.tsx
import React from "react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { MuiMarkdown, defaultOverrides } from "mui-markdown";
import {
  Box,
  CssBaseline,
  Drawer,
  Toolbar,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  AppBar,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  InputAdornment,
  Typography,
} from "@mui/material";
import {
  ExpandLess, ExpandMore, Menu as MenuIcon,
  Article, PlayArrow, QuestionAnswer, SupportAgent,
  Login, Dashboard, Visibility, AutoFixHigh, Edit,
  GetApp, TableChart, Event, Save, CheckCircle, FormatAlignJustify, Person,
  Search as SearchIcon, ContentCopy
} from "@mui/icons-material";
import { SelectChangeEvent } from "@mui/material/Select";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import LogoImg from "../assets/images/logo.png";
import Footer from "../HomePage/components/Footer";

/* -------------------------------------------------------------------------- */
/*                               Version assets                               */
/* -------------------------------------------------------------------------- */


// --- Generated Imports (v3.3) ---
import OverviewV33, { toc as toc33Overview, searchContent as search33Overview } from "./pages/v3.3/Overview";

// --- Generated Imports (v3.1) ---
import OverviewV31, { toc as toc31Overview, searchContent as search31Overview } from "./pages/v3.1/Overview";
import InstallationV31, { toc as toc31Installation, searchContent as search31Installation } from "./pages/v3.1/Installation";
import QuickstartV31, { toc as toc31Quickstart, searchContent as search31Quickstart } from "./pages/v3.1/Quickstart";
import LoginSignupV31, { toc as toc31LoginSignup, searchContent as search31LoginSignup } from "./pages/v3.1/Login-signup";
import DocumentManagementV31, { toc as toc31DocumentManagement, searchContent as search31DocumentManagement } from "./pages/v3.1/Document-management";
import FilteringFunctionV31, { toc as toc31FilteringFunction, searchContent as search31FilteringFunction } from "./pages/v3.1/Filtering-function";
import EditingFunctionV31, { toc as toc31EditingFunction, searchContent as search31EditingFunction } from "./pages/v3.1/Editing-function";
import DownloadFunctionV31, { toc as toc31DownloadFunction, searchContent as search31DownloadFunction } from "./pages/v3.1/Download-function";
import ResultVisualizationV31, { toc as toc31ResultVisualization, searchContent as search31ResultVisualization } from "./pages/v3.1/Result-visualization";
import SaveCheckpointV31, { toc as toc31SaveCheckpoint, searchContent as search31SaveCheckpoint } from "./pages/v3.1/Save‑checkpoint";
import ConfirmAnnotationV31, { toc as toc31ConfirmAnnotation, searchContent as search31ConfirmAnnotation } from "./pages/v3.1/Confirm‑annotation";
import ParagraphSelectionV31, { toc as toc31ParagraphSelection, searchContent as search31ParagraphSelection } from "./pages/v3.1/Paragraph‑selection";
import PersonalInformationUpdateV31, { toc as toc31PersonalInformationUpdate, searchContent as search31PersonalInformationUpdate } from "./pages/v3.1/Personal-information-update";
import FaqV31, { toc as toc31Faq, searchContent as search31Faq } from "./pages/v3.1/Faq";
import ContactSupportV31, { toc as toc31ContactSupport, searchContent as search31ContactSupport } from "./pages/v3.1/Contact-support";
import LlmExtractionV31, { toc as toc31LlmExtraction, searchContent as search31LlmExtraction } from "./pages/v3.1/Llm-extraction";
import TablesV31, { toc as toc31Tables, searchContent as search31Tables } from "./pages/v3.1/Tables";
import EventsV31, { toc as toc31Events, searchContent as search31Events } from "./pages/v3.1/Events";
import WorkflowGuideV31, { toc as toc31WorkflowGuide, searchContent as search31WorkflowGuide } from "./pages/v3.1/Workflow-guide";

// --- Generated Imports (v3.0) ---
import OverviewV30, { toc as toc30Overview, searchContent as search30Overview } from "./pages/v3.0/Overview";
import InstallationV30, { toc as toc30Installation, searchContent as search30Installation } from "./pages/v3.0/Installation";
import QuickstartV30, { toc as toc30Quickstart, searchContent as search30Quickstart } from "./pages/v3.0/Quickstart";
import LoginSignupV30, { toc as toc30LoginSignup, searchContent as search30LoginSignup } from "./pages/v3.0/Login-signup";
import DocumentManagementV30, { toc as toc30DocumentManagement, searchContent as search30DocumentManagement } from "./pages/v3.0/Document-management";
import FilteringFunctionV30, { toc as toc30FilteringFunction, searchContent as search30FilteringFunction } from "./pages/v3.0/Filtering-function";
import EditingFunctionV30, { toc as toc30EditingFunction, searchContent as search30EditingFunction } from "./pages/v3.0/Editing-function";
import DownloadFunctionV30, { toc as toc30DownloadFunction, searchContent as search30DownloadFunction } from "./pages/v3.0/Download-function";

// --- Generated Imports (v2.0) ---
import OverviewV20, { toc as toc20Overview, searchContent as search20Overview } from "./pages/v2.0/Overview";

/* -------------------------------------------------------------------------- */

/*                                   Config                                   */
/* -------------------------------------------------------------------------- */

const drawerWidth = 260;
const versions = ["v3.3", "v3.2", "v3.1", "v3.0", "v2.0"] as const;

type DocsTree = {
  [section: string]: {
    title: string;
    pages: {
      [page: string]: {
        title: string;
        md?: string;
        Component?: React.FC;
        toc?: Array<{ id: string, title: string, level: number }>;
        searchContent?: string;
      };
    };
  };
};

/** Docs tree per‑version */
const docsByVersion: Record<(typeof versions)[number], DocsTree> = {
  // ── v3.3: current release ──
  "v3.3": {
    "getting-started": {
      title: "Getting started",
      pages: {
        overview: { title: "Overview", Component: OverviewV33, toc: toc33Overview, searchContent: search33Overview },
        installation: { title: "Installation", Component: InstallationV31, toc: toc31Installation, searchContent: search31Installation },
        quickstart: { title: "Quickstart", Component: QuickstartV31, toc: toc31Quickstart, searchContent: search31Quickstart },
        faq: { title: "Frequently Asked Questions", Component: FaqV31, toc: toc31Faq, searchContent: search31Faq },
        support: { title: "Contact Support", Component: ContactSupportV31, toc: toc31ContactSupport, searchContent: search31ContactSupport },
      },
    },
    features: {
      title: "Detailed instructions",
      pages: {
        login: { title: "Login & Signup", Component: LoginSignupV31, toc: toc31LoginSignup, searchContent: search31LoginSignup },
        dashboard: { title: "Document Management", Component: DocumentManagementV31, toc: toc31DocumentManagement, searchContent: search31DocumentManagement },
        result_visualization: { title: "Result Visualization", Component: ResultVisualizationV31, toc: toc31ResultVisualization, searchContent: search31ResultVisualization },
        workflow_guide: { title: "Workflow Guide", Component: WorkflowGuideV31, toc: toc31WorkflowGuide, searchContent: search31WorkflowGuide },
        filtering: { title: "Filtering Results", Component: FilteringFunctionV31, toc: toc31FilteringFunction, searchContent: search31FilteringFunction },
        editing: { title: "Editing Annotations", Component: EditingFunctionV31, toc: toc31EditingFunction, searchContent: search31EditingFunction },
        llm_extraction: { title: "LLM Extraction", Component: LlmExtractionV31, toc: toc31LlmExtraction, searchContent: search31LlmExtraction },
        tables: { title: "Tables Mode", Component: TablesV31, toc: toc31Tables, searchContent: search31Tables },
        events: { title: "Events Mode", Component: EventsV31, toc: toc31Events, searchContent: search31Events },
        save_checkpoints: { title: "Save Checkpoints", Component: SaveCheckpointV31, toc: toc31SaveCheckpoint, searchContent: search31SaveCheckpoint },
        confirm_annotations: { title: "Confirm Annotations", Component: ConfirmAnnotationV31, toc: toc31ConfirmAnnotation, searchContent: search31ConfirmAnnotation },
        paragraph_selection: { title: "Paragraph Selection", Component: ParagraphSelectionV31, toc: toc31ParagraphSelection, searchContent: search31ParagraphSelection },
        download: { title: "Export Results", Component: DownloadFunctionV31, toc: toc31DownloadFunction, searchContent: search31DownloadFunction },
        personalization: { title: "Personal Information Update", Component: PersonalInformationUpdateV31, toc: toc31PersonalInformationUpdate, searchContent: search31PersonalInformationUpdate },
      },
    },
  },

  // ── v3.2: similar to v3.1, without Guided UX pages ──
  "v3.2": {
    "getting-started": {
      title: "Getting started",
      pages: {
        overview: { title: "Overview", Component: OverviewV31, toc: toc31Overview, searchContent: search31Overview },
        installation: { title: "Installation", Component: InstallationV31, toc: toc31Installation, searchContent: search31Installation },
        quickstart: { title: "Quickstart", Component: QuickstartV31, toc: toc31Quickstart, searchContent: search31Quickstart },
        faq: { title: "Frequently Asked Questions", Component: FaqV31, toc: toc31Faq, searchContent: search31Faq },
        support: { title: "Contact Support", Component: ContactSupportV31, toc: toc31ContactSupport, searchContent: search31ContactSupport },
      },
    },
    features: {
      title: "Detailed instructions",
      pages: {
        login: { title: "Login & Signup", Component: LoginSignupV31, toc: toc31LoginSignup, searchContent: search31LoginSignup },
        dashboard: { title: "Document Management", Component: DocumentManagementV31, toc: toc31DocumentManagement, searchContent: search31DocumentManagement },
        result_visualization: { title: "Result Visualization", Component: ResultVisualizationV31, toc: toc31ResultVisualization, searchContent: search31ResultVisualization },
        filtering: { title: "Filtering Results", Component: FilteringFunctionV31, toc: toc31FilteringFunction, searchContent: search31FilteringFunction },
        editing: { title: "Editing Annotations", Component: EditingFunctionV31, toc: toc31EditingFunction, searchContent: search31EditingFunction },
        save_checkpoints: { title: "Save Checkpoints", Component: SaveCheckpointV31, toc: toc31SaveCheckpoint, searchContent: search31SaveCheckpoint },
        confirm_annotations: { title: "Confirm Annotations", Component: ConfirmAnnotationV31, toc: toc31ConfirmAnnotation, searchContent: search31ConfirmAnnotation },
        paragraph_selection: { title: "Paragraph Selection", Component: ParagraphSelectionV31, toc: toc31ParagraphSelection, searchContent: search31ParagraphSelection },
        download: { title: "Export Results", Component: DownloadFunctionV31, toc: toc31DownloadFunction, searchContent: search31DownloadFunction },
        personalization: { title: "Personal Information Update", Component: PersonalInformationUpdateV31, toc: toc31PersonalInformationUpdate, searchContent: search31PersonalInformationUpdate },
      },
    },
  },

  // ── v3.1: original release ──
  "v3.1": {
    "getting-started": {
      title: "Getting started",
      pages: {
        overview: { title: "Overview", Component: OverviewV31, toc: toc31Overview, searchContent: search31Overview },
        installation: { title: "Installation", Component: InstallationV31, toc: toc31Installation, searchContent: search31Installation },
        quickstart: { title: "Quickstart", Component: QuickstartV31, toc: toc31Quickstart, searchContent: search31Quickstart },
        faq: { title: "Frequently Asked Questions", Component: FaqV31, toc: toc31Faq, searchContent: search31Faq },
        support: { title: "Contact Support", Component: ContactSupportV31, toc: toc31ContactSupport, searchContent: search31ContactSupport },
      },
    },
    features: {
      title: "Detailed instructions",
      pages: {
        login: { title: "Login & Signup", Component: LoginSignupV31, toc: toc31LoginSignup, searchContent: search31LoginSignup },
        dashboard: { title: "Document Management", Component: DocumentManagementV31, toc: toc31DocumentManagement, searchContent: search31DocumentManagement },
        result_visualization: { title: "Result Visualization", Component: ResultVisualizationV31, toc: toc31ResultVisualization, searchContent: search31ResultVisualization },
        filtering: { title: "Filtering Results", Component: FilteringFunctionV31, toc: toc31FilteringFunction, searchContent: search31FilteringFunction },
        editing: { title: "Editing Annotations", Component: EditingFunctionV31, toc: toc31EditingFunction, searchContent: search31EditingFunction },
        save_checkpoints: { title: "Save Checkpoints", Component: SaveCheckpointV31, toc: toc31SaveCheckpoint, searchContent: search31SaveCheckpoint },
        confirm_annotations: { title: "Confirm Annotations", Component: ConfirmAnnotationV31, toc: toc31ConfirmAnnotation, searchContent: search31ConfirmAnnotation },
        paragraph_selection: { title: "Paragraph Selection", Component: ParagraphSelectionV31, toc: toc31ParagraphSelection, searchContent: search31ParagraphSelection },
        download: { title: "Export Results", Component: DownloadFunctionV31, toc: toc31DownloadFunction, searchContent: search31DownloadFunction },
        personalization: { title: "Personal Information Update", Component: PersonalInformationUpdateV31, toc: toc31PersonalInformationUpdate, searchContent: search31PersonalInformationUpdate },
      },
    },
  },

  "v3.0": {
    "getting-started": {
      title: "Getting started",
      pages: {
        overview: { title: "Overview", Component: OverviewV30, toc: toc30Overview, searchContent: search30Overview },
        installation: { title: "Installation", Component: InstallationV30, toc: toc30Installation, searchContent: search30Installation },
        quickstart: { title: "Quickstart", Component: QuickstartV30, toc: toc30Quickstart, searchContent: search30Quickstart },
      },
    },
    features: {
      title: "Detailed instructions",
      pages: {
        login: { title: "Login & Signup", Component: LoginSignupV30, toc: toc30LoginSignup, searchContent: search30LoginSignup },
        dashboard: { title: "Document Management", Component: DocumentManagementV30, toc: toc30DocumentManagement, searchContent: search30DocumentManagement },
        filtering: { title: "Filtering Results", Component: FilteringFunctionV30, toc: toc30FilteringFunction, searchContent: search30FilteringFunction },
        editing: { title: "Editing Annotations", Component: EditingFunctionV30, toc: toc30EditingFunction, searchContent: search30EditingFunction },
        download: { title: "Export Results", Component: DownloadFunctionV30, toc: toc30DownloadFunction, searchContent: search30DownloadFunction },
      },
    },
  },

  "v2.0": {
    "getting-started": {
      title: "Getting started",
      pages: {
        overview: { title: "Overview", Component: OverviewV20, toc: toc20Overview, searchContent: search20Overview },
      },
    },
  }
};

/* -------------------------------------------------------------------------- */
/*                                Docs page UI                                */
/* -------------------------------------------------------------------------- */

const iconMap: Record<string, React.ReactNode> = {
  overview: <Article fontSize="small" />,
  installation: <GetApp fontSize="small" />,
  quickstart: <PlayArrow fontSize="small" />,
  faq: <QuestionAnswer fontSize="small" />,
  support: <SupportAgent fontSize="small" />,
  login: <Login fontSize="small" />,
  dashboard: <Dashboard fontSize="small" />,
  result_visualization: <Visibility fontSize="small" />,
  workflow_guide: <AutoFixHigh fontSize="small" />,
  filtering: <AutoFixHigh fontSize="small" />,
  editing: <Edit fontSize="small" />,
  llm_extraction: <AutoFixHigh fontSize="small" />,
  tables: <TableChart fontSize="small" />,
  events: <Event fontSize="small" />,
  save_checkpoints: <Save fontSize="small" />,
  confirm_annotations: <CheckCircle fontSize="small" />,
  paragraph_selection: <FormatAlignJustify fontSize="small" />,
  download: <GetApp fontSize="small" />,
  personalization: <Person fontSize="small" />,
};

export default function DocsPage() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  const { version: rv, section: rs, page: rp } = useParams<{
    version: string;
    section: string;
    page: string;
  }>();
  const navigate = useNavigate();

  /* -------- Resolve version / section / page -------- */
  const version = versions.includes(rv as any) ? (rv as (typeof versions)[number]) : versions[0];
  const docsStructure = docsByVersion[version];

  const sectionKeys = React.useMemo(() => Object.keys(docsStructure), [docsStructure]);
  const section = sectionKeys.includes(rs || "") ? (rs as string) : sectionKeys[0];
  const pageKeys = Object.keys(docsStructure[section].pages);
  const page = pageKeys.includes(rp || "") ? (rp as string) : pageKeys[0];

  /* -------- Sync URL if something was invalid -------- */
  React.useEffect(() => {
    if (rv !== version || rs !== section || rp !== page) {
      navigate(`/docs/${version}/${section}/${page}`, { replace: true });
    }
  }, [rv, rs, rp, version, section, page, navigate]);

  /* -------- Collapse state -------- */
  const [openMap, setOpenMap] = React.useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    sectionKeys.forEach((s) => (m[s] = s === section));
    return m;
  });
  React.useEffect(() => {
    // Reset open map when version changes
    setOpenMap((m) => {
      const n: Record<string, boolean> = {};
      sectionKeys.forEach((s) => (n[s] = s === section));
      return n;
    });
  }, [sectionKeys, section]);

  const toggleSection = (s: string) => () => setOpenMap((m) => ({ ...m, [s]: !m[s] }));

  /* -------- Keyboard Shortcut for Search -------- */
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !searchOpen) {
        // Only trigger if not typing in an input
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setSearchOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen]);

  /* -------- Search Logic -------- */
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const hits: { secKey: string; pgKey: string; secTitle: string; title: string; snippet: string }[] = [];

    Object.entries(docsStructure).forEach(([secKey, sec]) => {
      Object.entries(sec.pages).forEach(([pgKey, pg]) => {
        if (pg.title.toLowerCase().includes(q)) {
          hits.push({ secKey, pgKey, secTitle: sec.title, title: pg.title, snippet: 'Matched in title' });
        } else if (pg.searchContent && pg.searchContent.toLowerCase().includes(q)) {
          const idx = pg.searchContent.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 40);
          const end = Math.min(pg.searchContent.length, idx + q.length + 40);
          let snippet = pg.searchContent.substring(start, end).replace(/\n/g, ' ');
          if (start > 0) snippet = '...' + snippet;
          if (end < pg.searchContent.length) snippet = snippet + '...';
          hits.push({ secKey, pgKey, secTitle: sec.title, title: pg.title, snippet });
        } else if (pg.md && pg.md.toLowerCase().includes(q)) {
          const idx = pg.md.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 40);
          const end = Math.min(pg.md.length, idx + q.length + 40);
          let snippet = pg.md.substring(start, end).replace(/\n/g, ' ');
          if (start > 0) snippet = '...' + snippet;
          if (end < pg.md.length) snippet = snippet + '...';
          hits.push({ secKey, pgKey, secTitle: sec.title, title: pg.title, snippet });
        }
      });
    });
    return hits;
  }, [searchQuery, docsStructure]);

  /* -------- Version change -------- */
  const handleVersion = (e: SelectChangeEvent<string>) => navigate(`/docs/${e.target.value}/${section}/${page}`);

  /* -------- Markdown source -------- */
  const activeNode = docsStructure[section].pages[page];

  const mdSource = React.useMemo(() => {
    if (activeNode.Component) return "";
    const fallback = `# ${activeNode.title}\n\n_Content coming soon._`;
    return (activeNode.md || fallback).replace(/{{version}}/g, version);
  }, [activeNode, version]);

  /* -------- TOC Extraction -------- */
  const headings = React.useMemo(() => {
    if (activeNode.toc) return activeNode.toc;
    const extracted = [];
    const lines = mdSource.split('\n');
    for (const line of lines) {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const title = match[2].trim().replace(/[*_`]/g, ''); // strip simple markdown tracking
        const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        extracted.push({ level, title, id });
      }
    }
    return extracted;
  }, [mdSource]);

  /* -------- Markdown overrides -------- */
  const getChildrenText = (children: any): string => {
    if (typeof children === 'string') return children;
    if (Array.isArray(children)) return children.map(getChildrenText).join('');
    if (children && children.props && children.props.children) return getChildrenText(children.props.children);
    return '';
  };

  const PreBlock = (props: any) => {
    const [copied, setCopied] = React.useState(false);
    const text = getChildrenText(props.children);
    const handleCopy = () => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <Box sx={{ position: 'relative', mt: 2, mb: 2 }}>
        <pre {...props} style={{ whiteSpace: "pre", overflowX: "auto", backgroundColor: "#000000", color: "#f8f9fa", padding: "16px 20px", borderRadius: "8px", fontSize: "0.875rem", margin: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", fontFamily: "'Source Code Pro', monospace" }} />
        <IconButton
          onClick={handleCopy}
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8, color: '#9ca3af', '&:hover': { color: '#f9fafb' } }}
        >
          {copied ? <CheckCircle sx={{ fontSize: '1rem' }} /> : <ContentCopy sx={{ fontSize: '1rem' }} />}
        </IconButton>
      </Box>
    );
  };

  const overrides = {
    ...defaultOverrides,
    h1: {
      component: (props: any) => {
        const text = getChildrenText(props.children);
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        return <h1 id={id} {...props} style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.02em", margin: "10px 0", fontSize: "2.5rem", fontWeight: 700 }}>{props.children}</h1>;
      }
    },
    h2: {
      component: (props: any) => {
        const text = getChildrenText(props.children);
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        return <h2 id={id} style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em", margin: "48px 0 16px", fontSize: "1.75rem", fontWeight: 600, scrollMarginTop: '80px' }}>{props.children}</h2>;
      }
    },
    h3: {
      component: (props: any) => {
        const text = getChildrenText(props.children);
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        return <h3 id={id} style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em", margin: "32px 0 12px", fontSize: "1.25rem", fontWeight: 600, scrollMarginTop: '80px' }}>{props.children}</h3>;
      }
    },
    p: { component: (props: any) => <p {...props} style={{ fontFamily: "'Inter', sans-serif", lineHeight: 1.6, color: "#374151" }} /> },
    a: { component: (props: any) => <a {...props} style={{ fontFamily: "'Inter', sans-serif", color: "#2563eb", textDecoration: "none", fontWeight: 500 }} /> },
    li: { component: (props: any) => <li {...props} style={{ fontFamily: "'Inter', sans-serif", lineHeight: 1.6, color: "#374151", marginBottom: "8px" }} /> },
    pre: { component: PreBlock },
    code: {
      component: (props: any) => (
        <code
          {...props}
          style={{
            fontFamily: "'Source Code Pro', monospace",
            fontSize: "0.875rem",
            backgroundColor: "#f3f4f6",
            color: "#111827",
            padding: "3px 6px",
            borderRadius: "6px",
            fontWeight: 500,
          }}
        />
      )
    },
    blockquote: {
      component: (props: any) => (
        <blockquote
          {...props}
          style={{
            borderLeft: "4px solid #e5e7eb",
            paddingLeft: "16px",
            marginLeft: 0,
            color: "#6b7280",
            fontStyle: "italic",
            fontFamily: "'Inter', sans-serif",
          }}
        />
      )
    }
  };

  /* ---------------------------------------------------------------------- */
  /*                                  Render                                 */
  /* ---------------------------------------------------------------------- */

  const drawerContent = (
    <>
      <Box component={RouterLink} to="/home" sx={{ display: "flex", justifyContent: "flex-start", alignItems: "center", py: 3, px: 3, textDecoration: 'none', color: 'inherit' }}>
        <Box component="img" src={LogoImg} alt="PolyMinder" sx={{ height: 32 }} />
      </Box>

      <Box sx={{ px: 2.5, mb: 2 }}>
        <Box
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            bgcolor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px',
            px: 1.5, py: 1, mb: 1.5, cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': { borderColor: '#d1d5db', bgcolor: '#f3f4f6' }
          }}
          onClick={() => setSearchOpen(true)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', color: '#6b7280' }}>
            <SearchIcon sx={{ fontSize: '1.25rem', mr: 1 }} />
            <Box sx={{ fontSize: '0.875rem', fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>Search</Box>
          </Box>
          <Box sx={{ border: '1px solid #e5e7eb', borderRadius: '4px', px: 0.75, py: 0.25, fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>/</Box>
        </Box>
        <FormControl fullWidth size="small" variant="outlined" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f9fafb', '& fieldset': { borderColor: '#e5e7eb' }, '&:hover fieldset': { borderColor: '#d1d5db' }, '&.Mui-focused fieldset': { borderColor: '#9ca3af', borderWidth: '1px' } } }}>
          <Select labelId="ver-label" value={version} onChange={handleVersion} displayEmpty inputProps={{ 'aria-label': 'Without label' }} sx={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 500 }}>
            {versions.map((v) => (
              <MenuItem key={v} value={v}>
                {v}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <List
        component="nav"
        dense
        disablePadding
        sx={{
          px: 1.5,
          borderRight: 0,
          "& .MuiListItemButton-root": {
            py: 0.75,
            pl: 1.5,
            pr: 1.5,
            mb: 0.5,
            borderRadius: '6px',
            fontFamily: "'Inter', sans-serif",
            transition: 'all 0.15s ease',
            "&.Mui-selected": {
              bgcolor: "transparent",
              color: "#000",
              fontWeight: 600,
              "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
            },
            "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
          },
        }}
      >
        {sectionKeys.map((sec) => {
          const open = openMap[sec];
          const secData = docsStructure[sec];
          return (
            <Box key={sec} sx={{ mb: 2 }}>
              <Box sx={{ px: 1.5, py: 1, textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', letterSpacing: '0.05em', fontFamily: "'Inter', sans-serif" }}>
                {secData.title}
              </Box>
              <List component="div" disablePadding>
                {Object.entries(secData.pages).map(([pgKey, pgVal]) => {
                  const isSelected = sec === section && pgKey === page;
                  return (
                    <ListItemButton
                      key={pgKey}
                      component={RouterLink}
                      to={`/docs/${version}/${sec}/${pgKey}`}
                      selected={isSelected}
                      onClick={() => setMobileOpen(false)}
                      sx={{
                        color: isSelected ? '#000' : '#4b5563',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}>
                        {iconMap[pgKey] || <Article fontSize="small" />}
                      </ListItemIcon>
                      <ListItemText
                        primary={pgVal.title}
                        primaryTypographyProps={{
                          fontWeight: isSelected ? 600 : 500,
                          fontSize: "0.875rem",
                          fontFamily: "'Inter', sans-serif"
                        }}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* Mobile top bar with hamburger */}
      {!isMdUp && (
        <AppBar position="fixed" color="default" elevation={1} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", px: 1, py: 0.5 }}>
            <IconButton onClick={() => setMobileOpen((o) => !o)} edge="start" sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
            <Box component={RouterLink} to="/home">
              <Box component="img" src={LogoImg} alt="PolyMinder" sx={{ height: 32 }} />
            </Box>
          </Box>
        </AppBar>
      )}

      {/* Sidebar — permanent on md+, temporary (modal) on smaller screens */}
      <Drawer
        variant={isMdUp ? "permanent" : "temporary"}
        open={isMdUp || mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 3, sm: 4, md: 6 },
          maxWidth: { xs: "100%", lg: 1200, xl: 1600 },
          mx: "auto",
          overflowX: "hidden",
          mt: { xs: 7, md: 0 },
          fontFamily: "'Inter', sans-serif"
        }}
      >
        {isMdUp && <Toolbar sx={{ display: 'none' }} />}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start', px: { xl: 2 } }}>

          {/* Main Content Area (Shifted Right) */}
          <Box sx={{ flex: 1, minWidth: 0, maxWidth: 870, ml: { lg: 12, xl: 24 }, px: { xs: 10, lg: 14 }, pb: 8 }}>
            {activeNode.Component ? <activeNode.Component /> : <MuiMarkdown overrides={overrides}>{mdSource}</MuiMarkdown>}
            <Footer />
          </Box>

          {/* Right TOC Sidebar */}
          {isLgUp && headings.length > 0 && (
            <Box sx={{ width: { lg: 220, xl: 260 }, flexShrink: 0, display: { xs: 'none', lg: 'block' } }}>
              <Box sx={{ position: 'sticky', top: 32 }}>
                <Box sx={{ fontSize: '0.875rem', fontWeight: 600, mb: 1.5, color: '#111827' }}>On this page</Box>
                <Box sx={{ borderLeft: '1px solid #e5e7eb', pl: 1.5 }}>
                  {headings.map((h, i) => (
                    <Box
                      key={i}
                      component="div"
                      onClick={() => {
                        document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      sx={{
                        display: 'block', py: 0.5, cursor: 'pointer',
                        pl: h.level === 3 ? 2 : 0,
                        fontSize: '0.875rem',
                        color: '#6b7280', textDecoration: 'none',
                        transition: 'color 0.15s ease',
                        '&:hover': { color: '#111827' }
                      }}
                    >
                      {h.title}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* Search Modal */}
      <Dialog
        open={searchOpen}
        onClose={() => { setSearchOpen(false); setSearchQuery(''); }}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: '12px', bgcolor: '#f9fafb' } }}
      >
        <DialogTitle sx={{ p: 2, pb: 0, borderBottom: 'none' }}>
          <TextField
            autoFocus
            fullWidth
            placeholder="Search documentation..."
            variant="outlined"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9ca3af' }} />
                </InputAdornment>
              ),
              sx: {
                fontFamily: "'Inter', sans-serif",
                bgcolor: '#ffffff',
                borderRadius: '8px',
                '& fieldset': { borderColor: '#e5e7eb' },
                '&:hover fieldset': { borderColor: '#d1d5db' },
                '&.Mui-focused fieldset': { borderColor: '#9ca3af', borderWidth: '1px' },
              }
            }}
          />
        </DialogTitle>
        <DialogContent sx={{ p: 2, pt: 2, minHeight: '300px' }}>
          {searchQuery.trim() === '' ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#9ca3af', fontFamily: "'Inter', sans-serif" }}>
              Type to search API, guides, and concepts...
            </Box>
          ) : searchResults.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280', fontFamily: "'Inter', sans-serif" }}>
              No results found for "{searchQuery}"
            </Box>
          ) : (
            <List disablePadding>
              {searchResults.map((hit, i) => (
                <ListItemButton
                  key={i}
                  onClick={() => {
                    navigate(`/docs/${version}/${hit.secKey}/${hit.pgKey}`);
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  sx={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    mb: 1,
                    bgcolor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    '&:hover': { bgcolor: '#f3f4f6', borderColor: '#d1d5db' }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                    <Typography sx={{ fontWeight: 600, fontFamily: "'Inter', sans-serif", color: '#111827', fontSize: '0.875rem' }}>{hit.title}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: "'Inter', sans-serif", textTransform: 'uppercase' }}>{hit.secTitle}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.875rem', color: '#6b7280', fontFamily: "'Inter', sans-serif", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {hit.snippet}
                  </Typography>
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
