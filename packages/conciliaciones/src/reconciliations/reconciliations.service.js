"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto_1 = require("crypto");
const stream_1 = require("stream");
const exceljs_1 = __importDefault(require("exceljs"));
const node_xlsx_1 = __importDefault(require("node-xlsx"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const database_1 = require("@lince/database");
const enums_1 = require("../enums");
const reconciliation_run_entity_1 = require("../entities/reconciliation-run.entity");
const extract_line_entity_1 = require("../entities/extract-line.entity");
const system_line_entity_1 = require("../entities/system-line.entity");
const match_entity_1 = require("../entities/match.entity");
const unmatched_extract_entity_1 = require("../entities/unmatched-extract.entity");
const unmatched_system_entity_1 = require("../entities/unmatched-system.entity");
const run_member_entity_1 = require("../entities/run-member.entity");
const message_entity_1 = require("../entities/message.entity");
const issue_entity_1 = require("../entities/issue.entity");
const issue_comment_entity_1 = require("../entities/issue-comment.entity");
const pending_item_entity_1 = require("../entities/pending-item.entity");
const expense_category_entity_1 = require("../entities/expense-category.entity");
const normalize_1 = require("./utils/normalize");
const match_1 = require("./utils/match");
let ReconciliationsService = class ReconciliationsService {
    constructor(runRepo, extractLineRepo, systemLineRepo, matchRepo, unmatchedExtractRepo, unmatchedSystemRepo, runMemberRepo, messageRepo, issueRepo, issueCommentRepo, pendingItemRepo, categoryRepo, userRepo, dataSource) {
        this.runRepo = runRepo;
        this.extractLineRepo = extractLineRepo;
        this.systemLineRepo = systemLineRepo;
        this.matchRepo = matchRepo;
        this.unmatchedExtractRepo = unmatchedExtractRepo;
        this.unmatchedSystemRepo = unmatchedSystemRepo;
        this.runMemberRepo = runMemberRepo;
        this.messageRepo = messageRepo;
        this.issueRepo = issueRepo;
        this.issueCommentRepo = issueCommentRepo;
        this.pendingItemRepo = pendingItemRepo;
        this.categoryRepo = categoryRepo;
        this.userRepo = userRepo;
        this.dataSource = dataSource;
    }
    async createRun(dto, userId) {
        const windowDays = dto.windowDays ?? 0;
        const cutDate = dto.cutDate ? (0, normalize_1.parseDate)(dto.cutDate) : null;
        let categories = await this.categoryRepo.find({ relations: { rules: true } });
        const enabledIds = Array.isArray(dto.enabledCategoryIds) && dto.enabledCategoryIds.length > 0
            ? new Set(dto.enabledCategoryIds)
            : null;
        if (enabledIds) {
            categories = categories.filter((c) => enabledIds.has(c.id));
        }
        const extractLines = [];
        for (const row of dto.extract.rows) {
            const concept = (0, normalize_1.normalizeText)(dto.extract.mapping.conceptCol
                ? String(row[dto.extract.mapping.conceptCol] ?? '')
                : undefined);
            if (dto.extract.excludeConcepts &&
                concept &&
                dto.extract.excludeConcepts.includes(concept)) {
                continue;
            }
            const amount = (0, normalize_1.extractAmount)(row, dto.extract.mapping.amountMode, dto.extract.mapping.amountCol, dto.extract.mapping.debeCol, dto.extract.mapping.haberCol);
            if (amount === null)
                continue;
            const date = (0, normalize_1.parseDate)(row[dto.extract.mapping.dateCol ?? '']);
            const amountKey = (0, normalize_1.toAmountKey)(amount);
            const categoryId = this.resolveCategory(concept, categories);
            extractLines.push({
                id: (0, crypto_1.randomUUID)(),
                runId: '',
                date,
                concept,
                amount,
                amountKey,
                raw: row,
                categoryId,
                excluded: false,
            });
        }
        const systemLines = [];
        for (const row of dto.system.rows) {
            const amount = (0, normalize_1.extractAmount)(row, dto.system.mapping.amountMode, dto.system.mapping.amountCol, dto.system.mapping.debeCol, dto.system.mapping.haberCol);
            if (amount === null)
                continue;
            const issueDate = dto.system.mapping.issueDateCol
                ? (0, normalize_1.parseDate)(row[dto.system.mapping.issueDateCol])
                : null;
            const dueDate = dto.system.mapping.dueDateCol
                ? (0, normalize_1.parseDate)(row[dto.system.mapping.dueDateCol])
                : null;
            const description = dto.system.mapping.descriptionCol
                ? String(row[dto.system.mapping.descriptionCol] || '')
                : null;
            const amountKey = (0, normalize_1.toAmountKey)(amount);
            systemLines.push({
                id: (0, crypto_1.randomUUID)(),
                runId: '',
                rowIndex: systemLines.length,
                issueDate,
                dueDate,
                amount,
                amountKey,
                description,
                raw: row,
            });
        }
        const run = await this.runRepo.save(this.runRepo.create({
            title: dto.title ?? null,
            bankName: dto.bankName ?? null,
            accountRef: dto.accountRef ?? null,
            windowDays,
            cutDate: cutDate ?? undefined,
            excludeConcepts: (dto.extract.excludeConcepts ?? []),
            enabledCategoryIds: (dto.enabledCategoryIds ?? []),
            createdById: userId,
        }));
        for (const line of extractLines) {
            line.runId = run.id;
        }
        for (const line of systemLines) {
            line.runId = run.id;
        }
        await this.dataSource.transaction(async (manager) => {
            if (extractLines.length > 0) {
                await manager.insert(extract_line_entity_1.ExtractLineEntity, extractLines);
            }
            if (systemLines.length > 0) {
                await manager.insert(system_line_entity_1.SystemLineEntity, systemLines);
            }
            await manager.insert(run_member_entity_1.RunMemberEntity, {
                id: (0, crypto_1.randomUUID)(),
                runId: run.id,
                userId,
                role: enums_1.RunMemberRole.OWNER,
            });
        });
        const systemForMatch = systemLines.map((line) => ({
            id: line.id,
            issueDate: line.issueDate ? new Date(line.issueDate) : null,
            dueDate: line.dueDate ? new Date(line.dueDate) : null,
            amountKey: line.amountKey,
            amount: line.amount,
            description: line.description ?? null,
        }));
        const extractForMatch = extractLines.map((line) => ({
            id: line.id,
            date: line.date ? new Date(line.date) : null,
            amountKey: line.amountKey,
        }));
        const { matches, usedExtract, usedSystem } = (0, match_1.matchOneToOne)(systemForMatch, extractForMatch, windowDays);
        const unmatchedExtract = extractLines
            .filter((line) => !usedExtract.has(line.id))
            .map((line) => ({
            id: (0, crypto_1.randomUUID)(),
            runId: run.id,
            extractLineId: line.id,
        }));
        const unmatchedSystem = systemLines
            .filter((line) => !usedSystem.has(line.id))
            .map((line) => {
            const dateToCompare = line.dueDate ?? line.issueDate ?? null;
            let status = enums_1.UnmatchedSystemStatus.DEFERRED;
            if (cutDate && dateToCompare && dateToCompare <= cutDate) {
                status = enums_1.UnmatchedSystemStatus.OVERDUE;
            }
            return {
                id: (0, crypto_1.randomUUID)(),
                runId: run.id,
                systemLineId: line.id,
                status,
            };
        });
        const matchRows = matches.map((match) => ({
            id: (0, crypto_1.randomUUID)(),
            runId: run.id,
            extractLineId: match.extractId,
            systemLineId: match.systemId,
            deltaDays: match.deltaDays,
        }));
        await this.dataSource.transaction(async (manager) => {
            if (matchRows.length > 0) {
                await manager.insert(match_entity_1.MatchEntity, matchRows);
            }
            if (unmatchedExtract.length > 0) {
                await manager.insert(unmatched_extract_entity_1.UnmatchedExtractEntity, unmatchedExtract);
            }
            if (unmatchedSystem.length > 0) {
                await manager.insert(unmatched_system_entity_1.UnmatchedSystemEntity, unmatchedSystem);
            }
        });
        return {
            runId: run.id,
            matched: matchRows.length,
            onlyExtract: unmatchedExtract.length,
            systemOverdue: unmatchedSystem.filter((u) => u.status === enums_1.UnmatchedSystemStatus.OVERDUE).length,
            systemDeferred: unmatchedSystem.filter((u) => u.status === enums_1.UnmatchedSystemStatus.DEFERRED).length,
        };
    }
    async getRun(runId) {
        const run = await this.runRepo.findOne({
            where: { id: runId },
            relations: {
                matches: true,
                unmatchedExtract: true,
                unmatchedSystem: true,
                members: true,
                messages: true,
                issues: { comments: true },
            },
        });
        if (!run)
            return null;
        const [extractLines, systemLines, pendingItems] = await Promise.all([
            this.extractLineRepo.find({
                where: { runId },
                relations: { category: true },
                select: {
                    id: true,
                    runId: true,
                    date: true,
                    concept: true,
                    amount: true,
                    amountKey: true,
                    categoryId: true,
                    excluded: true,
                    category: { id: true, name: true },
                },
            }),
            this.systemLineRepo.find({
                where: { runId },
                select: {
                    id: true,
                    runId: true,
                    rowIndex: true,
                    issueDate: true,
                    dueDate: true,
                    amount: true,
                    amountKey: true,
                    description: true,
                },
            }),
            this.pendingItemRepo.find({
                where: { runId },
                relations: { systemLine: true },
                select: {
                    id: true,
                    runId: true,
                    area: true,
                    status: true,
                    resolvedAt: true,
                    note: true,
                    systemLineId: true,
                    systemLine: {
                        id: true,
                        runId: true,
                        rowIndex: true,
                        issueDate: true,
                        dueDate: true,
                        amount: true,
                        amountKey: true,
                        description: true,
                    },
                },
            }),
        ]);
        const userIds = new Set();
        userIds.add(run.createdById);
        for (const m of run.members)
            userIds.add(m.userId);
        for (const msg of run.messages)
            userIds.add(msg.authorId);
        for (const issue of run.issues) {
            userIds.add(issue.createdById);
            for (const c of issue.comments)
                userIds.add(c.authorId);
        }
        const users = await this.userRepo.find({
            where: { id: (0, typeorm_2.In)([...userIds]) },
            select: { id: true, email: true, name: true },
        });
        const userMap = new Map(users.map((u) => [u.id, u]));
        const activeExtractIds = new Set(extractLines.filter((l) => !l.excluded).map((l) => l.id));
        const extractAmountById = new Map(extractLines.map((l) => [l.id, l.amount]));
        const systemAmountById = new Map(systemLines.map((l) => [l.id, l.amount]));
        const amountTolerance = 0.01;
        const matchesWithSameAmount = run.matches.filter((m) => {
            if (!activeExtractIds.has(m.extractLineId))
                return false;
            const extAmount = extractAmountById.get(m.extractLineId);
            const sysAmount = systemAmountById.get(m.systemLineId);
            if (extAmount == null || sysAmount == null)
                return false;
            return Math.abs(extAmount - sysAmount) <= amountTolerance;
        });
        const hiddenMatches = run.matches.filter((m) => {
            if (!activeExtractIds.has(m.extractLineId))
                return false;
            const extAmount = extractAmountById.get(m.extractLineId);
            const sysAmount = systemAmountById.get(m.systemLineId);
            if (extAmount == null || sysAmount == null)
                return true;
            return Math.abs(extAmount - sysAmount) > amountTolerance;
        });
        const hiddenExtractIds = new Set(hiddenMatches.map((m) => m.extractLineId));
        const hiddenSystemIds = new Set(hiddenMatches.map((m) => m.systemLineId));
        const baseUnmatchedExtract = run.unmatchedExtract.filter((ue) => activeExtractIds.has(ue.extractLineId));
        const extraUnmatchedExtract = [...hiddenExtractIds]
            .filter((id) => activeExtractIds.has(id))
            .map((extractLineId) => ({
            id: (0, crypto_1.randomUUID)(),
            runId: run.id,
            extractLineId,
        }));
        const extraUnmatchedSystem = [...hiddenSystemIds].map((systemLineId) => {
            const line = systemLines.find((l) => l.id === systemLineId);
            const dateToCompare = line?.dueDate ?? line?.issueDate ?? null;
            let status = enums_1.UnmatchedSystemStatus.DEFERRED;
            if (run.cutDate && dateToCompare && dateToCompare <= run.cutDate) {
                status = enums_1.UnmatchedSystemStatus.OVERDUE;
            }
            return {
                id: (0, crypto_1.randomUUID)(),
                runId: run.id,
                systemLineId,
                status,
            };
        });
        const { extractLines: _ex, systemLines: _sy, pendingItems: _pe, ...runBase } = run;
        return {
            ...runBase,
            excludeConcepts: run.excludeConcepts ?? [],
            extractLines: extractLines.filter((l) => !l.excluded),
            systemLines,
            pendingItems,
            matches: matchesWithSameAmount,
            unmatchedExtract: [...baseUnmatchedExtract, ...extraUnmatchedExtract],
            unmatchedSystem: [...run.unmatchedSystem, ...extraUnmatchedSystem],
            members: run.members.map((m) => ({
                ...m,
                user: userMap.get(m.userId) ?? null,
            })),
            messages: run.messages.map((msg) => ({
                ...msg,
                author: userMap.get(msg.authorId) ?? null,
            })),
            issues: run.issues.map((issue) => ({
                ...issue,
                createdBy: userMap.get(issue.createdById) ?? null,
                comments: issue.comments.map((c) => ({
                    ...c,
                    author: userMap.get(c.authorId) ?? null,
                })),
            })),
        };
    }
    async updateRun(runId, userId, data) {
        await this.assertCanEdit(runId, userId);
        const run = await this.runRepo.findOne({
            where: { id: runId },
            select: { id: true, status: true, createdById: true },
        });
        if (!run)
            throw new common_1.NotFoundException('Run no encontrado');
        if (run.status === enums_1.RunStatus.CLOSED) {
            if (data.status === enums_1.RunStatus.OPEN && run.createdById === userId) {
                await this.runRepo.update({ id: runId }, { status: enums_1.RunStatus.OPEN });
                return this.runRepo.findOne({ where: { id: runId } });
            }
            throw new common_1.ForbiddenException('Conciliación cerrada: solo el creador puede reabrirla');
        }
        const updateData = {};
        if (data.status != null)
            updateData.status = data.status;
        if (data.bankName !== undefined)
            updateData.bankName = data.bankName ?? null;
        if (data.enabledCategoryIds !== undefined)
            updateData.enabledCategoryIds = data.enabledCategoryIds;
        await this.runRepo.update({ id: runId }, updateData);
        return this.runRepo.findOne({ where: { id: runId } });
    }
    async deleteRun(runId, userId, isSuperAdmin = false) {
        if (!isSuperAdmin) {
            await this.assertCanEdit(runId, userId);
        }
        const run = await this.runRepo.findOne({
            where: { id: runId },
            select: { id: true, status: true },
        });
        if (!run)
            throw new common_1.NotFoundException('Run no encontrado');
        if (!isSuperAdmin && run.status !== enums_1.RunStatus.OPEN) {
            throw new common_1.ForbiddenException('Solo se puede borrar una conciliación abierta');
        }
        await this.dataSource.transaction(async (manager) => {
            await manager.delete(match_entity_1.MatchEntity, { runId });
            await manager.delete(unmatched_extract_entity_1.UnmatchedExtractEntity, { runId });
            await manager.delete(unmatched_system_entity_1.UnmatchedSystemEntity, { runId });
            await manager.delete(pending_item_entity_1.PendingItemEntity, { runId });
            await manager.delete(message_entity_1.MessageEntity, { runId });
            await manager.delete(run_member_entity_1.RunMemberEntity, { runId });
            await manager.delete(extract_line_entity_1.ExtractLineEntity, { runId });
            await manager.delete(system_line_entity_1.SystemLineEntity, { runId });
            // Delete issues and their comments (cascade should handle comments)
            const issues = await manager.find(issue_entity_1.IssueEntity, { where: { runId } });
            if (issues.length > 0) {
                const issueIds = issues.map((i) => i.id);
                await manager.delete(issue_comment_entity_1.IssueCommentEntity, { issueId: (0, typeorm_2.In)(issueIds) });
                await manager.delete(issue_entity_1.IssueEntity, { runId });
            }
            await manager.delete(reconciliation_run_entity_1.ReconciliationRunEntity, { id: runId });
        });
        return { deleted: true };
    }
    async addExcludedConcept(runId, userId, concept) {
        const normalized = (concept ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
        if (!normalized)
            throw new common_1.BadRequestException('Concepto requerido');
        return this.addExcludedConcepts(runId, userId, [concept.trim()]);
    }
    async addExcludedConcepts(runId, userId, concepts) {
        await this.assertCanEdit(runId, userId);
        await this.assertRunOpen(runId);
        const run = await this.runRepo.findOne({
            where: { id: runId },
            select: { id: true, excludeConcepts: true },
        });
        if (!run)
            throw new common_1.NotFoundException('Run no encontrado');
        const norm = (s) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
        const current = run.excludeConcepts ?? [];
        const nextConcepts = [...current];
        const normalizedNew = new Set();
        for (const concept of concepts) {
            const n = norm(concept);
            if (!n)
                continue;
            if (current.some((c) => norm(c) === n))
                continue;
            if (normalizedNew.has(n))
                continue;
            normalizedNew.add(n);
            nextConcepts.push(concept.trim());
        }
        if (nextConcepts.length === current.length)
            return this.getRun(runId);
        const linesToExclude = await this.extractLineRepo.find({
            where: { runId, excluded: false },
        });
        const toExclude = linesToExclude.filter((l) => l.concept != null && Array.from(normalizedNew).some((n) => norm(l.concept) === n));
        const extractLineIds = toExclude.map((l) => l.id);
        await this.applyExcludedLines(runId, nextConcepts, extractLineIds);
        return this.getRun(runId);
    }
    async addExcludedByCategory(runId, userId, categoryId) {
        await this.assertCanEdit(runId, userId);
        await this.assertRunOpen(runId);
        const category = await this.categoryRepo.findOne({
            where: { id: categoryId },
            relations: { rules: true },
        });
        if (!category)
            throw new common_1.NotFoundException('Categoría no encontrada');
        const rules = category.rules ?? [];
        if (rules.length === 0) {
            throw new common_1.BadRequestException('La categoría no tiene reglas. Agregá conceptos en Categorías para que coincidan con las líneas del extracto.');
        }
        const run = await this.runRepo.findOne({
            where: { id: runId },
            select: { id: true, excludeConcepts: true },
        });
        if (!run)
            throw new common_1.NotFoundException('Run no encontrado');
        const norm = (s) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
        const current = run.excludeConcepts ?? [];
        const categoryNorm = norm(category.name);
        if (current.some((c) => norm(c) === categoryNorm)) {
            return this.getRun(runId);
        }
        const nextConcepts = [...current, category.name];
        const candidates = await this.extractLineRepo.find({
            where: { runId, excluded: false },
        });
        const toExclude = candidates.filter((line) => this.conceptMatchesCategory(line.concept, category));
        if (toExclude.length === 0)
            return this.getRun(runId);
        const extractLineIds = toExclude.map((l) => l.id);
        await this.applyExcludedLines(runId, nextConcepts, extractLineIds);
        return this.getRun(runId);
    }
    async removeExcludedConcept(runId, userId, concept) {
        await this.assertCanEdit(runId, userId);
        await this.assertRunOpen(runId);
        const norm = (s) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
        const run = await this.runRepo.findOne({
            where: { id: runId },
            select: { id: true, excludeConcepts: true },
        });
        if (!run)
            throw new common_1.NotFoundException('Run no encontrado');
        const current = run.excludeConcepts ?? [];
        const nextConcepts = current.filter((c) => norm(c) !== norm(concept));
        if (nextConcepts.length === current.length)
            return this.getRun(runId);
        const category = await this.categoryRepo.findOne({
            where: { name: (0, typeorm_2.ILike)(concept) },
            relations: { rules: true },
        });
        const excludedLines = await this.extractLineRepo.find({
            where: { runId, excluded: true },
        });
        const toUnexclude = category && (category.rules ?? []).length > 0
            ? excludedLines.filter((line) => this.conceptMatchesCategory(line.concept, category))
            : excludedLines.filter((line) => norm(line.concept) === norm(concept));
        await this.runRepo.update({ id: runId }, { excludeConcepts: nextConcepts });
        if (toUnexclude.length > 0) {
            await this.extractLineRepo.update({ id: (0, typeorm_2.In)(toUnexclude.map((l) => l.id)) }, { excluded: false });
            await this.recomputeMatches(runId);
        }
        return this.getRun(runId);
    }
    conceptMatchesCategory(concept, category) {
        if (!concept)
            return false;
        const rules = category.rules ?? [];
        const normSpace = (s) => s.replace(/\u00A0/g, ' ').trim().replace(/\s+/g, ' ');
        for (const rule of rules) {
            const pattern = rule.pattern.trim();
            if (!pattern)
                continue;
            if (rule.isRegex) {
                try {
                    const re = new RegExp(pattern, rule.caseSensitive ? '' : 'i');
                    if (re.test(concept))
                        return true;
                }
                catch {
                    const haystack = normSpace(rule.caseSensitive ? concept : concept.toLowerCase());
                    const needle = normSpace(rule.caseSensitive ? pattern : pattern.toLowerCase());
                    if (haystack.includes(needle))
                        return true;
                }
            }
            else {
                const haystack = normSpace(rule.caseSensitive ? concept : concept.toLowerCase());
                const needle = normSpace(rule.caseSensitive ? pattern : pattern.toLowerCase());
                if (haystack.includes(needle))
                    return true;
            }
        }
        return false;
    }
    async applyExcludedLines(runId, nextConcepts, extractLineIds) {
        await this.runRepo.update({ id: runId }, { excludeConcepts: nextConcepts });
        const cut = await this.runRepo.findOne({
            where: { id: runId },
            select: { id: true, cutDate: true },
        });
        const cutDate = cut?.cutDate ?? null;
        for (const extractLineId of extractLineIds) {
            await this.dataSource.transaction(async (manager) => {
                const matches = await manager.find(match_entity_1.MatchEntity, { where: { extractLineId } });
                for (const m of matches) {
                    await manager.delete(match_entity_1.MatchEntity, { id: m.id });
                    const existing = await manager.findOne(unmatched_system_entity_1.UnmatchedSystemEntity, {
                        where: { systemLineId: m.systemLineId },
                    });
                    if (!existing) {
                        const sys = await manager.findOne(system_line_entity_1.SystemLineEntity, {
                            where: { id: m.systemLineId },
                            select: { id: true, dueDate: true, issueDate: true },
                        });
                        const dt = sys?.dueDate ?? sys?.issueDate ?? null;
                        const status = cutDate && dt && dt <= cutDate
                            ? enums_1.UnmatchedSystemStatus.OVERDUE
                            : enums_1.UnmatchedSystemStatus.DEFERRED;
                        await manager.insert(unmatched_system_entity_1.UnmatchedSystemEntity, {
                            id: (0, crypto_1.randomUUID)(),
                            runId,
                            systemLineId: m.systemLineId,
                            status,
                        });
                    }
                }
                await manager.delete(unmatched_extract_entity_1.UnmatchedExtractEntity, { extractLineId });
                await manager.update(extract_line_entity_1.ExtractLineEntity, { id: extractLineId }, { excluded: true });
            });
        }
    }
    async updateSystemData(runId, userId, dto) {
        await this.assertRunExists(runId);
        await this.assertRunOpen(runId);
        const runWithCut = await this.runRepo.findOne({
            where: { id: runId },
            select: { id: true, cutDate: true },
        });
        const cutDate = runWithCut?.cutDate ?? null;
        const existing = await this.systemLineRepo.find({
            where: { runId },
            order: { rowIndex: 'ASC' },
        });
        const byRowIndex = new Map();
        for (const line of existing) {
            if (line.rowIndex !== null)
                byRowIndex.set(line.rowIndex, line);
        }
        const toUpdate = [];
        const toCreate = [];
        for (let i = 0; i < dto.rows.length; i++) {
            const row = dto.rows[i];
            const amount = (0, normalize_1.extractAmount)(row, dto.mapping.amountMode, dto.mapping.amountCol, dto.mapping.debeCol, dto.mapping.haberCol);
            if (amount === null)
                continue;
            const issueDate = dto.mapping.issueDateCol
                ? (0, normalize_1.parseDate)(row[dto.mapping.issueDateCol])
                : null;
            const dueDate = dto.mapping.dueDateCol
                ? (0, normalize_1.parseDate)(row[dto.mapping.dueDateCol])
                : null;
            const description = dto.mapping.descriptionCol
                ? String(row[dto.mapping.descriptionCol] || '')
                : null;
            const amountKey = (0, normalize_1.toAmountKey)(amount);
            const existingLine = byRowIndex.get(i);
            if (existingLine) {
                toUpdate.push({
                    id: existingLine.id,
                    amount,
                    amountKey,
                    issueDate,
                    dueDate,
                    description,
                    raw: row,
                });
            }
            else {
                toCreate.push({
                    id: (0, crypto_1.randomUUID)(),
                    runId,
                    rowIndex: i,
                    issueDate,
                    dueDate,
                    amount,
                    amountKey,
                    description,
                    raw: row,
                });
            }
        }
        await this.dataSource.transaction(async (manager) => {
            for (const u of toUpdate) {
                await manager.update(system_line_entity_1.SystemLineEntity, { id: u.id }, {
                    amount: u.amount,
                    amountKey: u.amountKey,
                    issueDate: u.issueDate,
                    dueDate: u.dueDate,
                    description: u.description,
                    raw: u.raw,
                });
            }
            if (toCreate.length > 0) {
                await manager.insert(system_line_entity_1.SystemLineEntity, toCreate);
                const unmatchedSystemRows = toCreate.map((line) => {
                    const dt = line.dueDate ?? line.issueDate ?? null;
                    const dtDate = dt instanceof Date ? dt : dt ? new Date(dt) : null;
                    const status = cutDate && dtDate && dtDate <= cutDate
                        ? enums_1.UnmatchedSystemStatus.OVERDUE
                        : enums_1.UnmatchedSystemStatus.DEFERRED;
                    return { id: (0, crypto_1.randomUUID)(), runId, systemLineId: line.id, status };
                });
                await manager.insert(unmatched_system_entity_1.UnmatchedSystemEntity, unmatchedSystemRows);
            }
        });
        await this.recomputeMatches(runId);
        return this.getRun(runId);
    }
    async recomputeMatches(runId) {
        const run = await this.runRepo.findOne({
            where: { id: runId },
            select: { id: true, windowDays: true, cutDate: true },
        });
        if (!run)
            return;
        const windowDays = run.windowDays ?? 0;
        const cutDate = run.cutDate;
        const extractLines = await this.extractLineRepo.find({
            where: { runId, excluded: false },
        });
        const systemLines = await this.systemLineRepo.find({ where: { runId } });
        const systemForMatch = systemLines.map((line) => ({
            id: line.id,
            issueDate: line.issueDate ? new Date(line.issueDate) : null,
            dueDate: line.dueDate ? new Date(line.dueDate) : null,
            amountKey: line.amountKey,
            amount: line.amount,
            description: line.description ?? null,
        }));
        const extractForMatch = extractLines.map((line) => ({
            id: line.id,
            date: line.date ? new Date(line.date) : null,
            amountKey: line.amountKey,
        }));
        const { matches, usedExtract, usedSystem } = (0, match_1.matchOneToOne)(systemForMatch, extractForMatch, windowDays);
        const unmatchedExtract = extractLines
            .filter((line) => !usedExtract.has(line.id))
            .map((line) => ({
            id: (0, crypto_1.randomUUID)(),
            runId,
            extractLineId: line.id,
        }));
        const unmatchedSystem = systemLines
            .filter((line) => !usedSystem.has(line.id))
            .map((line) => {
            const dateToCompare = line.dueDate ?? line.issueDate ?? null;
            let status = enums_1.UnmatchedSystemStatus.DEFERRED;
            if (cutDate && dateToCompare && dateToCompare <= cutDate) {
                status = enums_1.UnmatchedSystemStatus.OVERDUE;
            }
            return {
                id: (0, crypto_1.randomUUID)(),
                runId,
                systemLineId: line.id,
                status,
            };
        });
        const matchRows = matches.map((match) => ({
            id: (0, crypto_1.randomUUID)(),
            runId,
            extractLineId: match.extractId,
            systemLineId: match.systemId,
            deltaDays: match.deltaDays,
        }));
        await this.dataSource.transaction(async (manager) => {
            await manager.delete(match_entity_1.MatchEntity, { runId });
            await manager.delete(unmatched_extract_entity_1.UnmatchedExtractEntity, { runId });
            await manager.delete(unmatched_system_entity_1.UnmatchedSystemEntity, { runId });
            if (matchRows.length > 0) {
                await manager.insert(match_entity_1.MatchEntity, matchRows);
            }
            if (unmatchedExtract.length > 0) {
                await manager.insert(unmatched_extract_entity_1.UnmatchedExtractEntity, unmatchedExtract);
            }
            if (unmatchedSystem.length > 0) {
                await manager.insert(unmatched_system_entity_1.UnmatchedSystemEntity, unmatchedSystem);
            }
        });
    }
    listRuns() {
        return this.runRepo.find({ order: { createdAt: 'DESC' } });
    }
    async assertRunExists(runId) {
        const run = await this.runRepo.findOne({
            where: { id: runId },
            select: { id: true },
        });
        if (!run)
            throw new common_1.NotFoundException('Run no encontrado');
    }
    async assertCanEdit(runId, userId) {
        await this.assertRunExists(runId);
        const run = await this.runRepo.findOne({
            where: { id: runId },
            relations: { members: true },
        });
        if (!run)
            return;
        const isOwner = run.createdById === userId;
        const isAdmin = run.members.some((m) => m.userId === userId && m.role === enums_1.RunMemberRole.EDITOR);
        if (!isOwner && !isAdmin) {
            throw new common_1.ForbiddenException('Solo el propietario o un usuario con permiso de admin pueden editar');
        }
    }
    async assertOwner(runId, userId) {
        await this.assertRunExists(runId);
        const run = await this.runRepo.findOne({
            where: { id: runId },
            select: { id: true, createdById: true },
        });
        if (!run || run.createdById !== userId) {
            throw new common_1.ForbiddenException('Solo el propietario puede gestionar permisos');
        }
    }
    async assertRunOpen(runId) {
        const run = await this.runRepo.findOne({
            where: { id: runId },
            select: { id: true, status: true },
        });
        if (!run)
            throw new common_1.NotFoundException('Run no encontrado');
        if (run.status === enums_1.RunStatus.CLOSED) {
            throw new common_1.ForbiddenException('Conciliación cerrada: no se puede editar');
        }
    }
    async shareRun(runId, userId, email, role) {
        await this.assertOwner(runId, userId);
        await this.assertRunOpen(runId);
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user)
            throw new common_1.NotFoundException('Usuario no encontrado');
        await this.runMemberRepo.upsert([{ runId, userId: user.id, role }], ['runId', 'userId']);
        return this.runMemberRepo.findOne({ where: { runId, userId: user.id } });
    }
    async removeMember(runId, ownerUserId, targetUserId) {
        await this.assertOwner(runId, ownerUserId);
        await this.runMemberRepo.delete({ runId, userId: targetUserId });
        return { removed: true };
    }
    async addMessage(runId, userId, body) {
        await this.assertCanEdit(runId, userId);
        await this.assertRunOpen(runId);
        const message = await this.messageRepo.save(this.messageRepo.create({ runId, authorId: userId, body }));
        const author = await this.userRepo.findOne({
            where: { id: userId },
            select: { id: true, email: true, name: true },
        });
        return { ...message, author };
    }
    async exportRun(runId, userId) {
        const run = await this.getRun(runId);
        if (!run)
            throw new common_1.NotFoundException('Run no encontrado');
        await this.assertCanEdit(runId, userId);
        const extractById = new Map(run.extractLines.map((line) => [line.id, line]));
        const systemById = new Map(run.systemLines.map((line) => [line.id, line]));
        const workbook = new exceljs_1.default.Workbook();
        const matchesSheet = workbook.addWorksheet('Correctos');
        matchesSheet.columns = [
            { header: 'Fecha Extracto', key: 'extDate', width: 16 },
            { header: 'Concepto', key: 'concept', width: 40 },
            { header: 'Importe Extracto', key: 'extAmount', width: 18 },
            { header: 'Fecha Emision', key: 'issueDate', width: 16 },
            { header: 'Fecha Vencimiento', key: 'dueDate', width: 18 },
            { header: 'Importe Sistema', key: 'sysAmount', width: 18 },
            { header: 'Delta Dias', key: 'delta', width: 12 },
            { header: 'Categoria', key: 'category', width: 28 },
        ];
        for (const match of run.matches) {
            const ext = extractById.get(match.extractLineId);
            const sys = systemById.get(match.systemLineId);
            if (!ext || !sys)
                continue;
            matchesSheet.addRow({
                extDate: ext.date,
                concept: ext.concept,
                extAmount: ext.amount,
                issueDate: sys.issueDate,
                dueDate: sys.dueDate,
                sysAmount: sys.amount,
                delta: match.deltaDays,
                category: ext.category?.name || '',
            });
        }
        const extractSheet = workbook.addWorksheet('Solo_Extracto');
        extractSheet.columns = [
            { header: 'Fecha', key: 'date', width: 16 },
            { header: 'Concepto', key: 'concept', width: 40 },
            { header: 'Importe', key: 'amount', width: 18 },
            { header: 'Categoria', key: 'category', width: 28 },
        ];
        for (const row of run.unmatchedExtract) {
            const ext = extractById.get(row.extractLineId);
            if (!ext)
                continue;
            extractSheet.addRow({
                date: ext.date,
                concept: ext.concept,
                amount: ext.amount,
                category: ext.category?.name || '',
            });
        }
        const overdueSheet = workbook.addWorksheet('Sistema_Vencidos');
        overdueSheet.columns = [
            { header: 'Fecha Emision', key: 'issueDate', width: 16 },
            { header: 'Fecha Vencimiento', key: 'dueDate', width: 18 },
            { header: 'Importe', key: 'amount', width: 18 },
        ];
        const deferredSheet = workbook.addWorksheet('Sistema_Diferidos');
        deferredSheet.columns = [
            { header: 'Fecha Emision', key: 'issueDate', width: 16 },
            { header: 'Fecha Vencimiento', key: 'dueDate', width: 18 },
            { header: 'Importe', key: 'amount', width: 18 },
        ];
        for (const row of run.unmatchedSystem) {
            const sys = systemById.get(row.systemLineId);
            if (!sys)
                continue;
            const target = row.status === enums_1.UnmatchedSystemStatus.OVERDUE ? overdueSheet : deferredSheet;
            target.addRow({
                issueDate: sys.issueDate,
                dueDate: sys.dueDate,
                amount: sys.amount,
            });
        }
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    }
    async parseFile(file, sheetName, headerRow) {
        if (!file) {
            throw new common_1.NotFoundException('Archivo requerido');
        }
        const name = file.originalname.toLowerCase();
        try {
            if (name.endsWith('.csv')) {
                const workbook = new exceljs_1.default.Workbook();
                const stream = stream_1.Readable.from(file.buffer);
                await workbook.csv.read(stream);
                const sheets = workbook.worksheets.map((sheet) => sheet.name);
                const targetName = sheetName && sheets.includes(sheetName) ? sheetName : sheets[0];
                const sheet = workbook.getWorksheet(targetName || '');
                if (!sheet)
                    return { sheets, rows: [] };
                const headerIndex = Math.max(1, headerRow ?? 1);
                const header = [];
                const colCount = sheet.actualColumnCount || sheet.columnCount || 0;
                for (let col = 1; col <= colCount; col += 1) {
                    const cell = sheet.getRow(headerIndex).getCell(col).value;
                    const text = cell ? String(this.cellValue(cell)).trim() : '';
                    header.push(text || `Col_${col}`);
                }
                const rows = [];
                for (let rowIndex = headerIndex + 1; rowIndex <= sheet.actualRowCount; rowIndex += 1) {
                    const row = sheet.getRow(rowIndex);
                    const obj = {};
                    let hasValue = false;
                    for (let col = 1; col <= colCount; col += 1) {
                        const value = this.cellValue(row.getCell(col).value);
                        if (value !== null && value !== undefined && value !== '') {
                            hasValue = true;
                        }
                        obj[header[col - 1]] = value;
                    }
                    if (hasValue)
                        rows.push(obj);
                }
                return { sheets, rows };
            }
            const parsed = node_xlsx_1.default.parse(file.buffer, { cellDates: true });
            const sheets = parsed.map((sheet) => sheet.name);
            if (sheets.length === 0)
                return { sheets: [], rows: [] };
            const targetName = sheetName && sheets.includes(sheetName) ? sheetName : sheets[0];
            const target = parsed.find((sheet) => sheet.name === targetName);
            if (!target)
                return { sheets, rows: [] };
            const data = target.data;
            const headerIndex = Math.max(1, headerRow ?? 1) - 1;
            const headerRowValues = data[headerIndex] || [];
            const header = headerRowValues.map((cell, idx) => {
                const text = cell ? String(cell).trim() : '';
                return text || `Col_${idx + 1}`;
            });
            const rows = [];
            for (let i = headerIndex + 1; i < data.length; i += 1) {
                const line = data[i] || [];
                const obj = {};
                let hasValue = false;
                for (let col = 0; col < header.length; col += 1) {
                    const value = line[col] ?? null;
                    if (value !== null && value !== undefined && value !== '') {
                        hasValue = true;
                    }
                    obj[header[col]] = value;
                }
                if (hasValue)
                    rows.push(obj);
            }
            return { sheets, rows };
        }
        catch (error) {
            throw new common_1.BadRequestException('No se pudo leer el archivo. Verificá el formato.');
        }
    }
    resolveCategory(concept, categories) {
        if (!concept)
            return null;
        const normSpace = (s) => s.trim().replace(/\s+/g, ' ');
        for (const category of categories) {
            for (const rule of category.rules) {
                const pattern = rule.pattern.trim();
                if (!pattern)
                    continue;
                if (rule.isRegex) {
                    try {
                        const re = new RegExp(pattern, rule.caseSensitive ? '' : 'i');
                        if (re.test(concept))
                            return category.id;
                    }
                    catch {
                        const haystack = normSpace(rule.caseSensitive ? concept : concept.toLowerCase());
                        const needle = normSpace(rule.caseSensitive ? pattern : pattern.toLowerCase());
                        if (haystack.includes(needle))
                            return category.id;
                    }
                }
                else {
                    const haystack = normSpace(rule.caseSensitive ? concept : concept.toLowerCase());
                    const needle = normSpace(rule.caseSensitive ? pattern : pattern.toLowerCase());
                    if (haystack.includes(needle))
                        return category.id;
                }
            }
        }
        return null;
    }
    async createPending(runId, userId, dto) {
        await this.assertCanEdit(runId, userId);
        await this.assertRunOpen(runId);
        return this.pendingItemRepo.save(this.pendingItemRepo.create({
            runId,
            area: dto.area,
            systemLineId: dto.systemLineId ?? null,
            note: dto.note ?? null,
        }));
    }
    async resolvePending(runId, userId, pendingId, dto) {
        await this.assertCanEdit(runId, userId);
        await this.assertRunOpen(runId);
        await this.pendingItemRepo.update({ id: pendingId }, {
            status: enums_1.PendingStatus.RESOLVED,
            resolvedAt: new Date(),
            note: dto.note ?? null,
        });
        return this.pendingItemRepo.findOne({ where: { id: pendingId } });
    }
    async updatePendingStatus(runId, userId, pendingId, status) {
        await this.assertCanEdit(runId, userId);
        await this.assertRunOpen(runId);
        await this.pendingItemRepo.update({ id: pendingId }, { status });
        return this.pendingItemRepo.findOne({ where: { id: pendingId } });
    }
    async setMatch(runId, userId, systemLineId, extractLineIds) {
        await this.assertCanEdit(runId, userId);
        await this.assertRunOpen(runId);
        const sys = await this.systemLineRepo.findOne({ where: { id: systemLineId, runId } });
        if (!sys)
            throw new common_1.NotFoundException('Línea de sistema no encontrada');
        const extractLines = await this.extractLineRepo.find({
            where: { id: (0, typeorm_2.In)(extractLineIds), runId },
        });
        if (extractLineIds.length !== extractLines.length) {
            throw new common_1.BadRequestException('Una o más líneas de extracto no pertenecen a este run');
        }
        const sumExtract = extractLines.reduce((s, e) => s + e.amount, 0);
        const diff = Math.abs(sumExtract - sys.amount);
        if (diff > 0.01) {
            throw new common_1.BadRequestException(`La suma de los importes del extracto (${sumExtract.toFixed(2)}) debe coincidir con el importe del sistema (${sys.amount.toFixed(2)})`);
        }
        await this.dataSource.transaction(async (manager) => {
            await manager.delete(match_entity_1.MatchEntity, { runId, systemLineId });
            await manager.delete(unmatched_system_entity_1.UnmatchedSystemEntity, { runId, systemLineId });
            for (const extractLineId of extractLineIds) {
                await manager.insert(match_entity_1.MatchEntity, {
                    id: (0, crypto_1.randomUUID)(),
                    runId,
                    systemLineId,
                    extractLineId,
                    deltaDays: 0,
                });
                await manager.delete(unmatched_extract_entity_1.UnmatchedExtractEntity, { runId, extractLineId });
            }
        });
        return this.getRun(runId);
    }
    async notifyPending(runId, userId, dto) {
        await this.assertRunExists(runId);
        await this.assertRunOpen(runId);
        const run = await this.runRepo.findOne({ where: { id: runId } });
        if (!run)
            throw new common_1.NotFoundException('Run no encontrado');
        const pendingItems = await this.pendingItemRepo.find({
            where: {
                runId,
                area: (0, typeorm_2.In)(dto.areas),
                status: (0, typeorm_2.Not)(enums_1.PendingStatus.RESOLVED),
            },
            relations: { systemLine: true },
        });
        if (pendingItems.length === 0) {
            throw new common_1.BadRequestException('No hay pendientes para las áreas seleccionadas');
        }
        const mailerHost = process.env.MAILER_HOST || process.env.SMTP_HOST;
        const mailerEmail = process.env.MAILER_EMAIL || process.env.SMTP_USER;
        const mailerSecret = process.env.MAILER_SECRET_KEY || process.env.SMTP_PASS;
        const mailerPort = process.env.MAILER_PORT ||
            process.env.SMTP_PORT ||
            (mailerHost === 'smtp.gmail.com' ? '587' : '587');
        const from = process.env.SMTP_FROM || mailerEmail;
        if (!mailerHost || !mailerEmail || !mailerSecret) {
            throw new common_1.BadRequestException('Correo no configurado. Configurar MAILER_HOST, MAILER_EMAIL y MAILER_SECRET_KEY (o SMTP_*) en variables de entorno');
        }
        const port = parseInt(String(mailerPort), 10);
        const transporter = nodemailer_1.default.createTransport({
            host: mailerHost,
            port,
            secure: port === 465,
            auth: { user: mailerEmail, pass: mailerSecret },
            connectionTimeout: 15_000,
            greetingTimeout: 15_000,
        });
        const areaEmails = {
            'Dirección': process.env.EMAIL_DIRECCION || '',
            'Tesorería': process.env.EMAIL_TESORERIA || '',
        };
        const areasSinEmail = dto.areas.filter((a) => !areaEmails[a]?.trim());
        if (areasSinEmail.length > 0) {
            throw new common_1.BadRequestException(`No hay email configurado para: ${areasSinEmail.join(', ')}. En el servidor configurar EMAIL_DIRECCION y/o EMAIL_TESORERIA.`);
        }
        const results = [];
        for (const area of dto.areas) {
            const areaEmail = (areaEmails[area] || '').trim();
            if (!areaEmail)
                continue;
            const areaPending = pendingItems.filter((p) => p.area === area);
            const rows = areaPending
                .map((p) => {
                const sys = p.systemLine;
                return `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;">${sys?.issueDate ? new Date(sys.issueDate).toLocaleDateString() : '-'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${sys?.dueDate ? new Date(sys.dueDate).toLocaleDateString() : '-'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">$${sys?.amount?.toFixed(2) || '0.00'}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${p.note || '-'}</td>
          </tr>
        `;
            })
                .join('');
            const html = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <h2 style="color: #333;">Conciliación Bancaria - Movimientos Pendientes</h2>
          <p>Hola equipo de <strong>${area}</strong>,</p>
          <p>Hemos realizado la conciliación encontrando ${areaPending.length} movimiento(s) que requieren atención de tu área:</p>
          ${dto.customMessage ? `<p style="background: #f5f5f5; padding: 12px; border-left: 4px solid #3b82f6;"><em>${dto.customMessage}</em></p>` : ''}
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Fecha Emisión</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Fecha Vencimiento</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Importe</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Nota</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Por favor revisar y gestionar estos movimientos.<br/>
            Conciliación: ${run.title || run.id}<br/>
            Fecha: ${new Date(run.createdAt).toLocaleDateString()}
          </p>
        </div>
      `;
            try {
                await transporter.sendMail({
                    from,
                    to: areaEmail,
                    subject: `Conciliación Bancaria - Movimientos Pendientes [${area}]`,
                    html,
                });
                results.push({ area, email: areaEmail, sent: true });
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                results.push({ area, email: areaEmail, sent: false, error: message });
            }
        }
        return results;
    }
    cellValue(value) {
        if (value === null || value === undefined)
            return null;
        if (typeof value === 'object') {
            if ('result' in value)
                return value.result;
            if (value instanceof Date)
                return value;
        }
        return value;
    }
    async createIssue(runId, userId, data) {
        await this.assertRunExists(runId);
        const issue = await this.issueRepo.save(this.issueRepo.create({
            runId,
            title: data.title,
            body: data.body ?? null,
            createdById: userId,
        }));
        const createdBy = await this.userRepo.findOne({
            where: { id: userId },
            select: { id: true, email: true, name: true },
        });
        return { ...issue, createdBy, comments: [] };
    }
    async updateIssue(runId, issueId, userId, data) {
        await this.assertRunExists(runId);
        const run = await this.runRepo.findOne({
            where: { id: runId },
            select: { id: true, createdById: true },
        });
        if (!run)
            throw new common_1.NotFoundException('Run no encontrado');
        if (run.createdById !== userId) {
            throw new common_1.ForbiddenException('Solo la propietaria de la conciliación puede editar el issue');
        }
        const updateData = {};
        if (data.title != null)
            updateData.title = data.title;
        if (data.body !== undefined)
            updateData.body = data.body ?? null;
        await this.issueRepo.update({ id: issueId, runId }, updateData);
        const issue = await this.issueRepo.findOne({
            where: { id: issueId },
            relations: { comments: true },
        });
        if (!issue)
            throw new common_1.NotFoundException('Issue no encontrado');
        const createdBy = await this.userRepo.findOne({
            where: { id: issue.createdById },
            select: { id: true, email: true, name: true },
        });
        const commentAuthorIds = [...new Set(issue.comments.map((c) => c.authorId))];
        const commentAuthors = commentAuthorIds.length > 0
            ? await this.userRepo.find({
                where: { id: (0, typeorm_2.In)(commentAuthorIds) },
                select: { id: true, email: true, name: true },
            })
            : [];
        const authorMap = new Map(commentAuthors.map((u) => [u.id, u]));
        return {
            ...issue,
            createdBy,
            comments: issue.comments.map((c) => ({
                ...c,
                author: authorMap.get(c.authorId) ?? null,
            })),
        };
    }
    async addIssueComment(issueId, userId, body) {
        const issue = await this.issueRepo.findOne({
            where: { id: issueId },
            select: { id: true, runId: true },
        });
        if (!issue)
            throw new common_1.NotFoundException('Issue no encontrado');
        await this.assertRunExists(issue.runId);
        const comment = await this.issueCommentRepo.save(this.issueCommentRepo.create({ issueId, authorId: userId, body }));
        const author = await this.userRepo.findOne({
            where: { id: userId },
            select: { id: true, email: true, name: true },
        });
        return { ...comment, author };
    }
};
exports.ReconciliationsService = ReconciliationsService;
exports.ReconciliationsService = ReconciliationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reconciliation_run_entity_1.ReconciliationRunEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(extract_line_entity_1.ExtractLineEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(system_line_entity_1.SystemLineEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(match_entity_1.MatchEntity)),
    __param(4, (0, typeorm_1.InjectRepository)(unmatched_extract_entity_1.UnmatchedExtractEntity)),
    __param(5, (0, typeorm_1.InjectRepository)(unmatched_system_entity_1.UnmatchedSystemEntity)),
    __param(6, (0, typeorm_1.InjectRepository)(run_member_entity_1.RunMemberEntity)),
    __param(7, (0, typeorm_1.InjectRepository)(message_entity_1.MessageEntity)),
    __param(8, (0, typeorm_1.InjectRepository)(issue_entity_1.IssueEntity)),
    __param(9, (0, typeorm_1.InjectRepository)(issue_comment_entity_1.IssueCommentEntity)),
    __param(10, (0, typeorm_1.InjectRepository)(pending_item_entity_1.PendingItemEntity)),
    __param(11, (0, typeorm_1.InjectRepository)(expense_category_entity_1.ExpenseCategoryEntity)),
    __param(12, (0, typeorm_1.InjectRepository)(database_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], ReconciliationsService);
//# sourceMappingURL=reconciliations.service.js.map