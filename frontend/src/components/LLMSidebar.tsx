import React, { useEffect } from "react";
import type { Highlight } from "../react-pdf-highlighter-extended";
import "../style/Sidebar.css";
import { CommentedHighlight } from "../types";
import "../pdf_highlighter/style/TextHighlight.css";
import { GuidanceBanner, useGuidanceContext } from "./GuidanceSystem";

interface LLMSidebarProps {
  highlights: Array<CommentedHighlight>;
}

const updateHash = (highlight: Highlight) => {
  const hash = document.location.hash;
  const parts = hash.split('#');
  document.location.hash = parts[0] + "#" + parts[1] + "#highlight-" + highlight.id;
};

const LLMSidebar = ({ highlights }: LLMSidebarProps) => {
  const guidance = useGuidanceContext();

  const handleHighlightClick = (highlight: Highlight) => {
    updateHash(highlight);
  };

  const paragraphCount = highlights.filter(h => h.comment === "BLOCK_LLM").length;
  const entityCount = highlights.filter(h => h.comment !== "BLOCK_LLM").length;
  const hasEntities = entityCount > 0;

  // Scroll to highlight if hash found
  useEffect(() => {
    const parts = document.location.hash.split("#");
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      const highlightElement = document.getElementById(lastPart);
      if (highlightElement) {
        highlightElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlights]);

  return (
    <div className="sidebar" style={{ width: "100%", height: "100vh", overflowY: "auto" }}>
      <div className="description" style={{ padding: "1rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>LLM Mode</h2>

        {guidance.shouldShow('llm-first-run') && !hasEntities && (
          <GuidanceBanner
            id="llm-first-run"
            title="Run Your First LLM Extraction"
            description="Click on any highlighted paragraph block in the PDF. This opens a dialog where you can choose a prompt preset and run the LLM."
            actionLabel="Got it"
            onDismiss={guidance.dismiss}
            visible={true}
            severity="info"
          />
        )}

        {guidance.shouldShow('llm-compare-hint') && hasEntities && (
          <GuidanceBanner
            id="llm-compare-hint"
            title="Compare & Merge Results"
            description="Right-click any LLM-extracted entity to compare it with the model-based extraction and merge the best results."
            actionLabel="Got it"
            onDismiss={guidance.dismiss}
            visible={true}
            severity="success"
          />
        )}

        {!guidance.shouldShow('llm-first-run') && !hasEntities && (
          <div
            style={{
              backgroundColor: "#e8f4fd",
              border: "1px solid #b3d9f2",
              borderRadius: "8px",
              padding: "1rem",
              marginTop: "10px",
            }}
          >
            <p style={{ fontSize: "13px", margin: 0, color: "#5d6d7e" }}>
              Click on a paragraph block in the PDF to run LLM extraction.
            </p>
          </div>
        )}

        <p style={{ fontSize: "14px", marginTop: "1rem", color: "#6c757d" }}>
          Found <span className="total_entities_span">{paragraphCount}</span> paragraphs
          {entityCount > 0 && (
            <> and <span className="total_entities_span">{entityCount}</span> extracted entities in this document.</>
          )}
        </p>
      </div>

      <ul className="sidebar__highlights" style={{ overflow: "auto", paddingTop: "10px" }}>
        {highlights.map((highlight) => {
          const isSelected = document.location.hash.split("#").slice(-1)[0] === `highlight-${highlight.id}`;
          const isParagraph = highlight.comment === "BLOCK_LLM";

          return (
            <li
              key={highlight.id}
              id={`highlight-${highlight.id}`}
              className={`sidebar__highlight ${isSelected ? 'sidebar__highlight--selected' : ''}`}
              onClick={() => handleHighlightClick(highlight)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                ...(!isParagraph && {
                  marginLeft: '1rem',
                  borderLeft: '3px solid #ccc',
                  paddingLeft: '0.5rem'
                }),
              }}
            >
              {isParagraph ? (
                <ParagraphItem highlight={highlight} />
              ) : (
                <EntityItem highlight={highlight} />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

interface HighlightItemProps {
  highlight: CommentedHighlight;
}

const ParagraphItem = ({ highlight }: HighlightItemProps) => (
  <>
    <div style={{ flex: 1, width: '100%' }}>
      <div className="highlight_item_header">
        <p className="entity_point BLOCK_LLM">&nbsp;&nbsp;</p>
        <strong>Paragraph {(highlight.para_id ?? 0) + 1}</strong>
      </div>
      {highlight.content?.text && (
        <blockquote>
          {`${highlight.content.text.slice(0, 90).trim()} ...`}
        </blockquote>
      )}
      <p style={{
        fontSize: "12px",
        color: "#6c757d",
        marginTop: "0.3rem",
        fontStyle: "italic",
      }}>
        🤖 Click to run LLM
      </p>
    </div>
    <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
      <div className="highlight__location">
        Page {highlight.position.boundingRect.pageNumber}
      </div>
    </div>
  </>
);

const EntityItem = ({ highlight }: HighlightItemProps) => (
  <>
    <div style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
      <div className="highlight_item_header">
        <p className={`entity_point ${highlight.comment}`}>&nbsp;&nbsp;</p>
        <strong>{highlight.comment}</strong>
      </div>
      {highlight.content?.text && (
        <blockquote style={{
          fontSize: "0.9rem",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
          {highlight.content.text.slice(0, 60).trim()}
        </blockquote>
      )}
      {highlight.relations && highlight.relations.length > 0 && (
        <ul style={{ fontSize: "0.8rem" }}>
          {highlight.relations.map((relation, idx) => (
            <li key={idx}>
              <i>{relation.type}</i>
              <br />
              <strong style={{ marginLeft: "1rem" }}>
                {relation.arg_type}: {relation.arg_text}
              </strong>
            </li>
          ))}
        </ul>
      )}
    </div>
    <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
      <div className="highlight__location">
        Page {highlight.position.boundingRect.pageNumber}
      </div>
    </div>
  </>
);

export default LLMSidebar;
