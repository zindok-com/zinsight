/**
 * CSV 만들기·내려받기 (브라우저 전용 download). 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM을 붙인다.
 */
type Cell = string | number | null | undefined;

function escapeCell(value: Cell): string {
    if (value === null || value === undefined) return '';
    let text = String(value);
    // 엑셀 수식 실행 방지 (=, +, -, @로 시작하는 문자열 앞에 ' 추가). 숫자는 그대로
    if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Cell[][]): string {
    return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

export function downloadCsv(filename: string, rows: Cell[][]) {
    const blob = new Blob(['﻿', toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
