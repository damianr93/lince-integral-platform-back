import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  CurrentUser,
} from '@lince/auth';
import { AuthUser, GlobalRole, PaginatedResponse, UserDto } from '@lince/types';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateModulesDto } from './dto/update-modules.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Lista todos los usuarios — solo SUPERADMIN y ADMIN */
  @Get()
  @Roles(GlobalRole.SUPERADMIN, GlobalRole.ADMIN)
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResponse<UserDto>> {
    return this.usersService.findAll(page, limit);
  }

  /** Ver mi propio perfil */
  @Get('me')
  getMe(@CurrentUser() user: AuthUser): Promise<UserDto> {
    return this.usersService.findOne(user.id);
  }

  /** Ver un usuario por ID — solo SUPERADMIN y ADMIN */
  @Get(':id')
  @Roles(GlobalRole.SUPERADMIN, GlobalRole.ADMIN)
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UserDto> {
    return this.usersService.findOne(id);
  }

  /** Crear usuario — solo SUPERADMIN */
  @Post()
  @Roles(GlobalRole.SUPERADMIN)
  create(@Body() dto: CreateUserDto): Promise<UserDto> {
    return this.usersService.create(dto);
  }

  /** Actualizar nombre/rol/activo — solo SUPERADMIN */
  @Patch(':id')
  @Roles(GlobalRole.SUPERADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserDto> {
    return this.usersService.update(id, dto);
  }

  /** Actualizar módulos habilitados — solo SUPERADMIN */
  @Patch(':id/modules')
  @Roles(GlobalRole.SUPERADMIN)
  updateModules(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModulesDto,
  ): Promise<UserDto> {
    return this.usersService.updateModules(id, dto.modules);
  }

  /** Resetear contraseña — solo SUPERADMIN */
  @Patch(':id/reset-password')
  @Roles(GlobalRole.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
  ): Promise<void> {
    return this.usersService.resetPassword(id, dto);
  }

  /** Desactivar usuario (soft delete) — solo SUPERADMIN */
  @Delete(':id')
  @Roles(GlobalRole.SUPERADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}
