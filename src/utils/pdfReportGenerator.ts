/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { ProgressReport } from '../types';

function sanitizePdfText(input: string): string {
  return (input || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function downloadProgressReportPdf(report: ProgressReport, mode: 'full' | 'summary'): string {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const ensureSpace = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 24) {
      doc.addPage();
      y = 18;
    }
  };

  const addSectionHeader = (title: string) => {
    ensureSpace(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 105, 85);
    doc.text(sanitizePdfText(title), margin, y);
    y += 1.5;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  };

  const addWrappedParagraph = (
    text: string,
    fontSize = 9.5,
    color: [number, number, number] = [51, 65, 85],
    bold = false
  ) => {
    const clean = sanitizePdfText(text);
    if (!clean) return;
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(clean, contentWidth);
    const lineHeight = fontSize * 0.45;
    for (const line of lines) {
      ensureSpace(lineHeight + 2);
      doc.text(line, margin, y);
      y += lineHeight;
    }
    y += 2;
  };

  // Header Banner — Title "Kinda Care" (capital K and C, large font)
  doc.setFillColor(0, 128, 105);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('Kinda Care', margin, 13.5);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'normal');
  const subtitle =
    mode === 'summary'
      ? 'Caregiver Companion Progress Report — Summary View'
      : 'Caregiver Companion Progress Report — Full Record';
  doc.text(subtitle, margin, 21);

  doc.setFontSize(8.5);
  doc.text(
    sanitizePdfText(`Snapshot ID: ${report.snapshotId}  |  Generated: ${report.generatedAtEAT}`),
    margin,
    27
  );

  y = 40;

  // Child Metadata Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 21, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Child: ${sanitizePdfText(report.childName)}`, margin + 4, y + 6.5);
  doc.text(`Age: ${sanitizePdfText(report.age)}`, margin + 68, y + 6.5);
  doc.text(`Caregiver: ${sanitizePdfText(report.caregiverName)}`, margin + 120, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Reporting Period: ${sanitizePdfText(report.reportingPeriod)}`, margin + 4, y + 12.5);
  doc.text(
    `WhatsApp Messages: ${report.totalConversations}  |  Dated Observations: ${report.totalObservationsLogged}`,
    margin + 4,
    y + 18
  );

  y += 28;

  // 1. Summary (with [obs_id] citations, max 200 words, zero scores/percentages)
  addSectionHeader('1. Summary');
  const summaryParas =
    mode === 'summary' ? report.executiveSummaryParagraphs : report.summaryParagraphs;
  for (const para of summaryParas) {
    addWrappedParagraph(para, 9.5, [30, 41, 59]);
  }

  // 2. Domains (Observation count + strictly defined status labels only)
  addSectionHeader('2. Domains');
  for (const dom of report.domainProgress) {
    ensureSpace(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${sanitizePdfText(dom.domain)}`, margin, y);
    doc.text(
      `${sanitizePdfText(dom.status)} (${dom.observationCount} obs)`,
      pageWidth - margin,
      y,
      { align: 'right' }
    );
    y += 4.5;
    if (mode === 'full') {
      addWrappedParagraph(dom.notes, 8.5, [71, 85, 105]);
    }
  }

  // 3. Caregiver-reported milestones
  addSectionHeader('3. Caregiver-reported milestones');
  if (report.caregiverReportedMilestones.length > 0) {
    for (const ms of report.caregiverReportedMilestones) {
      const refTag = ms.interventionRef ? ` [Intervention: ${ms.interventionRef}]` : '';
      const progTag = ms.isProgression ? ' [PROGRESSION]' : '';
      addWrappedParagraph(
        `* [${ms.date} | ${ms.domain}]${progTag}${refTag} ${ms.milestone} ("${ms.quote}")`,
        9,
        [15, 23, 42]
      );
    }
  } else {
    addWrappedParagraph(
      'No caregiver-reported milestones logged yet.',
      9,
      [100, 116, 139]
    );
  }

  // 4. Parent-reported observations (Full mode)
  if (mode === 'full') {
    addSectionHeader('4. Parent-reported observations');
    if (report.parentFeedbackHighlights.length > 0) {
      for (const item of report.parentFeedbackHighlights) {
        ensureSpace(18);
        const tag = item.isInterventionOutcome && item.interventionRef ? ` (Intervention: ${item.interventionRef})` : '';
        addWrappedParagraph(
          `[${item.date}]${tag} "${item.parentQuote}"`,
          9,
          [15, 23, 42],
          true
        );
        if (item.englishTranslation) {
          addWrappedParagraph(`Translation: ${item.englishTranslation}`, 8.5, [71, 85, 105]);
        }
        addWrappedParagraph(`Why this matters: ${item.whyThisMatters}`, 8.5, [71, 85, 105]);
      }
    } else {
      addWrappedParagraph('No caregiver observations logged yet.', 9, [100, 116, 139]);
    }

    if (report.sensoryProfileEvolution.length > 0) {
      addSectionHeader('5. Sensory Triggers & Caregiver Observations');
      for (const sens of report.sensoryProfileEvolution) {
        ensureSpace(18);
        addWrappedParagraph(`Stimulus: ${sens.stimulus}`, 9.5, [107, 33, 168], true);
        addWrappedParagraph(`Initial observation: ${sens.initialReaction}`, 8.5, [71, 85, 105]);
        addWrappedParagraph(`Latest update: ${sens.currentReaction}`, 8.5, [71, 85, 105]);
      }
    }
  }

  // Open questions for the specialist
  const openQNum = mode === 'full' ? (report.sensoryProfileEvolution.length > 0 ? '6.' : '5.') : '4.';
  addSectionHeader(`${openQNum} Open questions for the specialist`);
  if (report.openQuestionsForSpecialist.length > 0) {
    for (const q of report.openQuestionsForSpecialist) {
      addWrappedParagraph(`* ${q}`, 9, [30, 41, 59]);
    }
  } else {
    addWrappedParagraph('No open questions noted yet.', 9, [100, 116, 139]);
  }

  // Consents on file
  const consentNum = mode === 'full' ? (report.sensoryProfileEvolution.length > 0 ? '7.' : '6.') : '5.';
  addSectionHeader(`${consentNum} Consents on file`);
  addWrappedParagraph(
    `Status: ${report.consentsOnFile.granted ? 'Granted' : 'Pending'} | Version: ${report.consentsOnFile.consentVersion} | Date: ${report.consentsOnFile.consentDateEAT}`,
    8.5,
    [30, 41, 59],
    true
  );
  addWrappedParagraph(`Scope: ${report.consentsOnFile.consentScope}`, 8.5, [71, 85, 105]);

  // Appointments on file
  const apptNum = mode === 'full' ? (report.sensoryProfileEvolution.length > 0 ? '8.' : '7.') : '6.';
  addSectionHeader(`${apptNum} Appointments on file`);
  if (report.appointmentsOnFile.length > 0) {
    for (const apt of report.appointmentsOnFile) {
      addWrappedParagraph(
        `* ${apt.requestedDate} (${apt.time}) — ${apt.therapistName} | Topic: ${apt.topic} | Status: ${apt.status}`,
        8.5,
        [30, 41, 59]
      );
    }
  } else {
    addWrappedParagraph('No specialist appointments requested yet.', 8.5, [100, 116, 139]);
  }

  // Standing verbatim footer across every page
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const footerLines = doc.splitTextToSize(sanitizePdfText(report.standingFooter), contentWidth - 22);
    doc.text(footerLines, margin, pageHeight - 12);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  const safeName = report.childName.replace(/[^a-z0-9]+/gi, '_');
  const isoDay = new Date().toISOString().slice(0, 10);
  const filename =
    mode === 'summary'
      ? `KindaCare_${safeName}_Summary_Report_${isoDay}.pdf`
      : `KindaCare_${safeName}_Full_Progress_Report_${isoDay}.pdf`;

  doc.save(filename);
  return filename;
}
