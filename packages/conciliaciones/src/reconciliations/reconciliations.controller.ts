import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '@lince/auth';
import { PendingStatus, RunStatus } from '../enums';
import { ReconciliationsService } from './reconciliations.service';
import { CreateRunDto } from './dto/create-run.dto';
import { UpdateSystemDto } from './dto/update-system.dto';
import { ShareRunDto } from './dto/share-run.dto';
import { CreateMessageDto } from './dto/message.dto';
import { CreatePendingDto, ResolvePendingDto } from './dto/create-pending.dto';
import { NotifyDto } from './dto/notify.dto';
import { SetMatchDto } from './dto/set-match.dto';
import { AddExcludedConceptDto } from './dto/add-excluded-concept.dto';
import { ExcludeManyDto } from './dto/exclude-many.dto';
import { ExcludeByCategoryDto } from './dto/exclude-by-category.dto';
import { RemoveExcludedConceptDto } from './dto/remove-excluded-concept.dto';
import { CreateIssueDto, UpdateIssueDto, CreateIssueCommentDto } from './dto/create-issue.dto';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseFileDto } from './dto/parse-file.dto';

@Controller('conciliaciones/reconciliations')
@UseGuards(JwtAuthGuard)
export class ReconciliationsController {
  constructor(private service: ReconciliationsService) {}

  @Post()
  create(
    @Body() dto: CreateRunDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.createRun(dto, req.user.id);
  }

  @Get()
  list() {
    return this.service.listRuns();
  }

  @Post(':id/issues')
  createIssue(
    @Param('id') id: string,
    @Body() dto: CreateIssueDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.createIssue(id, req.user.id, { title: dto.title, body: dto.body });
  }

  @Patch(':id/issues/:issueId')
  updateIssue(
    @Param('id') id: string,
    @Param('issueId') issueId: string,
    @Body() dto: UpdateIssueDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.updateIssue(id, issueId, req.user.id, {
      title: dto.title,
      body: dto.body,
    });
  }

  @Post(':id/issues/:issueId/comments')
  addIssueComment(
    @Param('id') id: string,
    @Param('issueId') issueId: string,
    @Body() dto: CreateIssueCommentDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.addIssueComment(issueId, req.user.id, dto.body);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.removeMember(id, req.user.id, userId);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    const run = await this.service.getRun(id);
    if (!run) throw new NotFoundException('Run no encontrado');
    return run;
  }

  @Patch(':id/system')
  async updateSystem(
    @Param('id') id: string,
    @Body() dto: UpdateSystemDto,
    @Request() req: { user: { id: string } },
  ) {
    await this.service.assertCanEdit(id, req.user.id);
    return this.service.updateSystemData(id, req.user.id, dto);
  }

  @Patch(':id/exclude-concept')
  addExcludedConcept(
    @Param('id') id: string,
    @Body() dto: AddExcludedConceptDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.addExcludedConcept(id, req.user.id, dto.concept);
  }

  @Patch(':id/exclude-concepts')
  addExcludedConcepts(
    @Param('id') id: string,
    @Body() dto: ExcludeManyDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.addExcludedConcepts(id, req.user.id, dto.concepts);
  }

  @Patch(':id/exclude-by-category')
  addExcludedByCategory(
    @Param('id') id: string,
    @Body() dto: ExcludeByCategoryDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.addExcludedByCategory(id, req.user.id, dto.categoryId);
  }

  @Patch(':id/remove-excluded-concept')
  removeExcludedConcept(
    @Param('id') id: string,
    @Body() dto: RemoveExcludedConceptDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.removeExcludedConcept(id, req.user.id, dto.concept);
  }

  @Patch(':id')
  async updateRun(
    @Param('id') id: string,
    @Body() body: { status?: RunStatus; bankName?: string; enabledCategoryIds?: string[] },
    @Request() req: { user: { id: string } },
  ) {
    await this.service.assertCanEdit(id, req.user.id);
    return this.service.updateRun(id, req.user.id, body);
  }

  @Delete(':id')
  async deleteRun(@Param('id') id: string, @Request() req: { user: { id: string; globalRole: string } }) {
    await this.service.deleteRun(id, req.user.id, req.user.globalRole === 'SUPERADMIN');
    return { deleted: true };
  }

  @Post(':id/share')
  share(
    @Param('id') id: string,
    @Body() dto: ShareRunDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.shareRun(id, req.user.id, dto.email, dto.role);
  }

  @Post(':id/messages')
  addMessage(
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.addMessage(id, req.user.id, dto.body);
  }

  @Post('parse')
  @UseInterceptors(FileInterceptor('file'))
  parseFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ParseFileDto,
  ) {
    return this.service.parseFile(file, dto.sheetName, dto.headerRow);
  }

  @Get(':id/export')
  async export(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Res() res: Response,
  ) {
    const buffer = await this.service.exportRun(id, req.user.id);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename=conciliacion_${id}.xlsx`);
    res.send(buffer);
  }

  @Post(':id/pending')
  createPending(
    @Param('id') id: string,
    @Body() dto: CreatePendingDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.createPending(id, req.user.id, dto);
  }

  @Patch(':id/pending/:pendingId/resolve')
  resolvePending(
    @Param('id') id: string,
    @Param('pendingId') pendingId: string,
    @Body() dto: ResolvePendingDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.resolvePending(id, req.user.id, pendingId, dto);
  }

  @Patch(':id/pending/:pendingId/status')
  updatePendingStatus(
    @Param('id') id: string,
    @Param('pendingId') pendingId: string,
    @Body() body: { status: PendingStatus },
    @Request() req: { user: { id: string } },
  ) {
    return this.service.updatePendingStatus(id, req.user.id, pendingId, body.status);
  }

  @Post(':id/match')
  setMatch(
    @Param('id') id: string,
    @Body() dto: SetMatchDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.setMatch(id, req.user.id, dto.systemLineId, dto.extractLineIds);
  }

  @Post(':id/notify')
  notifyPending(
    @Param('id') id: string,
    @Body() dto: NotifyDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.service.notifyPending(id, req.user.id, dto);
  }
}
