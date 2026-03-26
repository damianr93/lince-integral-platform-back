import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@lince/database';
import { AuthService } from '@lince/auth';
import { PaginatedResponse, UserDto, UserModules } from '@lince/types';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
  ) {}

  async findAll(page?: number, limit?: number): Promise<PaginatedResponse<UserDto>> {
    const p = Number.isFinite(page) && (page as number) > 0 ? (page as number) : 1;
    const l = Number.isFinite(limit) && (limit as number) > 0 ? Math.min(limit as number, 100) : 20;
    const [data, total] = await this.users.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (p - 1) * l,
      take: l,
    });

    return {
      data: data.map((u) => this.toDto(u)),
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
    };
  }

  async findOne(id: string): Promise<UserDto> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);
    return this.toDto(user);
  }

  async create(dto: CreateUserDto): Promise<UserDto> {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('El email ya está registrado');

    const passwordHash = await AuthService.hashPassword(dto.password);

    const user = this.users.create({
      email: dto.email,
      name: dto.name,
      passwordHash,
      globalRole: dto.globalRole,
      area: dto.area ?? null,
      modules: dto.modules ?? {},
    });

    const saved = await this.users.save(user);
    return this.toDto(saved);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDto> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);

    Object.assign(user, dto);
    const saved = await this.users.save(user);
    return this.toDto(saved);
  }

  async updateModules(id: string, modules: UserModules): Promise<UserDto> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);

    user.modules = modules;
    const saved = await this.users.save(user);
    return this.toDto(saved);
  }

  async resetPassword(id: string, dto: ResetPasswordDto): Promise<void> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);

    const passwordHash = await AuthService.hashPassword(dto.newPassword);
    await this.users.update(id, { passwordHash, mustChangePassword: true });
  }

  async remove(id: string): Promise<void> {
    const user = await this.users.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);

    // Soft delete: desactivar en lugar de borrar
    user.active = false;
    await this.users.save(user);
  }

  private toDto(user: UserEntity): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      globalRole: user.globalRole,
      modules: user.modules,
      active: user.active,
      area: user.area ?? undefined,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
