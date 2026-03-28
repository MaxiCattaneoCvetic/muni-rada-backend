import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, ChangePasswordDto } from './users.dto';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    findAll(): Promise<User[]>;
    findById(id: string): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    create(dto: CreateUserDto): Promise<User>;
    update(id: string, dto: UpdateUserDto): Promise<User>;
    resetPassword(id: string, dto: ResetPasswordDto): Promise<void>;
    changePassword(id: string, dto: ChangePasswordDto): Promise<void>;
    updateFirma(id: string, firmaUrl: string, firmaPath: string): Promise<User>;
    deactivate(id: string): Promise<User>;
    activate(id: string): Promise<User>;
    validatePassword(user: User, password: string): Promise<boolean>;
}
