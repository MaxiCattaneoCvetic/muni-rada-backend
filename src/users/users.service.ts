import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './user.entity';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, ChangePasswordDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Usuario ${id} no encontrado`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) throw new ConflictException('El email ya está en uso');

    const { password, ...rest } = dto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      ...rest,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      mustChangePassword: true, // siempre debe cambiar al primer login
    });
    return this.usersRepository.save(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async resetPassword(id: string, dto: ResetPasswordDto): Promise<void> {
    const user = await this.findById(id);
    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.mustChangePassword = true;
    await this.usersRepository.save(user);
  }

  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findById(id);
    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) throw new ForbiddenException('Contraseña actual incorrecta');
    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.mustChangePassword = false;
    await this.usersRepository.save(user);
  }

  async updateFirma(id: string, firmaUrl: string, firmaPath: string): Promise<User> {
    const user = await this.findById(id);
    user.firmaUrl = firmaUrl;
    user.firmaPath = firmaPath;
    return this.usersRepository.save(user);
  }

  async deactivate(id: string): Promise<User> {
    const user = await this.findById(id);
    user.isActive = false;
    return this.usersRepository.save(user);
  }

  async activate(id: string): Promise<User> {
    const user = await this.findById(id);
    user.isActive = true;
    return this.usersRepository.save(user);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}
