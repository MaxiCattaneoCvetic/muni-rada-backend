import { UsersService } from './users.service';
import { ArchivosService } from '../archivos/archivos.service';
import { CreateUserDto, UpdateUserDto, ResetPasswordDto, ChangePasswordDto } from './users.dto';
export declare class UsersController {
    private readonly usersService;
    private readonly archivosService;
    constructor(usersService: UsersService, archivosService: ArchivosService);
    findAll(): Promise<import("./user.entity").User[]>;
    getMe(req: any): Promise<import("./user.entity").User>;
    findOne(id: string): Promise<import("./user.entity").User>;
    create(dto: CreateUserDto): Promise<import("./user.entity").User>;
    update(id: string, dto: UpdateUserDto): Promise<import("./user.entity").User>;
    resetPassword(id: string, dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(req: any, dto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    uploadFirma(req: any, file: Express.Multer.File): Promise<{
        firmaUrl: string;
        message: string;
    }>;
    activate(id: string): Promise<import("./user.entity").User>;
    deactivate(id: string): Promise<import("./user.entity").User>;
}
