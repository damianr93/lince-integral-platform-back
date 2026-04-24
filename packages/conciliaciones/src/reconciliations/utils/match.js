"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchOneToOne = matchOneToOne;
exports.matchManyToOneByComment = matchManyToOneByComment;
const dayjs_1 = __importDefault(require("dayjs"));
const normalize_1 = require("./normalize");
function normComment(s) {
    if (s == null)
        return '';
    return String(s).trim().toLowerCase();
}
function daysDiff(a, b) {
    if (!a || !b)
        return 999999;
    return Math.abs((0, dayjs_1.default)(a).diff((0, dayjs_1.default)(b), 'day'));
}
function daysDiffMin(ext, issue, due) {
    return Math.min(daysDiff(ext, issue), daysDiff(ext, due));
}
function matchOneToOne(systemLines, extractLines, windowDays) {
    const extractByKey = new Map();
    for (const ext of extractLines) {
        const key = (0, normalize_1.toAmountKeySafe)(ext.amountKey);
        const list = extractByKey.get(key) || [];
        list.push(ext);
        extractByKey.set(key, list);
    }
    const usedExtract = new Set();
    const usedSystem = new Set();
    const matches = [];
    for (const sys of systemLines) {
        if (usedSystem.has(sys.id))
            continue;
        const key = (0, normalize_1.toAmountKeySafe)(sys.amountKey);
        const pool = extractByKey.get(key) || [];
        let best = null;
        let bestDelta = 0;
        for (const ext of pool) {
            if (usedExtract.has(ext.id))
                continue;
            const delta = daysDiffMin(ext.date, sys.issueDate, sys.dueDate);
            if (windowDays > 0 && delta > windowDays)
                continue;
            if (!best || delta < bestDelta) {
                best = ext;
                bestDelta = delta;
            }
        }
        if (best) {
            matches.push({ extractId: best.id, systemId: sys.id, deltaDays: bestDelta });
            usedExtract.add(best.id);
            usedSystem.add(sys.id);
        }
    }
    return { matches, usedExtract, usedSystem };
}
function matchManyToOneByComment(systemLines, extractLines, usedExtract, usedSystem) {
    const extractByKey = new Map();
    for (const ext of extractLines) {
        if (usedExtract.has(ext.id))
            continue;
        const key = (0, normalize_1.toAmountKeySafe)(ext.amountKey);
        const list = extractByKey.get(key) || [];
        list.push(ext);
        extractByKey.set(key, list);
    }
    const byComment = new Map();
    for (const sys of systemLines) {
        if (usedSystem.has(sys.id))
            continue;
        const key = normComment(sys.description);
        const list = byComment.get(key) || [];
        list.push(sys);
        byComment.set(key, list);
    }
    const extra = [];
    for (const [, group] of byComment) {
        if (group.length === 0)
            continue;
        const totalAmount = group.reduce((s, l) => s + l.amount, 0);
        const totalKey = (0, normalize_1.toAmountKey)(totalAmount);
        const pool = extractByKey.get(totalKey) || [];
        const ext = pool.find((e) => !usedExtract.has(e.id));
        if (!ext)
            continue;
        for (const sys of group) {
            extra.push({ extractId: ext.id, systemId: sys.id, deltaDays: 0 });
            usedSystem.add(sys.id);
        }
        usedExtract.add(ext.id);
    }
    return extra;
}
//# sourceMappingURL=match.js.map