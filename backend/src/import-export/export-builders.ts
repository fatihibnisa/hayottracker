import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import { Response } from 'express';
import { DAY_NAMES } from '../common/constants';

type ScheduleRow = { dayOfWeek: number; subject: string; startTime: string; endTime: string | null; room: string | null };
type TxRow = { date: string; type: string; category: string | null; amount: number; party: string | null; reason: string | null };

function groupSchedule(rows: ScheduleRow[]) {
  return DAY_NAMES.map((name, idx) => ({ name, items: rows.filter((r) => r.dayOfWeek === idx) }));
}

export async function scheduleToXlsx(res: Response, rows: ScheduleRow[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Dars jadvali');
  ws.columns = [
    { header: 'Kun', key: 'day', width: 14 },
    { header: 'Fan', key: 'subject', width: 28 },
    { header: 'Boshlanish', key: 'start', width: 12 },
    { header: 'Tugash', key: 'end', width: 12 },
    { header: 'Xona', key: 'room', width: 12 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const group of groupSchedule(rows)) {
    for (const item of group.items) {
      ws.addRow({ day: group.name, subject: item.subject, start: item.startTime, end: item.endTime || '', room: item.room || '' });
    }
  }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="dars-jadvali.xlsx"');
  await wb.xlsx.write(res);
  res.end();
}

export function scheduleToPdf(res: Response, rows: ScheduleRow[]) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="dars-jadvali.pdf"');
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  doc.fontSize(18).text('Dars jadvali', { align: 'center' });
  doc.moveDown();
  for (const group of groupSchedule(rows)) {
    if (group.items.length === 0) continue;
    doc.fontSize(14).text(group.name, { underline: true });
    doc.moveDown(0.3);
    for (const item of group.items) {
      doc.fontSize(11).text(`${item.startTime}${item.endTime ? ' - ' + item.endTime : ''}  |  ${item.subject}${item.room ? '  |  xona: ' + item.room : ''}`);
    }
    doc.moveDown(0.6);
  }
  doc.end();
}

export async function scheduleToDocx(res: Response, rows: ScheduleRow[]) {
  const children: any[] = [new Paragraph({ text: 'Dars jadvali', heading: HeadingLevel.TITLE })];
  for (const group of groupSchedule(rows)) {
    if (group.items.length === 0) continue;
    children.push(new Paragraph({ text: group.name, heading: HeadingLevel.HEADING_2 }));
    const tableRows = [
      new TableRow({
        children: ['Boshlanish', 'Tugash', 'Fan', 'Xona'].map(
          (h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] }),
        ),
      }),
      ...group.items.map(
        (item) =>
          new TableRow({
            children: [item.startTime, item.endTime || '-', item.subject, item.room || '-'].map(
              (v) => new TableCell({ children: [new Paragraph(String(v))] }),
            ),
          }),
      ),
    ];
    children.push(new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
    children.push(new Paragraph({ text: '' }));
  }
  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', 'attachment; filename="dars-jadvali.docx"');
  res.send(buffer);
}

function financeTotals(rows: TxRow[]) {
  const income = rows.filter((r) => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter((r) => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  const savings = rows.filter((r) => r.type === 'expense' && r.category === "Jamg'arma").reduce((s, r) => s + r.amount, 0);
  return { income, expense, savings };
}

export async function financeToXlsx(res: Response, rows: TxRow[], from: string, to: string) {
  const { income, expense, savings } = financeTotals(rows);
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Moliyaviy hisobot');
  ws.addRow([`Hisobot: ${from} dan ${to} gacha`]);
  ws.addRow([]);
  ws.addRow(['Jami kirim', income]);
  ws.addRow(['Jami chiqim', expense]);
  ws.addRow(['Balans', income - expense]);
  ws.addRow(["Jamg'arma", savings]);
  ws.addRow([]);
  ws.addRow(['Sana', 'Turi', "Bo'lim", 'Summa', 'Kimdan/Kimga', 'Sababi']).font = { bold: true };
  for (const r of rows) {
    ws.addRow([r.date, r.type === 'income' ? 'Kirim' : 'Chiqim', r.category, r.amount, r.party || '', r.reason || '']);
  }
  ws.columns.forEach((c) => (c.width = 20));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="moliyaviy-hisobot.xlsx"');
  await wb.xlsx.write(res);
  res.end();
}

export function financeToPdf(res: Response, rows: TxRow[], from: string, to: string) {
  const { income, expense, savings } = financeTotals(rows);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="moliyaviy-hisobot.pdf"');
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);
  doc.fontSize(18).text('Moliyaviy hisobot', { align: 'center' });
  doc.fontSize(10).text(`${from} dan ${to} gacha`, { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Jami kirim: ${income.toLocaleString('uz-UZ')} so'm`);
  doc.text(`Jami chiqim: ${expense.toLocaleString('uz-UZ')} so'm`);
  doc.text(`Balans: ${(income - expense).toLocaleString('uz-UZ')} so'm`);
  doc.text(`Jamg'arma: ${savings.toLocaleString('uz-UZ')} so'm`);
  doc.moveDown();
  doc.fontSize(13).text('Tranzaksiyalar', { underline: true });
  doc.moveDown(0.3);
  for (const r of rows) {
    doc.fontSize(10).text(`${r.date}  |  ${r.type === 'income' ? 'Kirim' : 'Chiqim'}  |  ${r.category}  |  ${r.amount.toLocaleString('uz-UZ')} so'm  |  ${r.party || '-'}  |  ${r.reason || '-'}`);
  }
  doc.end();
}

export async function financeToDocx(res: Response, rows: TxRow[], from: string, to: string) {
  const { income, expense, savings } = financeTotals(rows);
  const children: any[] = [
    new Paragraph({ text: 'Moliyaviy hisobot', heading: HeadingLevel.TITLE }),
    new Paragraph({ text: `${from} dan ${to} gacha` }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: `Jami kirim: ${income.toLocaleString('uz-UZ')} so'm` }),
    new Paragraph({ text: `Jami chiqim: ${expense.toLocaleString('uz-UZ')} so'm` }),
    new Paragraph({ text: `Balans: ${(income - expense).toLocaleString('uz-UZ')} so'm` }),
    new Paragraph({ text: `Jamg'arma: ${savings.toLocaleString('uz-UZ')} so'm` }),
    new Paragraph({ text: '' }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: ['Sana', 'Turi', "Bo'lim", 'Summa', 'Kimdan/Kimga', 'Sababi'].map(
            (h) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })] }),
          ),
        }),
        ...rows.map(
          (r) =>
            new TableRow({
              children: [
                r.date,
                r.type === 'income' ? 'Kirim' : 'Chiqim',
                r.category || '-',
                String(r.amount),
                r.party || '-',
                r.reason || '-',
              ].map((v) => new TableCell({ children: [new Paragraph(String(v))] })),
            }),
        ),
      ],
    }),
  ];
  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', 'attachment; filename="moliyaviy-hisobot.docx"');
  res.send(buffer);
}
