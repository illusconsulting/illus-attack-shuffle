import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';

export function exportPDF(gridData) {
  const doc = new jsPDF();
  doc.text('Grid Export', 10, 10);
  gridData.forEach((row, index) => {
    doc.text(JSON.stringify(row), 10, 20 + index * 10);
  });
  doc.save('grid-export.pdf');
}

export function exportCSV(gridData) {
  const csv = gridData.map(row => Object.values(row).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  saveAs(blob, 'grid-export.csv');
}
