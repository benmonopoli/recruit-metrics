import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import PptxGenJS from "pptxgenjs";
import * as XLSX from "xlsx";
import { GreenhouseMetrics } from "@/hooks/useGreenhouseMetrics";
import { ExportSection, ExportStyle } from "./ExportModal";

interface ExportData {
  data: GreenhouseMetrics;
  sections: ExportSection[];
  style: ExportStyle;
  reportName?: string;
}

// Color palette (blue primary, orange accent)
const COLORS = {
  primary: "3B82F6", // blue-500
  primaryDark: "1E40AF", // blue-800
  primaryLight: "BFDBFE", // blue-200
  accent: "F97316", // orange-500
  accentLight: "FED7AA", // orange-200
  dark: "0F172A", // slate-900
  muted: "64748B", // slate-500
  light: "F1F5F9", // slate-100
  white: "FFFFFF",
  success: "10B981", // emerald-500
  purple: "8B5CF6", // violet-500
};

// Style configurations
const STYLE_CONFIG = {
  minimal: {
    titleSize: 18,
    subtitleSize: 10,
    bodySize: 8,
    padding: 0.3,
    metricSize: 28,
    isSnapshot: true,
    isExecutive: false,
  },
  "data-rich": {
    titleSize: 24,
    subtitleSize: 12,
    bodySize: 10,
    padding: 0.4,
    metricSize: 36,
    isSnapshot: false,
    isExecutive: false,
  },
  executive: {
    titleSize: 36,
    subtitleSize: 16,
    bodySize: 12,
    padding: 0.8,
    metricSize: 96, // Extra large for executive focus
    isSnapshot: false,
    isExecutive: true,
  },
};

// Helper to download blob
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================
// PDF EXPORT
// ============================================
export async function exportToPDF({ data, sections, style, reportName = "RecruitMetrics Report" }: ExportData) {
  const config = STYLE_CONFIG[style];
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "in",
    format: [11, 8.5],
  });

  const pageWidth = 11;
  const pageHeight = 8.5;

  // Snapshot mode: everything on one page
  if (config.isSnapshot) {
    renderSnapshotPDF(pdf, data, sections, config, pageWidth, pageHeight, reportName);
  } else if (config.isExecutive) {
    // Executive mode: big numbers, minimal detail, dark theme
    renderExecutivePDF(pdf, data, sections, config, pageWidth, pageHeight, reportName);
  } else {
    // Data-rich mode: detailed slides
    // Title slide with gradient effect
    pdf.setFillColor(30, 64, 175); // blue-800
    pdf.rect(0, 0, pageWidth, pageHeight, "F");
    
    // Add decorative circles
    pdf.setFillColor(59, 130, 246); // blue-500
    pdf.circle(9, 1.5, 1.5, "F");
    pdf.setFillColor(249, 115, 22); // orange-500
    pdf.circle(10, 7, 0.8, "F");
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(config.titleSize * 1.8);
    pdf.text(reportName, pageWidth / 2, pageHeight / 2 - 0.8, { align: "center" });
    
    pdf.setFontSize(config.subtitleSize * 1.2);
    pdf.text("Recruiting Analytics Report", pageWidth / 2, pageHeight / 2, { align: "center" });
    
    pdf.setFontSize(config.bodySize);
    pdf.setTextColor(191, 219, 254); // blue-200
    pdf.text(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), pageWidth / 2, pageHeight / 2 + 0.5, { align: "center" });

    // Content slides
    for (const section of sections) {
      pdf.addPage();

      // Header with accent bar
      pdf.setFillColor(59, 130, 246); // blue-500
      pdf.rect(0, 0, pageWidth, 0.15, "F");
      
      pdf.setFillColor(249, 115, 22); // orange accent
      pdf.rect(0, 0, 0.15, pageHeight, "F");

      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.setFontSize(config.titleSize);
      pdf.text(section.label, 0.6, 0.8);
      
      // Subtle divider
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.01);
      pdf.line(0.6, 1, pageWidth - 0.6, 1);

      switch (section.id) {
        case "summary":
          renderSummaryPDF(pdf, data, config, pageWidth, pageHeight);
          break;
        case "pipeline":
          renderPipelinePDF(pdf, data, config, pageWidth);
          break;
        case "departments":
          renderDepartmentsPDF(pdf, data, config, pageWidth);
          break;
        case "hires":
          renderHiresPDF(pdf, data, config, pageWidth);
          break;
        case "openRoles":
          renderOpenRolesPDF(pdf, data, config, pageWidth);
          break;
      }
    }
  }

  // Use report name for filename (sanitized)
  const sanitizedName = reportName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
  const blob = pdf.output("blob");
  downloadBlob(blob, `${sanitizedName}_${new Date().toISOString().split("T")[0]}.pdf`);
}

// One-page snapshot layout
function renderSnapshotPDF(pdf: jsPDF, data: GreenhouseMetrics, sections: ExportSection[], config: any, pageWidth: number, pageHeight: number, reportName: string) {
  // Header bar
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 0, pageWidth, 0.5, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.text(reportName, 0.4, 0.32);
  pdf.setFontSize(9);
  pdf.text(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), pageWidth - 0.4, 0.32, { align: "right" });

  let currentY = 0.7;

  // Summary metrics row (if included)
  if (sections.find(s => s.id === "summary")) {
    const metrics = [
      { label: "Open Roles", value: data.totalOpenRoles, color: [59, 130, 246] },
      { label: "Applicants", value: data.totalApplicants, color: [139, 92, 246] },
      { label: `${data.currentYear} Hires`, value: data.hiresYTD, color: [16, 185, 129] },
      { label: `${data.previousYear} Hires`, value: data.hiresPreviousYear, color: [249, 115, 22] },
    ];

    const cardWidth = 2.4;
    const startX = 0.4;
    metrics.forEach((metric, i) => {
      const x = startX + i * (cardWidth + 0.15);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(x, currentY, cardWidth, 0.7, 0.08, 0.08, "F");
      
      pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
      pdf.setFontSize(config.metricSize);
      pdf.text(metric.value.toLocaleString(), x + 0.15, currentY + 0.42);
      
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(config.bodySize);
      pdf.text(metric.label, x + cardWidth - 0.15, currentY + 0.45, { align: "right" });
    });
    currentY += 0.9;
  }

  // Two-column layout for pipeline and departments
  const leftX = 0.4;
  const rightX = 5.6;
  const colWidth = 5;

  // Pipeline (left column)
  if (sections.find(s => s.id === "pipeline")) {
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(config.subtitleSize);
    pdf.text("Pipeline", leftX, currentY + 0.15);

    const maxCount = Math.max(...data.pipeline.map((p) => p.count));
    const colors = [[59, 130, 246], [139, 92, 246], [249, 115, 22], [245, 158, 11], [16, 185, 129]];

    data.pipeline.forEach((stage, i) => {
      const y = currentY + 0.3 + i * 0.35;
      const barWidth = maxCount > 0 ? (stage.count / maxCount) * 2.5 : 0;

      pdf.setFontSize(config.bodySize - 1);
      pdf.setTextColor(71, 85, 105);
      pdf.text(stage.stage.split(" ")[0], leftX, y + 0.2);

      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(leftX + 1.2, y + 0.05, 2.5, 0.22, 0.03, 0.03, "F");
      pdf.setFillColor(colors[i][0], colors[i][1], colors[i][2]);
      if (barWidth > 0) pdf.roundedRect(leftX + 1.2, y + 0.05, barWidth, 0.22, 0.03, 0.03, "F");

      pdf.setTextColor(colors[i][0], colors[i][1], colors[i][2]);
      pdf.setFontSize(config.bodySize);
      pdf.text(stage.count.toString(), leftX + 3.9, y + 0.2);
    });
  }

  // Departments (right column)
  if (sections.find(s => s.id === "departments")) {
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(config.subtitleSize);
    pdf.text("Departments", rightX, currentY + 0.15);

    data.departmentBreakdown.slice(0, 5).forEach((dept, i) => {
      const y = currentY + 0.3 + i * 0.35;
      pdf.setFontSize(config.bodySize - 1);
      pdf.setTextColor(71, 85, 105);
      pdf.text(dept.name.substring(0, 12), rightX, y + 0.2);

      pdf.setTextColor(59, 130, 246);
      pdf.setFontSize(config.bodySize);
      pdf.text(`${dept.openRoles} roles`, rightX + 2, y + 0.2);

      pdf.setTextColor(100, 116, 139);
      pdf.text(`${dept.totalApplicants} apps`, rightX + 3.3, y + 0.2);
    });
  }

  currentY += 2.2;

  // Open roles table (if included)
  if (sections.find(s => s.id === "openRoles")) {
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(config.subtitleSize);
    pdf.text("Open Roles", leftX, currentY + 0.15);
    currentY += 0.3;

    // Table header
    const headers = ["Role", "Dept", "Applied", "Screen", "Interview", "Final", "Offer"];
    const colWidths = [3, 1.2, 0.8, 0.8, 0.9, 0.7, 0.7];
    
    pdf.setFillColor(59, 130, 246);
    pdf.rect(leftX, currentY, 8.2, 0.3, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(config.bodySize - 1);
    
    let x = leftX + 0.1;
    headers.forEach((h, i) => {
      pdf.text(h, x, currentY + 0.2);
      x += colWidths[i];
    });

    // Data rows (compact)
    const stageColors = [[59, 130, 246], [139, 92, 246], [249, 115, 22], [245, 158, 11], [16, 185, 129]];
    data.openRoles.slice(0, 8).forEach((role, i) => {
      const y = currentY + 0.35 + i * 0.32;
      
      pdf.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
      pdf.rect(leftX, y, 8.2, 0.3, "F");

      x = leftX + 0.1;
      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(config.bodySize - 1);
      pdf.text(role.title.substring(0, 28), x, y + 0.2);
      x += colWidths[0];

      pdf.setTextColor(100, 116, 139);
      pdf.text(role.department.substring(0, 10), x, y + 0.2);
      x += colWidths[1];

      const stages = [role.stages.applied, role.stages.phoneScreen, role.stages.interview, role.stages.finalRound, role.stages.offer];
      stages.forEach((count, si) => {
        pdf.setTextColor(stageColors[si][0], stageColors[si][1], stageColors[si][2]);
        pdf.text(count.toString(), x + colWidths[si + 2] / 2, y + 0.2, { align: "center" });
        x += colWidths[si + 2];
      });
    });
  }
}

// Executive PDF - Dark theme with big numbers, minimal detail
function renderExecutivePDF(pdf: jsPDF, data: GreenhouseMetrics, sections: ExportSection[], config: any, pageWidth: number, pageHeight: number, reportName: string) {
  // Title slide - dark elegant theme
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(0, 0, pageWidth, pageHeight, "F");
  
  // Gradient accent bar at top
  pdf.setFillColor(59, 130, 246);
  pdf.rect(0, 0, pageWidth * 0.33, 0.08, "F");
  pdf.setFillColor(249, 115, 22);
  pdf.rect(pageWidth * 0.33, 0, pageWidth * 0.34, 0.08, "F");
  pdf.setFillColor(59, 130, 246);
  pdf.rect(pageWidth * 0.67, 0, pageWidth * 0.33, 0.08, "F");
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(config.titleSize * 1.5);
  pdf.text(reportName, pageWidth / 2, pageHeight / 2 - 0.5, { align: "center" });
  
  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.setFontSize(config.bodySize);
  pdf.text("EXECUTIVE SUMMARY", pageWidth / 2, pageHeight / 2 + 0.3, { align: "center" });
  
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(config.bodySize - 2);
  pdf.text(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), pageWidth / 2, pageHeight / 2 + 0.7, { align: "center" });

  // Content slides - each with one big number focus
  for (const section of sections) {
    pdf.addPage();
    
    // Dark background
    pdf.setFillColor(248, 250, 252); // slate-50
    pdf.rect(0, 0, pageWidth, pageHeight, "F");
    
    // Top accent bar
    pdf.setFillColor(59, 130, 246);
    pdf.rect(0, 0, pageWidth * 0.33, 0.06, "F");
    pdf.setFillColor(249, 115, 22);
    pdf.rect(pageWidth * 0.33, 0, pageWidth * 0.34, 0.06, "F");
    pdf.setFillColor(59, 130, 246);
    pdf.rect(pageWidth * 0.67, 0, pageWidth * 0.33, 0.06, "F");

    renderExecutiveSection(pdf, data, section, config, pageWidth, pageHeight);
  }
}

function renderExecutiveSection(pdf: jsPDF, data: GreenhouseMetrics, section: ExportSection, config: any, pageWidth: number, pageHeight: number) {
  const centerY = pageHeight / 2;
  
  switch (section.id) {
    case "summary": {
      pdf.setTextColor(59, 130, 246);
      pdf.setFontSize(config.metricSize);
      pdf.text(data.totalOpenRoles.toString(), pageWidth / 2, centerY - 0.5, { align: "center" });
      
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(config.subtitleSize);
      pdf.text("OPEN ROLES", pageWidth / 2, centerY + 0.3, { align: "center" });
      
      // Sub-metrics
      const subMetrics = [
        { label: "Applicants", value: data.totalApplicants, color: [139, 92, 246] },
        { label: `${data.currentYear} Hires`, value: data.hiresYTD, color: [16, 185, 129] },
      ];
      subMetrics.forEach((m, i) => {
        const x = pageWidth / 2 - 1.5 + i * 3;
        pdf.setTextColor(m.color[0], m.color[1], m.color[2]);
        pdf.setFontSize(config.titleSize);
        pdf.text(m.value.toLocaleString(), x, centerY + 1.5, { align: "center" });
        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(config.bodySize);
        pdf.text(m.label, x, centerY + 2, { align: "center" });
      });
      break;
    }
    case "pipeline": {
      // Show total applicants in pipeline
      const total = data.pipeline[0]?.count || 0;
      
      pdf.setTextColor(59, 130, 246);
      pdf.setFontSize(config.metricSize);
      pdf.text(total.toLocaleString(), pageWidth / 2, centerY - 0.5, { align: "center" });
      
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(config.subtitleSize);
      pdf.text("TOTAL IN PIPELINE", pageWidth / 2, centerY + 0.3, { align: "center" });
      
      pdf.setFontSize(config.bodySize);
      pdf.text(`${data.pipeline.length} stages tracked`, pageWidth / 2, centerY + 1, { align: "center" });
      break;
    }
    case "departments": {
      const topDept = data.departmentBreakdown[0];
      
      pdf.setTextColor(59, 130, 246);
      pdf.setFontSize(config.titleSize * 1.2);
      pdf.text(topDept?.name || "—", pageWidth / 2, centerY - 0.5, { align: "center" });
      
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(config.subtitleSize);
      pdf.text("MOST ACTIVE DEPARTMENT", pageWidth / 2, centerY + 0.3, { align: "center" });
      
      // Stats
      const stats = [
        { label: "Roles", value: topDept?.openRoles || 0, color: [249, 115, 22] },
        { label: "Applicants", value: topDept?.totalApplicants || 0, color: [139, 92, 246] },
      ];
      stats.forEach((s, i) => {
        const x = pageWidth / 2 - 1.5 + i * 3;
        pdf.setTextColor(s.color[0], s.color[1], s.color[2]);
        pdf.setFontSize(config.titleSize);
        pdf.text(s.value.toString(), x, centerY + 1.5, { align: "center" });
        pdf.setTextColor(100, 116, 139);
        pdf.setFontSize(config.bodySize);
        pdf.text(s.label, x, centerY + 2, { align: "center" });
      });
      break;
    }
    case "hires": {
      pdf.setTextColor(16, 185, 129);
      pdf.setFontSize(config.metricSize);
      pdf.text(data.hiresYTD.toString(), pageWidth / 2, centerY - 0.5, { align: "center" });
      
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(config.subtitleSize);
      pdf.text(`${data.currentYear} HIRES`, pageWidth / 2, centerY + 0.3, { align: "center" });
      
      pdf.setFontSize(config.bodySize);
      pdf.text(`vs ${data.hiresPreviousYear} in ${data.previousYear}`, pageWidth / 2, centerY + 1, { align: "center" });
      break;
    }
    case "openRoles": {
      pdf.setTextColor(59, 130, 246);
      pdf.setFontSize(config.metricSize);
      pdf.text(data.openRoles.length.toString(), pageWidth / 2, centerY - 0.5, { align: "center" });
      
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(config.subtitleSize);
      pdf.text("ACTIVE POSITIONS", pageWidth / 2, centerY + 0.3, { align: "center" });
      
      pdf.setFontSize(config.bodySize);
      pdf.text(`${data.departmentBreakdown.length} departments hiring`, pageWidth / 2, centerY + 1, { align: "center" });
      break;
    }
  }
}

function renderSummaryPDF(pdf: jsPDF, data: GreenhouseMetrics, config: any, pageWidth: number, pageHeight: number) {
  const metrics = [
    { label: "Open Roles", value: data.totalOpenRoles, color: [59, 130, 246] }, // blue
    { label: "Active Applicants", value: data.totalApplicants, color: [139, 92, 246] }, // purple
    { label: `${data.currentYear} Hires`, value: data.hiresYTD, color: [16, 185, 129] }, // emerald
    { label: `${data.previousYear} Hires`, value: data.hiresPreviousYear, color: [249, 115, 22] }, // orange
  ];

  const cardWidth = 2.2;
  const cardHeight = 2;
  const startX = (pageWidth - (cardWidth * 4 + 0.4 * 3)) / 2;
  const startY = 2;

  metrics.forEach((metric, i) => {
    const x = startX + i * (cardWidth + 0.4);

    // Card background with subtle shadow effect
    pdf.setFillColor(241, 245, 249); // slate-100
    pdf.roundedRect(x + 0.03, startY + 0.03, cardWidth, cardHeight, 0.15, 0.15, "F");
    
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, startY, cardWidth, cardHeight, 0.15, 0.15, "F");

    // Accent bar at top
    pdf.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
    pdf.roundedRect(x, startY, cardWidth, 0.1, 0.15, 0.15, "F");
    pdf.rect(x, startY + 0.05, cardWidth, 0.05, "F");

    // Value
    pdf.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
    pdf.setFontSize(config.metricSize);
    pdf.text(metric.value.toLocaleString(), x + cardWidth / 2, startY + 1.1, { align: "center" });

    // Label
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.setFontSize(config.bodySize);
    pdf.text(metric.label, x + cardWidth / 2, startY + 1.6, { align: "center" });
  });

  // Summary insight box
  const insightY = startY + cardHeight + 0.8;
  pdf.setFillColor(241, 245, 249);
  pdf.roundedRect(startX, insightY, pageWidth - startX * 2, 1.2, 0.1, 0.1, "F");
  
  pdf.setFillColor(59, 130, 246);
  pdf.rect(startX, insightY, 0.08, 1.2, "F");
  
  pdf.setTextColor(30, 64, 175);
  pdf.setFontSize(config.subtitleSize);
  pdf.text("Key Insight", startX + 0.3, insightY + 0.4);
  
  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(config.bodySize);
  const avgPerRole = data.totalOpenRoles > 0 ? Math.round(data.totalApplicants / data.totalOpenRoles) : 0;
  pdf.text(`Average of ${avgPerRole} applicants per open role. ${data.hiresYTD} hires made in ${data.currentYear} so far.`, startX + 0.3, insightY + 0.8);
}

function renderPipelinePDF(pdf: jsPDF, data: GreenhouseMetrics, config: any, pageWidth: number) {
  const maxCount = Math.max(...data.pipeline.map((p) => p.count));
  const barMaxWidth = 6;
  const startX = 1;
  const startY = 1.5;
  
  const stageColors = [
    [59, 130, 246],   // blue
    [139, 92, 246],   // purple
    [249, 115, 22],   // orange
    [245, 158, 11],   // amber
    [16, 185, 129],   // emerald
  ];

  // Funnel visualization
  data.pipeline.forEach((stage, i) => {
    const y = startY + i * 1;
    const barWidth = maxCount > 0 ? (stage.count / maxCount) * barMaxWidth : 0.1;
    const offsetX = (barMaxWidth - barWidth) / 2;

    // Label
    pdf.setFontSize(config.subtitleSize);
    pdf.setTextColor(15, 23, 42);
    pdf.text(stage.stage, startX, y + 0.35);

    // Background bar
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(startX + 2.2, y + 0.1, barMaxWidth, 0.5, 0.08, 0.08, "F");

    // Progress bar (centered for funnel effect)
    const color = stageColors[i % stageColors.length];
    pdf.setFillColor(color[0], color[1], color[2]);
    if (barWidth > 0.1) {
      pdf.roundedRect(startX + 2.2 + offsetX, y + 0.1, barWidth, 0.5, 0.08, 0.08, "F");
    }

    // Count badge
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.roundedRect(startX + 2.2 + barMaxWidth + 0.3, y + 0.1, 0.7, 0.5, 0.08, 0.08, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(config.bodySize + 2);
    pdf.text(stage.count.toString(), startX + 2.2 + barMaxWidth + 0.65, y + 0.42, { align: "center" });
  });
}

function renderDepartmentsPDF(pdf: jsPDF, data: GreenhouseMetrics, config: any, pageWidth: number) {
  const startX = 0.6;
  const startY = 1.3;

  // Department cards in a grid - tighter spacing
  const cardWidth = 3.1;
  const cardHeight = 1.2;
  const cols = 3;
  const gapX = 0.2;
  const gapY = 0.2;

  data.departmentBreakdown.slice(0, 6).forEach((dept, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardWidth + gapX);
    const y = startY + row * (cardHeight + gapY);

    // Card background
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(x, y, cardWidth, cardHeight, 0.08, 0.08, "FD");
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.01);

    // Department name - truncate if needed
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(config.subtitleSize - 1);
    const deptName = dept.name.length > 18 ? dept.name.substring(0, 16) + "..." : dept.name;
    pdf.text(deptName, x + 0.15, y + 0.35);

    // Open roles count
    pdf.setTextColor(59, 130, 246);
    pdf.setFontSize(config.titleSize * 0.7);
    pdf.text(dept.openRoles.toString(), x + 0.15, y + 0.75);
    
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(config.bodySize - 2);
    pdf.text("open roles", x + 0.55, y + 0.75);

    // Applicants count - right aligned, no bar
    pdf.setTextColor(139, 92, 246);
    pdf.setFontSize(config.bodySize);
    pdf.text(dept.totalApplicants.toLocaleString(), x + cardWidth - 0.15, y + 0.75, { align: "right" });
    
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(config.bodySize - 3);
    pdf.text("applicants", x + cardWidth - 0.15, y + 0.95, { align: "right" });
  });
}

function renderHiresPDF(pdf: jsPDF, data: GreenhouseMetrics, config: any, pageWidth: number) {
  const startX = 0.8;
  const startY = 1.4;

  // Year comparison header
  pdf.setFillColor(59, 130, 246);
  pdf.roundedRect(startX, startY, 2, 0.8, 0.1, 0.1, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(config.titleSize);
  pdf.text(data.hiresYTD.toString(), startX + 1, startY + 0.35, { align: "center" });
  pdf.setFontSize(config.bodySize);
  pdf.text(`${data.currentYear} YTD`, startX + 1, startY + 0.6, { align: "center" });

  pdf.setFillColor(100, 116, 139);
  pdf.roundedRect(startX + 2.3, startY, 2, 0.8, 0.1, 0.1, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(config.titleSize);
  pdf.text(data.hiresPreviousYear.toString(), startX + 3.3, startY + 0.35, { align: "center" });
  pdf.setFontSize(config.bodySize);
  pdf.text(`${data.previousYear} Total`, startX + 3.3, startY + 0.6, { align: "center" });

  // Hires list
  const listY = startY + 1.2;
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(config.subtitleSize);
  pdf.text(`${data.currentYear} Hires by Role`, startX, listY);

  data.hiresYTDByRole.slice(0, 8).forEach((role, i) => {
    const y = listY + 0.4 + i * 0.5;
    
    // Role row
    pdf.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
    pdf.rect(startX, y, pageWidth - startX * 2, 0.45, "F");

    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(config.bodySize);
    pdf.text(role.title.length > 40 ? role.title.substring(0, 37) + "..." : role.title, startX + 0.2, y + 0.28);
    
    pdf.setTextColor(100, 116, 139);
    pdf.text(role.department, startX + 5, y + 0.28);

    // Hire count badge
    pdf.setFillColor(59, 130, 246);
    pdf.roundedRect(pageWidth - startX - 0.8, y + 0.08, 0.6, 0.3, 0.05, 0.05, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.text(role.hires.toString(), pageWidth - startX - 0.5, y + 0.28, { align: "center" });
  });
}

function renderOpenRolesPDF(pdf: jsPDF, data: GreenhouseMetrics, config: any, pageWidth: number) {
  const startX = 0.6;
  const startY = 1.3;

  // Table header
  const headers = ["Role", "Department", "Applied", "Screen", "Interview", "Final", "Offer"];
  const colWidths = [3.5, 1.5, 0.8, 0.8, 0.9, 0.7, 0.7];
  
  pdf.setFillColor(59, 130, 246);
  pdf.rect(startX, startY, pageWidth - startX * 2, 0.45, "F");
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(config.bodySize);
  
  let x = startX + 0.15;
  headers.forEach((header, i) => {
    pdf.text(header, x, startY + 0.28);
    x += colWidths[i];
  });

  // Data rows
  data.openRoles.slice(0, 10).forEach((role, i) => {
    const y = startY + 0.5 + i * 0.5;
    
    pdf.setFillColor(i % 2 === 0 ? 255 : 248, i % 2 === 0 ? 255 : 250, i % 2 === 0 ? 255 : 252);
    pdf.rect(startX, y, pageWidth - startX * 2, 0.48, "F");

    x = startX + 0.15;
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(config.bodySize);
    
    const title = role.title.length > 35 ? role.title.substring(0, 32) + "..." : role.title;
    pdf.text(title, x, y + 0.3);
    x += colWidths[0];
    
    pdf.setTextColor(100, 116, 139);
    pdf.text(role.department.substring(0, 12), x, y + 0.3);
    x += colWidths[1];

    // Stage counts - just colored numbers, no bars
    const stages = [role.stages.applied, role.stages.phoneScreen, role.stages.interview, role.stages.finalRound, role.stages.offer];
    const colors = [[59, 130, 246], [139, 92, 246], [249, 115, 22], [245, 158, 11], [16, 185, 129]];

    stages.forEach((count, si) => {
      pdf.setTextColor(colors[si][0], colors[si][1], colors[si][2]);
      pdf.setFontSize(config.bodySize);
      pdf.text(count.toString(), x + colWidths[si + 2] / 2, y + 0.3, { align: "center" });
      x += colWidths[si + 2];
    });
  });
}

// ============================================
// POWERPOINT EXPORT
// ============================================
export async function exportToPPTX({ data, sections, style, reportName = "RecruitMetrics Report" }: ExportData) {
  const pptx = new PptxGenJS();
  pptx.author = "RecruitMetrics";
  pptx.title = reportName;
  pptx.subject = "Recruiting Analytics";
  pptx.layout = "LAYOUT_16x9";

  const config = STYLE_CONFIG[style];

  // Snapshot mode: single slide with all data
  if (config.isSnapshot) {
    renderSnapshotPPTX(pptx, data, sections, config, reportName);
  } else {
    // Title slide
    const titleSlide = pptx.addSlide();
    titleSlide.addShape("rect", {
      x: 0, y: 0, w: "100%", h: "100%",
      fill: { type: "solid", color: COLORS.primaryDark },
    });
    
    // Decorative elements
    titleSlide.addShape("ellipse", {
      x: 8, y: -0.5, w: 3, h: 3,
      fill: { type: "solid", color: COLORS.primary },
    });
    titleSlide.addShape("ellipse", {
      x: 9, y: 4.5, w: 1.5, h: 1.5,
      fill: { type: "solid", color: COLORS.accent },
    });

    titleSlide.addText(reportName, {
      x: 0.5, y: 2, w: 9, h: 1,
      fontSize: config.titleSize * 1.8,
      color: COLORS.white,
      bold: true,
    });
    titleSlide.addText("Recruiting Analytics Report", {
      x: 0.5, y: 2.9, w: 9, h: 0.6,
      fontSize: config.subtitleSize * 1.2,
      color: COLORS.primaryLight,
    });
    titleSlide.addText(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), {
      x: 0.5, y: 3.5, w: 9, h: 0.4,
      fontSize: config.bodySize,
      color: COLORS.primaryLight,
    });

    // Content slides
    for (const section of sections) {
      const slide = pptx.addSlide();

      // Accent bars
      slide.addShape("rect", {
        x: 0, y: 0, w: "100%", h: 0.12,
        fill: { color: COLORS.primary },
      });
      slide.addShape("rect", {
        x: 0, y: 0, w: 0.12, h: "100%",
        fill: { color: COLORS.accent },
      });

      slide.addText(section.label, {
        x: 0.5, y: 0.3, w: 8, h: 0.6,
        fontSize: config.titleSize,
        color: COLORS.dark,
        bold: true,
      });

      switch (section.id) {
        case "summary":
          renderSummaryPPTX(slide, data, config);
          break;
        case "pipeline":
          renderPipelinePPTX(slide, data, config);
          break;
        case "departments":
          renderDepartmentsPPTX(slide, data, config);
          break;
        case "hires":
          renderHiresPPTX(slide, data, config);
          break;
        case "openRoles":
          renderOpenRolesPPTX(slide, data, config);
          break;
      }
    }
  }

  const blob = await pptx.write({ outputType: "blob" }) as Blob;
  downloadBlob(blob, `RecruitMetrics_Report_${new Date().toISOString().split("T")[0]}.pptx`);
}

// One-slide snapshot layout for PPTX
function renderSnapshotPPTX(pptx: PptxGenJS, data: GreenhouseMetrics, sections: ExportSection[], config: any, reportName: string) {
  const slide = pptx.addSlide();

  // Header bar
  slide.addShape("rect", {
    x: 0, y: 0, w: "100%", h: 0.45,
    fill: { color: COLORS.primary },
  });
  slide.addText(reportName, {
    x: 0.3, y: 0.1, w: 6, h: 0.3,
    fontSize: 14,
    color: COLORS.white,
    bold: true,
  });
  slide.addText(new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }), {
    x: 7.5, y: 0.12, w: 2, h: 0.25,
    fontSize: 9,
    color: COLORS.primaryLight,
    align: "right",
  });

  // Summary metrics row
  if (sections.find(s => s.id === "summary")) {
    const metrics = [
      { label: "Open Roles", value: data.totalOpenRoles, color: COLORS.primary },
      { label: "Applicants", value: data.totalApplicants, color: COLORS.purple },
      { label: `${data.currentYear} Hires`, value: data.hiresYTD, color: COLORS.success },
      { label: `${data.previousYear} Hires`, value: data.hiresPreviousYear, color: COLORS.accent },
    ];

    metrics.forEach((metric, i) => {
      const x = 0.3 + i * 2.4;
      slide.addShape("roundRect", {
        x, y: 0.6, w: 2.2, h: 0.6,
        fill: { color: COLORS.light },
        rectRadius: 0.05,
      });
      slide.addText(metric.value.toLocaleString(), {
        x, y: 0.62, w: 1.3, h: 0.55,
        fontSize: 22,
        color: metric.color,
        bold: true,
      });
      slide.addText(metric.label, {
        x: x + 1.2, y: 0.75, w: 0.9, h: 0.35,
        fontSize: 7,
        color: COLORS.muted,
      });
    });
  }

  // Pipeline (left side)
  if (sections.find(s => s.id === "pipeline")) {
    slide.addText("Pipeline", {
      x: 0.3, y: 1.35, w: 2, h: 0.25,
      fontSize: 10,
      color: COLORS.dark,
      bold: true,
    });

    const maxCount = Math.max(...data.pipeline.map((p) => p.count));
    const stageColors = [COLORS.primary, COLORS.purple, COLORS.accent, "F59E0B", COLORS.success];

    data.pipeline.forEach((stage, i) => {
      const y = 1.65 + i * 0.32;
      const barWidth = maxCount > 0 ? (stage.count / maxCount) * 2.2 : 0;

      slide.addText(stage.stage.split(" ")[0], {
        x: 0.3, y, w: 1, h: 0.28,
        fontSize: 7,
        color: COLORS.muted,
      });
      slide.addShape("roundRect", {
        x: 1.3, y: y + 0.05, w: 2.2, h: 0.2,
        fill: { color: COLORS.light },
        rectRadius: 0.03,
      });
      slide.addShape("roundRect", {
        x: 1.3, y: y + 0.05, w: Math.max(barWidth, 0.05), h: 0.2,
        fill: { color: stageColors[i] },
        rectRadius: 0.03,
      });
      slide.addText(stage.count.toString(), {
        x: 3.6, y, w: 0.5, h: 0.28,
        fontSize: 8,
        color: stageColors[i],
        bold: true,
      });
    });
  }

  // Departments (right side)
  if (sections.find(s => s.id === "departments")) {
    slide.addText("Departments", {
      x: 5.2, y: 1.35, w: 2, h: 0.25,
      fontSize: 10,
      color: COLORS.dark,
      bold: true,
    });

    data.departmentBreakdown.slice(0, 5).forEach((dept, i) => {
      const y = 1.65 + i * 0.32;
      slide.addText(dept.name.substring(0, 12), {
        x: 5.2, y, w: 1.5, h: 0.28,
        fontSize: 7,
        color: COLORS.muted,
      });
      slide.addText(`${dept.openRoles} roles`, {
        x: 6.8, y, w: 0.7, h: 0.28,
        fontSize: 8,
        color: COLORS.primary,
        bold: true,
      });
      slide.addText(`${dept.totalApplicants}`, {
        x: 7.6, y, w: 0.5, h: 0.28,
        fontSize: 7,
        color: COLORS.muted,
      });
    });
  }

  // Open roles table (bottom)
  if (sections.find(s => s.id === "openRoles")) {
    slide.addText("Open Roles", {
      x: 0.3, y: 3.35, w: 2, h: 0.25,
      fontSize: 10,
      color: COLORS.dark,
      bold: true,
    });

    const headers = ["Role", "Dept", "Applied", "Screen", "Interview", "Final", "Offer"];
    const colWidths = [2.8, 1, 0.7, 0.7, 0.8, 0.6, 0.6];
    const stageColors = [COLORS.primary, COLORS.purple, COLORS.accent, "F59E0B", COLORS.success];

    const tableData: PptxGenJS.TableRow[] = [
      headers.map((h, hi) => ({
        text: h,
        options: { 
          bold: true, 
          fill: { color: COLORS.primary }, 
          color: COLORS.white, 
          align: hi > 1 ? "center" as const : "left" as const,
          fontSize: 7,
        },
      })),
      ...data.openRoles.slice(0, 6).map((role) => [
        { text: role.title.substring(0, 28), options: { color: COLORS.dark, fontSize: 7 } },
        { text: role.department.substring(0, 8), options: { color: COLORS.muted, fontSize: 6 } },
        { text: role.stages.applied.toString(), options: { color: stageColors[0], bold: true, align: "center" as const, fontSize: 8 } },
        { text: role.stages.phoneScreen.toString(), options: { color: stageColors[1], bold: true, align: "center" as const, fontSize: 8 } },
        { text: role.stages.interview.toString(), options: { color: stageColors[2], bold: true, align: "center" as const, fontSize: 8 } },
        { text: role.stages.finalRound.toString(), options: { color: stageColors[3], bold: true, align: "center" as const, fontSize: 8 } },
        { text: role.stages.offer.toString(), options: { color: stageColors[4], bold: true, align: "center" as const, fontSize: 8 } },
      ]),
    ];

    slide.addTable(tableData, {
      x: 0.3, y: 3.6, w: 9.4,
      colW: colWidths,
      rowH: 0.28,
      border: { type: "solid", pt: 0.3, color: COLORS.light },
      fill: { color: COLORS.white },
    });
  }
}

function renderSummaryPPTX(slide: PptxGenJS.Slide, data: GreenhouseMetrics, config: any) {
  const metrics = [
    { label: "Open Roles", value: data.totalOpenRoles, color: COLORS.primary },
    { label: "Active Applicants", value: data.totalApplicants, color: COLORS.purple },
    { label: `${data.currentYear} Hires`, value: data.hiresYTD, color: COLORS.success },
    { label: `${data.previousYear} Hires`, value: data.hiresPreviousYear, color: COLORS.accent },
  ];

  const cardWidth = 2.2;
  const startX = 0.5;
  const startY = 1.2;

  metrics.forEach((metric, i) => {
    const x = startX + i * (cardWidth + 0.2);

    // Card with shadow effect
    slide.addShape("roundRect", {
      x: x + 0.03, y: startY + 0.03, w: cardWidth, h: 2,
      fill: { color: COLORS.light },
      rectRadius: 0.1,
    });
    slide.addShape("roundRect", {
      x, y: startY, w: cardWidth, h: 2,
      fill: { color: COLORS.white },
      line: { color: COLORS.light, width: 1 },
      rectRadius: 0.1,
    });

    // Accent top bar
    slide.addShape("rect", {
      x, y: startY, w: cardWidth, h: 0.08,
      fill: { color: metric.color },
    });

    slide.addText(metric.value.toLocaleString(), {
      x, y: startY + 0.4, w: cardWidth, h: 1,
      fontSize: config.metricSize,
      color: metric.color,
      align: "center",
      bold: true,
    });

    slide.addText(metric.label, {
      x, y: startY + 1.4, w: cardWidth, h: 0.4,
      fontSize: config.bodySize,
      color: COLORS.muted,
      align: "center",
    });
  });

  // Insight box
  slide.addShape("roundRect", {
    x: 0.5, y: 3.5, w: 9, h: 0.8,
    fill: { color: COLORS.light },
    rectRadius: 0.08,
  });
  slide.addShape("rect", {
    x: 0.5, y: 3.5, w: 0.06, h: 0.8,
    fill: { color: COLORS.primary },
  });

  const avgPerRole = data.totalOpenRoles > 0 ? Math.round(data.totalApplicants / data.totalOpenRoles) : 0;
  slide.addText("Key Insight", {
    x: 0.7, y: 3.55, w: 2, h: 0.3,
    fontSize: config.bodySize + 1,
    color: COLORS.primaryDark,
    bold: true,
  });
  slide.addText(`Average of ${avgPerRole} applicants per open role. ${data.hiresYTD} hires made in ${data.currentYear} so far.`, {
    x: 0.7, y: 3.85, w: 8.5, h: 0.35,
    fontSize: config.bodySize,
    color: COLORS.muted,
  });
}

function renderPipelinePPTX(slide: PptxGenJS.Slide, data: GreenhouseMetrics, config: any) {
  const maxCount = Math.max(...data.pipeline.map((p) => p.count));
  const barMaxWidth = 5.5;
  const startY = 1.2;
  
  const stageColors = [COLORS.primary, COLORS.purple, COLORS.accent, "F59E0B", COLORS.success];

  data.pipeline.forEach((stage, i) => {
    const y = startY + i * 0.75;
    const barWidth = maxCount > 0 ? (stage.count / maxCount) * barMaxWidth : 0.1;
    const offsetX = (barMaxWidth - barWidth) / 2;

    // Label
    slide.addText(stage.stage, {
      x: 0.5, y, w: 2, h: 0.5,
      fontSize: config.subtitleSize,
      color: COLORS.dark,
    });

    // Background bar
    slide.addShape("roundRect", {
      x: 2.5, y: y + 0.1, w: barMaxWidth, h: 0.4,
      fill: { color: COLORS.light },
      rectRadius: 0.05,
    });

    // Progress bar (centered for funnel)
    slide.addShape("roundRect", {
      x: 2.5 + offsetX, y: y + 0.1, w: Math.max(barWidth, 0.1), h: 0.4,
      fill: { color: stageColors[i % stageColors.length] },
      rectRadius: 0.05,
    });

    // Count badge
    slide.addShape("roundRect", {
      x: 8.2, y: y + 0.08, w: 0.7, h: 0.45,
      fill: { color: stageColors[i % stageColors.length] },
      rectRadius: 0.05,
    });
    slide.addText(stage.count.toString(), {
      x: 8.2, y: y + 0.1, w: 0.7, h: 0.4,
      fontSize: config.bodySize + 1,
      color: COLORS.white,
      align: "center",
      bold: true,
    });
  });

}

function renderDepartmentsPPTX(slide: PptxGenJS.Slide, data: GreenhouseMetrics, config: any) {
  const maxApplicants = Math.max(...data.departmentBreakdown.map((d) => d.totalApplicants));
  const cardWidth = 2.9;
  const cardHeight = 1.3;
  const cols = 3;
  const startX = 0.5;
  const startY = 1.2;

  data.departmentBreakdown.slice(0, 6).forEach((dept, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardWidth + 0.2);
    const y = startY + row * (cardHeight + 0.2);

    slide.addShape("roundRect", {
      x, y, w: cardWidth, h: cardHeight,
      fill: { color: COLORS.white },
      line: { color: COLORS.light, width: 1 },
      rectRadius: 0.08,
    });

    slide.addText(dept.name, {
      x: x + 0.15, y: y + 0.1, w: cardWidth - 0.3, h: 0.35,
      fontSize: config.subtitleSize,
      color: COLORS.dark,
      bold: true,
    });

    slide.addText([
      { text: dept.openRoles.toString(), options: { fontSize: config.titleSize * 0.7, color: COLORS.primary, bold: true } },
      { text: " open roles", options: { fontSize: config.bodySize - 1, color: COLORS.muted } },
    ], {
      x: x + 0.15, y: y + 0.45, w: cardWidth - 0.3, h: 0.35,
    });

    // Progress bar
    const barWidth = maxApplicants > 0 ? (dept.totalApplicants / maxApplicants) * (cardWidth - 0.3) : 0;
    slide.addShape("roundRect", {
      x: x + 0.15, y: y + 0.9, w: cardWidth - 0.3, h: 0.12,
      fill: { color: COLORS.light },
      rectRadius: 0.02,
    });
    slide.addShape("roundRect", {
      x: x + 0.15, y: y + 0.9, w: Math.max(barWidth, 0.05), h: 0.12,
      fill: { color: COLORS.primary },
      rectRadius: 0.02,
    });

    slide.addText(`${dept.totalApplicants} applicants`, {
      x: x + 0.15, y: y + 1.02, w: cardWidth - 0.3, h: 0.2,
      fontSize: config.bodySize - 2,
      color: COLORS.muted,
      align: "right",
    });
  });
}

function renderHiresPPTX(slide: PptxGenJS.Slide, data: GreenhouseMetrics, config: any) {
  // Year badges
  slide.addShape("roundRect", {
    x: 0.5, y: 1.1, w: 1.8, h: 0.8,
    fill: { color: COLORS.primary },
    rectRadius: 0.1,
  });
  slide.addText(data.hiresYTD.toString(), {
    x: 0.5, y: 1.1, w: 1.8, h: 0.5,
    fontSize: config.titleSize,
    color: COLORS.white,
    align: "center",
    bold: true,
  });
  slide.addText(`${data.currentYear} YTD`, {
    x: 0.5, y: 1.5, w: 1.8, h: 0.35,
    fontSize: config.bodySize - 1,
    color: COLORS.primaryLight,
    align: "center",
  });

  slide.addShape("roundRect", {
    x: 2.5, y: 1.1, w: 1.8, h: 0.8,
    fill: { color: COLORS.muted },
    rectRadius: 0.1,
  });
  slide.addText(data.hiresPreviousYear.toString(), {
    x: 2.5, y: 1.1, w: 1.8, h: 0.5,
    fontSize: config.titleSize,
    color: COLORS.white,
    align: "center",
    bold: true,
  });
  slide.addText(`${data.previousYear} Total`, {
    x: 2.5, y: 1.5, w: 1.8, h: 0.35,
    fontSize: config.bodySize - 1,
    color: COLORS.light,
    align: "center",
  });

  // Hires table
  const tableData: PptxGenJS.TableRow[] = data.hiresYTDByRole.slice(0, 8).map((role, i) => [
    { text: role.title.length > 35 ? role.title.substring(0, 32) + "..." : role.title, options: { color: COLORS.dark } },
    { text: role.department, options: { color: COLORS.muted } },
    { text: role.hires.toString(), options: { color: COLORS.white, fill: { color: COLORS.primary }, align: "center", bold: true } },
  ]);

  slide.addTable(tableData, {
    x: 0.5, y: 2.1, w: 9,
    fontSize: config.bodySize,
    color: COLORS.dark,
    border: { type: "solid", pt: 0.5, color: COLORS.light },
    fill: { color: COLORS.white },
  });
}

function renderOpenRolesPPTX(slide: PptxGenJS.Slide, data: GreenhouseMetrics, config: any) {
  const headers = ["Role", "Dept", "Applied", "Screen", "Interview", "Final", "Offer"];
  const colWidths = [3.2, 1.2, 0.8, 0.8, 0.9, 0.7, 0.7];
  const stageColors = [COLORS.primary, COLORS.purple, COLORS.accent, "F59E0B", COLORS.success];

  const tableData: PptxGenJS.TableRow[] = [
    headers.map((h) => ({
      text: h,
      options: { bold: true, fill: { color: COLORS.primary }, color: COLORS.white, align: "center" as const },
    })),
    ...data.openRoles.slice(0, 9).map((role) => [
      { text: role.title.length > 30 ? role.title.substring(0, 27) + "..." : role.title, options: { color: COLORS.dark } },
      { text: role.department.substring(0, 10), options: { color: COLORS.muted, fontSize: config.bodySize - 1 } },
      { text: role.stages.applied.toString(), options: { color: stageColors[0], bold: true, align: "center" as const } },
      { text: role.stages.phoneScreen.toString(), options: { color: stageColors[1], bold: true, align: "center" as const } },
      { text: role.stages.interview.toString(), options: { color: stageColors[2], bold: true, align: "center" as const } },
      { text: role.stages.finalRound.toString(), options: { color: stageColors[3], bold: true, align: "center" as const } },
      { text: role.stages.offer.toString(), options: { color: stageColors[4], bold: true, align: "center" as const } },
    ]),
  ];

  slide.addTable(tableData, {
    x: 0.3, y: 1.1, w: 9.4,
    colW: colWidths,
    fontSize: config.bodySize,
    border: { type: "solid", pt: 0.5, color: COLORS.light },
    fill: { color: COLORS.white },
  });
}

// ============================================
// PNG EXPORT
// ============================================
export async function exportToPNG({ data, sections, style, reportName = "RecruitMetrics Report" }: ExportData) {
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "1920px";
  container.style.backgroundColor = "#ffffff";
  container.style.padding = "48px";
  container.style.fontFamily = "system-ui, -apple-system, sans-serif";
  document.body.appendChild(container);

  const config = STYLE_CONFIG[style];

  let html = `
    <div style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); padding: 64px; margin-bottom: 48px; border-radius: 24px; position: relative; overflow: hidden;">
      <div style="position: absolute; right: -50px; top: -50px; width: 200px; height: 200px; background: #3B82F6; border-radius: 50%; opacity: 0.5;"></div>
      <div style="position: absolute; right: 50px; bottom: -30px; width: 100px; height: 100px; background: #F97316; border-radius: 50%;"></div>
      <h1 style="color: white; font-size: ${config.titleSize * 2.5}px; margin: 0; font-weight: 800; position: relative;">${reportName}</h1>
      <p style="color: #BFDBFE; font-size: ${config.subtitleSize * 1.5}px; margin: 16px 0 0 0; position: relative;">Recruiting Analytics Report</p>
      <p style="color: #93C5FD; font-size: ${config.bodySize * 1.2}px; margin: 8px 0 0 0; position: relative;">${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
    </div>
  `;

  for (const section of sections) {
    html += `
      <div style="margin-bottom: 48px; position: relative;">
        <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: #F97316; border-radius: 2px;"></div>
        <h2 style="color: #0F172A; font-size: ${config.titleSize * 1.2}px; margin: 0 0 24px 20px; font-weight: 700;">${section.label}</h2>
        <div style="margin-left: 20px;">
    `;

    switch (section.id) {
      case "summary":
        html += renderSummaryHTML(data, config);
        break;
      case "pipeline":
        html += renderPipelineHTML(data, config);
        break;
      case "departments":
        html += renderDepartmentsHTML(data, config);
        break;
      case "hires":
        html += renderHiresHTML(data, config);
        break;
      case "openRoles":
        html += renderOpenRolesHTML(data, config);
        break;
    }

    html += `</div></div>`;
  }

  container.innerHTML = html;

  const canvas = await html2canvas(container, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  document.body.removeChild(container);

  const sanitizedName = reportName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
  canvas.toBlob((blob) => {
    if (blob) {
      downloadBlob(blob, `${sanitizedName}_${new Date().toISOString().split("T")[0]}.png`);
    }
  }, "image/png");
}

function renderSummaryHTML(data: GreenhouseMetrics, config: any): string {
  const metrics = [
    { label: "Open Roles", value: data.totalOpenRoles, color: "#3B82F6" },
    { label: "Active Applicants", value: data.totalApplicants.toLocaleString(), color: "#8B5CF6" },
    { label: `${data.currentYear} Hires`, value: data.hiresYTD, color: "#10B981" },
    { label: `${data.previousYear} Hires`, value: data.hiresPreviousYear, color: "#F97316" },
  ];

  return `
    <div style="display: flex; gap: 24px; margin-bottom: 24px;">
      ${metrics.map((m) => `
        <div style="flex: 1; background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-top: 4px solid ${m.color};">
          <div style="font-size: ${config.metricSize}px; color: ${m.color}; font-weight: 800;">${m.value}</div>
          <div style="font-size: ${config.bodySize}px; color: #64748B; margin-top: 8px;">${m.label}</div>
        </div>
      `).join("")}
    </div>
    <div style="background: #F1F5F9; padding: 20px 24px; border-radius: 12px; border-left: 4px solid #3B82F6;">
      <strong style="color: #1E40AF;">Key Insight:</strong>
      <span style="color: #475569; margin-left: 8px;">Average of ${data.totalOpenRoles > 0 ? Math.round(data.totalApplicants / data.totalOpenRoles) : 0} applicants per open role. ${data.hiresYTD} hires made in ${data.currentYear} so far.</span>
    </div>
  `;
}

function renderPipelineHTML(data: GreenhouseMetrics, config: any): string {
  const maxCount = Math.max(...data.pipeline.map((p) => p.count));
  const colors = ["#3B82F6", "#8B5CF6", "#F97316", "#F59E0B", "#10B981"];

  return `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      ${data.pipeline.map((stage, i) => {
        const width = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
        const offset = (100 - width) / 2;
        return `
          <div style="display: flex; align-items: center; gap: 20px;">
            <div style="width: 180px; font-size: ${config.subtitleSize}px; color: #0F172A; font-weight: 600;">${stage.stage}</div>
            <div style="flex: 1; height: 40px; background: #F1F5F9; border-radius: 8px; overflow: hidden; position: relative;">
              <div style="position: absolute; left: ${offset}%; width: ${width}%; height: 100%; background: ${colors[i]}; border-radius: 8px; transition: all 0.3s;"></div>
            </div>
            <div style="width: 60px; height: 40px; background: ${colors[i]}; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: ${config.bodySize + 2}px;">${stage.count}</div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderDepartmentsHTML(data: GreenhouseMetrics, config: any): string {
  const maxApplicants = Math.max(...data.departmentBreakdown.map((d) => d.totalApplicants));

  return `
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
      ${data.departmentBreakdown.slice(0, 6).map((dept) => {
        const barWidth = maxApplicants > 0 ? (dept.totalApplicants / maxApplicants) * 100 : 0;
        return `
          <div style="background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #E2E8F0;">
            <div style="font-size: ${config.subtitleSize}px; color: #0F172A; font-weight: 700; margin-bottom: 12px;">${dept.name}</div>
            <div style="display: flex; align-items: baseline; gap: 6px; margin-bottom: 12px;">
              <span style="font-size: ${config.titleSize * 0.8}px; color: #3B82F6; font-weight: 800;">${dept.openRoles}</span>
              <span style="font-size: ${config.bodySize - 1}px; color: #64748B;">open roles</span>
            </div>
            <div style="height: 8px; background: #F1F5F9; border-radius: 4px; overflow: hidden;">
              <div style="width: ${barWidth}%; height: 100%; background: #3B82F6; border-radius: 4px;"></div>
            </div>
            <div style="font-size: ${config.bodySize - 2}px; color: #64748B; margin-top: 6px; text-align: right;">${dept.totalApplicants} applicants</div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderHiresHTML(data: GreenhouseMetrics, config: any): string {
  return `
    <div style="display: flex; gap: 16px; margin-bottom: 24px;">
      <div style="background: #3B82F6; padding: 24px 40px; border-radius: 12px; text-align: center;">
        <div style="font-size: ${config.titleSize * 1.2}px; color: white; font-weight: 800;">${data.hiresYTD}</div>
        <div style="font-size: ${config.bodySize}px; color: #BFDBFE;">${data.currentYear} YTD</div>
      </div>
      <div style="background: #64748B; padding: 24px 40px; border-radius: 12px; text-align: center;">
        <div style="font-size: ${config.titleSize * 1.2}px; color: white; font-weight: 800;">${data.hiresPreviousYear}</div>
        <div style="font-size: ${config.bodySize}px; color: #CBD5E1;">${data.previousYear} Total</div>
      </div>
    </div>
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      ${data.hiresYTDByRole.slice(0, 8).map((role, i) => `
        <div style="display: flex; align-items: center; padding: 16px 20px; background: ${i % 2 === 0 ? 'white' : '#F8FAFC'}; border-bottom: 1px solid #E2E8F0;">
          <div style="flex: 1; font-size: ${config.bodySize}px; color: #0F172A;">${role.title}</div>
          <div style="width: 150px; font-size: ${config.bodySize - 1}px; color: #64748B;">${role.department}</div>
          <div style="width: 50px; height: 28px; background: #3B82F6; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: ${config.bodySize}px;">${role.hires}</div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderOpenRolesHTML(data: GreenhouseMetrics, config: any): string {
  const colors = ["#3B82F6", "#8B5CF6", "#F97316", "#F59E0B", "#10B981"];

  return `
    <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
      <div style="display: flex; background: #3B82F6; padding: 14px 20px;">
        <div style="flex: 2; color: white; font-weight: 600; font-size: ${config.bodySize}px;">Role</div>
        <div style="width: 120px; color: white; font-weight: 600; font-size: ${config.bodySize}px;">Department</div>
        <div style="width: 70px; color: white; font-weight: 600; font-size: ${config.bodySize}px; text-align: center;">Applied</div>
        <div style="width: 70px; color: white; font-weight: 600; font-size: ${config.bodySize}px; text-align: center;">Screen</div>
        <div style="width: 70px; color: white; font-weight: 600; font-size: ${config.bodySize}px; text-align: center;">Interview</div>
        <div style="width: 60px; color: white; font-weight: 600; font-size: ${config.bodySize}px; text-align: center;">Final</div>
        <div style="width: 60px; color: white; font-weight: 600; font-size: ${config.bodySize}px; text-align: center;">Offer</div>
      </div>
      ${data.openRoles.slice(0, 10).map((role, i) => `
        <div style="display: flex; align-items: center; padding: 14px 20px; background: ${i % 2 === 0 ? 'white' : '#F8FAFC'}; border-bottom: 1px solid #E2E8F0;">
          <div style="flex: 2; font-size: ${config.bodySize}px; color: #0F172A;">${role.title.length > 35 ? role.title.substring(0, 32) + "..." : role.title}</div>
          <div style="width: 120px; font-size: ${config.bodySize - 1}px; color: #64748B;">${role.department}</div>
          <div style="width: 70px; text-align: center; color: ${colors[0]}; font-weight: 700;">${role.stages.applied}</div>
          <div style="width: 70px; text-align: center; color: ${colors[1]}; font-weight: 700;">${role.stages.phoneScreen}</div>
          <div style="width: 70px; text-align: center; color: ${colors[2]}; font-weight: 700;">${role.stages.interview}</div>
          <div style="width: 60px; text-align: center; color: ${colors[3]}; font-weight: 700;">${role.stages.finalRound}</div>
          <div style="width: 60px; text-align: center; color: ${colors[4]}; font-weight: 700;">${role.stages.offer}</div>
        </div>
      `).join("")}
    </div>
  `;
}

// ============================================
// EXCEL EXPORT
// ============================================
export async function exportToExcel({ data, sections, reportName = "RecruitMetrics Report" }: ExportData) {
  const wb = XLSX.utils.book_new();

  for (const section of sections) {
    let sheetData: any[][] = [];

    switch (section.id) {
      case "summary":
        sheetData = [
          [reportName],
          ["Generated", new Date().toLocaleDateString()],
          [],
          ["Metric", "Value"],
          ["Open Roles", data.totalOpenRoles],
          ["Total Active Applicants", data.totalApplicants],
          [`Hires ${data.currentYear} YTD`, data.hiresYTD],
          [`Hires ${data.previousYear} Total`, data.hiresPreviousYear],
          [],
          ["Avg Applicants per Role", data.totalOpenRoles > 0 ? Math.round(data.totalApplicants / data.totalOpenRoles) : 0],
        ];
        break;
      case "pipeline":
        sheetData = [
          ["Pipeline Stage", "Count", "% of Total"],
          ...data.pipeline.map((p) => [
            p.stage,
            p.count,
            data.pipeline[0]?.count > 0 ? `${((p.count / data.pipeline[0].count) * 100).toFixed(1)}%` : "0%",
          ]),
        ];
        break;
      case "departments":
        sheetData = [
          ["Department", "Open Roles", "Total Applicants", "Avg per Role"],
          ...data.departmentBreakdown.map((d) => [
            d.name,
            d.openRoles,
            d.totalApplicants,
            d.openRoles > 0 ? Math.round(d.totalApplicants / d.openRoles) : 0,
          ]),
        ];
        break;
      case "hires":
        sheetData = [
          [`${data.currentYear} Hires by Role`],
          ["Role", "Department", "Hires"],
          ...data.hiresYTDByRole.map((r) => [r.title, r.department, r.hires]),
          [],
          [`${data.previousYear} Hires by Role`],
          ["Role", "Department", "Hires"],
          ...data.hiresPreviousYearByRole.map((r) => [r.title, r.department, r.hires]),
        ];
        break;
      case "openRoles":
        sheetData = [
          ["Role", "Department", "Applied", "Phone Screen", "Interview", "Final Round", "Offer", "Total Applicants"],
          ...data.openRoles.map((r) => [
            r.title,
            r.department,
            r.stages.applied,
            r.stages.phoneScreen,
            r.stages.interview,
            r.stages.finalRound,
            r.stages.offer,
            r.totalApplicants,
          ]),
        ];
        break;
    }

    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    const maxWidths = sheetData[0]?.map((_, colIndex) =>
      Math.max(...sheetData.map((row) => String(row[colIndex] ?? "").length))
    ) || [];
    ws["!cols"] = maxWidths.map((w) => ({ wch: Math.min(w + 2, 50) }));

    XLSX.utils.book_append_sheet(wb, ws, section.label.substring(0, 31));
  }

  const sanitizedName = reportName.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_');
  const blob = new Blob([XLSX.write(wb, { bookType: "xlsx", type: "array" })], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  downloadBlob(blob, `${sanitizedName}_${new Date().toISOString().split("T")[0]}.xlsx`);
}
