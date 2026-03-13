import React from "react";
import { Box } from "@mui/material";
import {
  DocHeader,
  DocText,
  DocLink,
  DocList,
  DocListItem,
  DocInlineCode,
  DocCodeBlock,
  DocCallout
} from "../../components/DocComponents";

export const toc = [
  { id: "overview", title: "Overview", level: 2 },
  { id: "1-switch-to-events-mode", title: "1. Switch to Events Mode", level: 2 },
  { id: "2-understanding-the-event-list", title: "2. Understanding the Event List", level: 2 },
  { id: "3-filter-which-paragraphs-contribute", title: "3. Filter Which Paragraphs Contribute", level: 2 },
  { id: "4-edit-an-event", title: "4. Edit an Event", level: 2 },
  { id: "5-confirm-an-event", title: "5. Confirm an Event", level: 2 },
  { id: "6-delete-an-event", title: "6. Delete an Event", level: 2 },
  { id: "tips", title: "Tips", level: 2 },
];

export const searchContent = `
# Events Mode

Extract and review structured event annotations that group related entities within a paragraph.

---

## Overview

An event in PolyMinder represents a structured action or process described in a single paragraph   for example, a synthesis step, a measurement procedure, or a characterization result. Unlike individual entities, events capture the relationship between entities and the action that connects them.

Events mode is particularly useful for understanding experimental workflows in polymer science papers, where multiple entities (polymer, monomer, condition, method) co-occur in a single procedural sentence.

---

## 1. Switch to Events Mode

In the left settings panel, click Events in the mode list.

 The PDF viewer shows entity highlights as usual.
 The right sidebar lists all detected event annotations grouped by paragraph.

---

## 2. Understanding the Event List

Each event card in the sidebar displays:

 Trigger   the action word or phrase that defines the event (e.g., synthesized, measured, characterized)
 Arguments   the entities that participate in the event, each labelled with a semantic role (e.g., Agent, Theme, Instrument)
 Paragraph reference   which paragraph the event was extracted from

Click any event card to scroll the PDF to the source paragraph.

---

## 3. Filter Which Paragraphs Contribute

By default, events are extracted from every paragraph in the document. For long papers you may want to restrict analysis to specific sections (e.g., only the Experimental section).

1. Click Adjust your selection at the top of the Events sidebar.
2. A dialog lists every paragraph with a checkbox.
3. Uncheck paragraphs you want to exclude.
4. Use Select All / Clear All for bulk actions.
5. Click Save & Reload.

PolyMinder re-runs event extraction using only the checked paragraphs. Unchecked paragraphs retain all their entity annotations   they are simply excluded from event grouping.

---

## 4. Edit an Event

1. Click the pencil icon on an event card.
   An edit dialog opens.

2. You can:
    Change the trigger text and its character span.
    Add, remove, or relabel argument entities.
    Change the argument role for each participant.

3. Click Save & Reload to confirm.

---

## 5. Confirm an Event

Mark an event as reviewed by clicking the star icon on its card.
A filled star indicates the event has been verified. Confirmed events can be selectively included when exporting results.

---

## 6. Delete an Event

Click the delete icon on an event card and confirm.
The event is removed from the annotation, but the underlying entities remain in the document.

---

## Tips

 If no events appear in the sidebar, the NER/RE models may not have extracted trigger words from the current set of paragraphs. Try switching to LLM Extraction mode for those paragraphs.
 Events are most useful in the Experimental and Results sections of polymer papers. Use Adjust your selection to focus on those sections.
 Event arguments inherit their entity type from the main annotation   editing an entity in Entities mode also updates it here.
`;

const tableStyle: React.CSSProperties = { borderCollapse: "collapse", width: "100%", marginBottom: "24px", fontFamily: "'Inter', sans-serif", fontSize: "0.875rem", border: "1px solid #e5e7eb" };
const thStyle: React.CSSProperties = { borderBottom: "2px solid #e5e7eb", padding: "12px 16px", textAlign: "left", backgroundColor: "#f9fafb", color: "#374151", fontWeight: 600 };
const tdStyle: React.CSSProperties = { borderBottom: "1px solid #e5e7eb", padding: "12px 16px", color: "#4b5563" };

export default function Events() {
  return (
    <Box>
      <DocHeader level={1} id="events-mode">Events Mode</DocHeader>
      <DocText>Extract and review structured event annotations that group related entities within a paragraph.</DocText>
      <DocHeader level={2} id="overview">Overview</DocHeader>
      <DocText>An event in PolyMinder represents a structured action or process described in a single paragraph   for example, a synthesis step, a measurement procedure, or a characterization result. Unlike individual entities, events capture the relationship between entities and the action that connects them.</DocText>
      <DocText>Events mode is particularly useful for understanding experimental workflows in polymer science papers, where multiple entities (polymer, monomer, condition, method) co-occur in a single procedural sentence.</DocText>
      <DocHeader level={2} id="1-switch-to-events-mode">1. Switch to Events Mode</DocHeader>
      <DocText>In the left settings panel, click Events in the mode list.</DocText>
      <DocText>The PDF viewer shows entity highlights as usual.</DocText>
      <DocText>The right sidebar lists all detected event annotations grouped by paragraph.</DocText>
      <DocHeader level={2} id="2-understanding-the-event-list">2. Understanding the Event List</DocHeader>
      <DocText>Each event card in the sidebar displays:</DocText>
      <DocText>Trigger   the action word or phrase that defines the event (e.g., synthesized, measured, characterized)</DocText>
      <DocText>Arguments   the entities that participate in the event, each labelled with a semantic role (e.g., Agent, Theme, Instrument)</DocText>
      <DocText>Paragraph reference   which paragraph the event was extracted from</DocText>
      <DocText>Click any event card to scroll the PDF to the source paragraph.</DocText>
      <DocHeader level={2} id="3-filter-which-paragraphs-contribute">3. Filter Which Paragraphs Contribute</DocHeader>
      <DocText>By default, events are extracted from every paragraph in the document. For long papers you may want to restrict analysis to specific sections (e.g., only the Experimental section).</DocText>
      <DocList>
        <DocListItem>Click Adjust your selection at the top of the Events sidebar.</DocListItem>
        <DocListItem>A dialog lists every paragraph with a checkbox.</DocListItem>
        <DocListItem>Uncheck paragraphs you want to exclude.</DocListItem>
        <DocListItem>Use Select All / Clear All for bulk actions.</DocListItem>
        <DocListItem>Click Save &amp; Reload.</DocListItem>
      </DocList>
      <DocText>PolyMinder re-runs event extraction using only the checked paragraphs. Unchecked paragraphs retain all their entity annotations   they are simply excluded from event grouping.</DocText>
      <DocHeader level={2} id="4-edit-an-event">4. Edit an Event</DocHeader>
      <DocList>
        <DocListItem>Click the pencil icon on an event card.</DocListItem>
      </DocList>
      <DocText>An edit dialog opens.</DocText>
      <DocList>
        <DocListItem>You can:</DocListItem>
      </DocList>
      <DocText>Change the trigger text and its character span.</DocText>
      <DocText>Add, remove, or relabel argument entities.</DocText>
      <DocText>Change the argument role for each participant.</DocText>
      <DocList>
        <DocListItem>Click Save &amp; Reload to confirm.</DocListItem>
      </DocList>
      <DocHeader level={2} id="5-confirm-an-event">5. Confirm an Event</DocHeader>
      <DocText>Mark an event as reviewed by clicking the star icon on its card.</DocText>
      <DocText>A filled star indicates the event has been verified. Confirmed events can be selectively included when exporting results.</DocText>
      <DocHeader level={2} id="6-delete-an-event">6. Delete an Event</DocHeader>
      <DocText>Click the delete icon on an event card and confirm.</DocText>
      <DocText>The event is removed from the annotation, but the underlying entities remain in the document.</DocText>
      <DocHeader level={2} id="tips">Tips</DocHeader>
      <DocText>If no events appear in the sidebar, the NER/RE models may not have extracted trigger words from the current set of paragraphs. Try switching to LLM Extraction mode for those paragraphs.</DocText>
      <DocText>Events are most useful in the Experimental and Results sections of polymer papers. Use Adjust your selection to focus on those sections.</DocText>
      <DocText>Event arguments inherit their entity type from the main annotation   editing an entity in Entities mode also updates it here.</DocText>
    </Box>
  );
}
