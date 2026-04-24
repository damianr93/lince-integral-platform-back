"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAmount = parseAmount;
exports.parseDate = parseDate;
exports.toAmountKey = toAmountKey;
exports.toAmountKeySafe = toAmountKeySafe;
exports.extractAmount = extractAmount;
exports.normalizeText = normalizeText;
const dayjs_1 = __importDefault(require("dayjs"));
const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30));
function parseAmount(value) {
    if (value === null || value === undefined) {
        return null;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value !== 'string') {
        return null;
    }
    let text = value.trim();
    if (!text)
        return null;
    let negative = false;
    if (text.startsWith('(') && text.endsWith(')')) {
        negative = true;
        text = text.slice(1, -1);
    }
    if (text.includes('-')) {
        const minusCount = (text.match(/-/g) || []).length;
        if (minusCount % 2 === 1)
            negative = true;
        text = text.replace(/-/g, '');
    }
    text = text.replace(/[^0-9,\.]/g, '');
    if (!text)
        return null;
    const lastComma = text.lastIndexOf(',');
    const lastDot = text.lastIndexOf('.');
    if (lastComma > -1 && lastDot > -1) {
        if (lastComma > lastDot) {
            text = text.replace(/\./g, '').replace(',', '.');
        }
        else {
            text = text.replace(/,/g, '');
        }
    }
    else if (lastComma > -1) {
        text = text.replace(',', '.');
    }
    const parsed = Number(text);
    if (!Number.isFinite(parsed))
        return null;
    return negative ? -parsed : parsed;
}
function parseDate(value) {
    if (!value)
        return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value;
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
        const date = new Date(EXCEL_EPOCH.getTime() + value * 86400000);
        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }
    if (typeof value === 'string') {
        const text = value.trim();
        if (!text)
            return null;
        const ddmmyyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
        const match = text.match(ddmmyyyy);
        if (match) {
            const day = Number(match[1]);
            const month = Number(match[2]);
            let year = Number(match[3]);
            if (year < 100)
                year += 2000;
            const date = new Date(year, month - 1, day);
            if (!Number.isNaN(date.getTime()))
                return date;
        }
        const parsed = (0, dayjs_1.default)(text);
        if (parsed.isValid())
            return parsed.toDate();
    }
    return null;
}
function toAmountKey(amount, decimals = 2) {
    const factor = Math.pow(10, decimals);
    return Math.round(amount * factor);
}
function toAmountKeySafe(value) {
    if (typeof value === 'string')
        return Math.round(Number(value));
    return Math.round(value);
}
function extractAmount(row, mode, amountCol, debeCol, haberCol) {
    if (mode === 'single') {
        if (!amountCol)
            return null;
        return parseAmount(row[amountCol]);
    }
    const debe = debeCol ? parseAmount(row[debeCol]) : null;
    const haber = haberCol ? parseAmount(row[haberCol]) : null;
    if (debe && debe !== 0)
        return Math.abs(debe);
    if (haber && haber !== 0)
        return -Math.abs(haber);
    if (debe === 0 && haber === 0)
        return 0;
    return null;
}
function normalizeText(text) {
    return text?.toString().trim() || null;
}
//# sourceMappingURL=normalize.js.map