import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@lince/auth';
import { ExpensesService } from './expenses.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateRuleDto } from './dto/create-rule.dto';

@Controller('conciliaciones/expenses')
@UseGuards(JwtAuthGuard)
export class ExpensesController {
  constructor(private service: ExpensesService) {}

  @Get('categories')
  listCategories() {
    return this.service.listCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.service.createCategory(dto.name);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.service.deleteCategory(id);
  }

  @Post('rules')
  createRule(@Body() dto: CreateRuleDto) {
    return this.service.createRule(dto);
  }

  @Delete('rules/:id')
  deleteRule(@Param('id') id: string) {
    return this.service.deleteRule(id);
  }
}
