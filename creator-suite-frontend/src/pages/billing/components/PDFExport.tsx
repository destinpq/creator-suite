import React from 'react';
import { Button, message } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { OrganizationBill } from '../service';
import { getModelDisplayName } from '../utils';
import dayjs from 'dayjs';

interface PDFExportProps {
  billingData: OrganizationBill;
  loading?: boolean;
}

const PDFExport: React.FC<PDFExportProps> = ({ billingData, loading = false }) => {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const generatePDF = async () => {
    try {
      message.loading({ content: 'Generating PDF...', key: 'pdf-generation' });

      // Create PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Helper function to add new page if needed
      const checkPageBreak = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Header - DestinPQ Branding with better styling
      pdf.setFontSize(28);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DestinPQ', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      pdf.text('AI Content Generation Platform', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Decorative horizontal line
      pdf.setLineWidth(1);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 20;

      // Invoice Title with better spacing
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Billing Statement', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 25;

      // Organization info in a more structured layout
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bill To:', margin, yPosition);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(11);
      pdf.text(billingData.organization_name, margin + 5, yPosition);
      yPosition += 20;

      // Billing details in two columns
      const leftColumnX = margin;
      const rightColumnX = pageWidth / 2 + 10;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Billing Period:', leftColumnX, yPosition);
      pdf.text('Generated:', rightColumnX, yPosition);
      yPosition += 6;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(
        `${dayjs(billingData.billing_period_start).locale('en').format('MMM DD, YYYY')} - ${dayjs(billingData.billing_period_end).locale('en').format('MMM DD, YYYY')}`, 
        leftColumnX, 
        yPosition
      );
      pdf.text(dayjs().locale('en').format('MMM DD, YYYY HH:mm'), rightColumnX, yPosition);
      yPosition += 15;

      // Total amount in a highlighted box
      const boxX = pageWidth - margin - 60;
      const boxY = yPosition;
      const boxWidth = 55;
      const boxHeight = 20;
      
      // Draw box
      pdf.setFillColor(245, 245, 245);
      pdf.rect(boxX, boxY, boxWidth, boxHeight, 'F');
      pdf.setLineWidth(0.5);
      pdf.rect(boxX, boxY, boxWidth, boxHeight, 'S');
      
      // Add text in box
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text('Total Amount', boxX + boxWidth / 2, boxY + 6, { align: 'center' });
      pdf.setFontSize(14);
      pdf.text(formatCurrency(billingData.total_cost), boxX + boxWidth / 2, boxY + 15, { align: 'center' });
      
      yPosition += 35;

      // Summary Statistics with better styling
      checkPageBreak(50);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Summary Statistics', margin, yPosition);
      
      // Underline for section title
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPosition + 2, margin + 50, yPosition + 2);
      yPosition += 15;

      // Summary table
      const summaryData = [
        ['Total Generations', billingData.total_generations.toString()],
        ['Total Cost', formatCurrency(billingData.total_cost)],
        ['Average Cost per Generation', formatCurrency(billingData.total_cost / billingData.total_generations || 0)]
      ];

      autoTable(pdf, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 3,
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [240, 240, 240],
          fontStyle: 'bold'
        },
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40, halign: 'right' }
        }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;

      // Usage by Type with better styling
      checkPageBreak(50);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Usage by Generation Type', margin, yPosition);
      
      // Underline for section title
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPosition + 2, margin + 65, yPosition + 2);
      yPosition += 15;

      const typeData = Object.entries(billingData.usage_by_type).map(([type, count]) => [
        type.charAt(0).toUpperCase() + type.slice(1),
        count.toString()
      ]);

      autoTable(pdf, {
        startY: yPosition,
        head: [['Generation Type', 'Count']],
        body: typeData,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 3,
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [240, 240, 240],
          fontStyle: 'bold'
        },
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 40, halign: 'right' }
        }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;

      // Usage by Model with better styling
      checkPageBreak(50);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Usage by Model', margin, yPosition);
      
      // Underline for section title
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPosition + 2, margin + 45, yPosition + 2);
      yPosition += 15;

      const modelData = Object.entries(billingData.usage_by_model).map(([model, count]) => [
        getModelDisplayName(model),
        count.toString()
      ]);

      autoTable(pdf, {
        startY: yPosition,
        head: [['Model', 'Count']],
        body: modelData,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 3,
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        },
        headStyles: {
          fillColor: [240, 240, 240],
          fontStyle: 'bold'
        },
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 40, halign: 'right' }
        }
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;

      // Detailed Generations Table with better styling
      checkPageBreak(50);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Detailed Usage Report', margin, yPosition);
      
      // Underline for section title
      pdf.setLineWidth(0.3);
      pdf.line(margin, yPosition + 2, margin + 60, yPosition + 2);
      yPosition += 15;

      // Prepare table data
      const tableData = billingData.generations.map(generation => [
        dayjs(generation.created_at).locale('en').format('MMM DD, YYYY'),
        generation.user_name,
        generation.generation_type.charAt(0).toUpperCase() + generation.generation_type.slice(1),
        getModelDisplayName(generation.model_used),
        formatCurrency(generation.cost)
      ]);

      // Generate the main table with automatic pagination
      autoTable(pdf, {
        startY: yPosition,
        head: [['Date', 'User', 'Type', 'Model', 'Cost']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 2,
          textColor: [0, 0, 0],
          fillColor: [255, 255, 255],
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [240, 240, 240],
          fontStyle: 'bold',
          fontSize: 10
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        margin: { left: margin, right: margin },
        tableWidth: 'auto',
        columnStyles: {
          0: { cellWidth: 25 }, // Date
          1: { cellWidth: 35 }, // User
          2: { cellWidth: 20 }, // Type
          3: { cellWidth: 35 }, // Model
          4: { cellWidth: 25, halign: 'right' } // Cost
        },
        // Add page numbers and continue table across pages
        didDrawPage: (data) => {
          // Add page number
          const pageNumber = pdf.internal.getCurrentPageInfo().pageNumber;
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(
            `Page ${pageNumber}`,
            pageWidth - margin,
            pageHeight - 10,
            { align: 'right' }
          );
        }
      });

      // Add footer on last page
      const finalY = (pdf as any).lastAutoTable.finalY || yPosition;
      const currentPage = pdf.internal.getCurrentPageInfo().pageNumber;
      
      // Check if we need space for footer
      if (finalY > pageHeight - 40) {
        pdf.addPage();
      }

      // Footer
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const footerY = Math.max(finalY + 20, pageHeight - 30);
      
      pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      pdf.text('DestinPQ - AI Content Generation Platform', pageWidth / 2, footerY + 5, { align: 'center' });
      pdf.text(`Generated on ${dayjs().locale('en').format('MMMM DD, YYYY [at] HH:mm')}`, pageWidth / 2, footerY + 12, { align: 'center' });

      // Generate filename
      const filename = `DestinPQ_Billing_${billingData.organization_name.replace(/[^a-zA-Z0-9]/g, '_')}_${dayjs(billingData.billing_period_start).format('YYYY-MM-DD')}_to_${dayjs(billingData.billing_period_end).format('YYYY-MM-DD')}.pdf`;

      // Save the PDF
      pdf.save(filename);

      message.success({ content: 'PDF generated successfully!', key: 'pdf-generation' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      message.error({ content: 'Failed to generate PDF', key: 'pdf-generation' });
    }
  };

  return (
    <Button
      type="primary"
      icon={<FilePdfOutlined />}
      onClick={generatePDF}
      loading={loading}
      style={{ marginLeft: 8 }}
    >
      Export PDF
    </Button>
  );
};

export default PDFExport;
