/**
 * PDF Generator for Laws and Analysis Results
 * Uses jsPDF and html2canvas to generate PDF reports
 */

export async function generateLawPDF(lawData, analysisData = null) {
  try {
    // Dynamically import jsPDF and html2canvas
    const { jsPDF } = await import('jspdf');
    const html2canvas = await import('html2canvas').then(m => m.default);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let yPosition = margin;

    // Helper function to add text with wrapping
    const addWrappedText = (text, x, y, maxWidth, fontSize = 11) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * 7);
    };

    // Header with title
    pdf.setFillColor(31, 41, 55); // Dark slate color
    pdf.rect(0, 0, pageWidth, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text('รายงานวิเคราะห์กฎหมาย', margin, 20);

    yPosition = 40;
    pdf.setTextColor(0, 0, 0);

    // Law Information Section
    if (lawData) {
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      yPosition = addWrappedText('ข้อมูลกฎหมาย', margin, yPosition, pageWidth - 2 * margin);

      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);

      // Title
      yPosition = addWrappedText(`ชื่อกฎหมาย: ${lawData.title || 'ไม่ระบุ'}`, margin, yPosition + 5, pageWidth - 2 * margin);

      // Law Type
      if (lawData.lawType) {
        yPosition = addWrappedText(`ประเภท: ${lawData.lawType}`, margin, yPosition + 3, pageWidth - 2 * margin);
      }

      // Category
      if (lawData.safetyCategory) {
        yPosition = addWrappedText(`หมวดหมู่: ${lawData.safetyCategory}`, margin, yPosition + 3, pageWidth - 2 * margin);
      }

      // Effective Date
      if (lawData.effectiveDate || lawData.publishedDate) {
        const dateStr = lawData.effectiveDate || lawData.publishedDate;
        yPosition = addWrappedText(`วันที่มีผลบังคับใช้: ${dateStr}`, margin, yPosition + 3, pageWidth - 2 * margin);
      }

      // Source/Link
      if (lawData.source || lawData.link) {
        yPosition = addWrappedText(`แหล่งที่มา: ${lawData.source || 'ราชกิจจานุเบกษา'}`, margin, yPosition + 3, pageWidth - 2 * margin);
      }
    }

    // Analysis Results Section
    if (analysisData) {
      yPosition += 10;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(12);
      yPosition = addWrappedText('ผลการวิเคราะห์', margin, yPosition, pageWidth - 2 * margin);

      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);

      // Summary
      if (analysisData.summary) {
        yPosition += 5;
        pdf.setFont(undefined, 'bold');
        yPosition = addWrappedText('สรุปผล:', margin, yPosition, pageWidth - 2 * margin);
        pdf.setFont(undefined, 'normal');
        yPosition = addWrappedText(analysisData.summary, margin + 5, yPosition + 2, pageWidth - 2 * margin - 5);
      }

      // Key Points
      if (analysisData.keyPoints && analysisData.keyPoints.length > 0) {
        yPosition += 5;
        pdf.setFont(undefined, 'bold');
        yPosition = addWrappedText('จุดสำคัญ:', margin, yPosition, pageWidth - 2 * margin);
        pdf.setFont(undefined, 'normal');
        
        analysisData.keyPoints.slice(0, 5).forEach((point) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          yPosition = addWrappedText(`• ${point}`, margin + 5, yPosition + 2, pageWidth - 2 * margin - 5);
        });
      }

      // Action Items
      if (analysisData.actionItems && analysisData.actionItems.length > 0) {
        yPosition += 5;
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont(undefined, 'bold');
        yPosition = addWrappedText('การปฏิบัติที่จำเป็น:', margin, yPosition, pageWidth - 2 * margin);
        pdf.setFont(undefined, 'normal');
        
        analysisData.actionItems.slice(0, 5).forEach((item) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          yPosition = addWrappedText(`✓ ${item}`, margin + 5, yPosition + 2, pageWidth - 2 * margin - 5);
        });
      }

      // Affected Parties
      if (analysisData.affectedParties && analysisData.affectedParties.length > 0) {
        yPosition += 5;
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont(undefined, 'bold');
        yPosition = addWrappedText('บุคคลที่เกี่ยวข้อง:', margin, yPosition, pageWidth - 2 * margin);
        pdf.setFont(undefined, 'normal');
        yPosition = addWrappedText(analysisData.affectedParties.join(', '), margin + 5, yPosition + 2, pageWidth - 2 * margin - 5);
      }

      // Penalties
      if (analysisData.penalties && analysisData.penalties.length > 0) {
        yPosition += 5;
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont(undefined, 'bold');
        yPosition = addWrappedText('บทลงโทษ:', margin, yPosition, pageWidth - 2 * margin);
        pdf.setFont(undefined, 'normal');
        
        analysisData.penalties.slice(0, 3).forEach((penalty) => {
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = margin;
          }
          yPosition = addWrappedText(`⚠ ${penalty}`, margin + 5, yPosition + 2, pageWidth - 2 * margin - 5);
        });
      }

      // Review Frequency
      if (analysisData.reviewFrequency) {
        yPosition += 5;
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.setFont(undefined, 'bold');
        yPosition = addWrappedText('ความถี่ในการทบทวน:', margin, yPosition, pageWidth - 2 * margin);
        pdf.setFont(undefined, 'normal');
        yPosition = addWrappedText(analysisData.reviewFrequency, margin + 5, yPosition + 2, pageWidth - 2 * margin - 5);
      }
    }

    // Footer
    yPosition = pageHeight - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    const currentDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.text(`สร้างเมื่อ: ${currentDate}`, margin, yPosition);

    // Return PDF as blob
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

export async function downloadLawPDF(lawData, analysisData = null, filename = 'law-analysis.pdf') {
  try {
    const pdfBlob = await generateLawPDF(lawData, analysisData);
    
    // Create a download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}

export async function generateComplianceChecklistPDF(checklist, companyName = '') {
  try {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    let yPosition = margin;

    const addWrappedText = (text, x, y, maxWidth, fontSize = 11) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * 7);
    };

    // Header
    pdf.setFillColor(34, 197, 94); // Green color for compliance
    pdf.rect(0, 0, pageWidth, 30, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text('รายการตรวจสอบการปฏิบัติตามกฎหมาย', margin, 20);

    yPosition = 40;
    pdf.setTextColor(0, 0, 0);

    // Company Name
    if (companyName) {
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      yPosition = addWrappedText(`สถานประกอบการ: ${companyName}`, margin, yPosition, pageWidth - 2 * margin);
    }

    // Checklist Items
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    
    checklist.forEach((item, index) => {
      if (yPosition > pageHeight - 20) {
        pdf.addPage();
        yPosition = margin;
      }

      // Checkbox appearance
      const checkboxSize = 5;
      if (item.completed) {
        pdf.setFillColor(34, 197, 94);
        pdf.rect(margin, yPosition - 3, checkboxSize, checkboxSize, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.text('✓', margin + 1.5, yPosition);
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
      } else {
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(margin, yPosition - 3, checkboxSize, checkboxSize);
      }

      // Item text
      yPosition = addWrappedText(
        `${item.text}`,
        margin + 10,
        yPosition,
        pageWidth - 2 * margin - 10
      );
      yPosition += 3;
    });

    // Footer
    yPosition = pageHeight - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    const currentDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.text(`สร้างเมื่อ: ${currentDate}`, margin, yPosition);

    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating checklist PDF:', error);
    throw error;
  }
}
