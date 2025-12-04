// apps/backend/src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  HttpException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService, UserFilters } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AdminChangePasswordDto } from './dto/admin-change-password.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
// ✅ IMPORTAR O ENUM ATUALIZADO E FUNÇÕES
import { Role, canManageRole, getRoleLevel } from '../common/enums/role.enum'; 
import { DepartmentService } from '../common/services/department.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly departmentService: DepartmentService,
  ) {}

  @Post()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE)
  @ApiOperation({ summary: 'Criar novo usuário com senha temporária (admins, diretores e gerentes)' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Usuário já existe' })
  async create(@Body() createUserDto: CreateUserDto, @Request() req) {
    console.log('🔍 [CONTROLLER] Recebendo dados para criação de usuário:', {
      username: createUserDto.username,
      email: createUserDto.email,
      fullName: createUserDto.fullName,
      role: createUserDto.role,
      sendWelcomeEmail: createUserDto.sendWelcomeEmail
    });
    
    // ✅ Validar se o usuário logado tem permissão para criar usuários da role desejada
    const currentUserRoleLevel = getRoleLevel(req.user.role);
    const targetUserRoleLevel = getRoleLevel(createUserDto.role);

    if (currentUserRoleLevel <= targetUserRoleLevel && req.user.role !== Role.ADMIN) {
        throw new ForbiddenException('Você não tem permissão para criar um usuário com este nível de acesso.');
    }

    return this.usersService.create(createUserDto, req.user.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.ENCARREGADO, Role.COORDENADOR, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Listar usuários com filtros' })
  @ApiResponse({ status: 200, description: 'Lista de usuários' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome, email ou username' })
  @ApiQuery({ name: 'department', required: false, type: String, description: 'Filtrar por departamento' })
  @ApiQuery({ name: 'position', required: false, type: String, description: 'Filtrar por cargo' })
  @ApiQuery({ name: 'role', required: false, enum: Role, description: 'Filtrar por role' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filtrar por status ativo' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Página (padrão: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Itens por página (padrão: 20)' })
  async findAll(@Query() filters: UserFilters, @Request() req) { // ✅ ADICIONAR @Request() req
    // ✅ Filtrar usuários por departamento para não-admins/diretores
    if (req.user.role !== Role.ADMIN && req.user.role !== Role.DIRETOR && req.user.department) {
      if (filters.department && filters.department !== req.user.department) {
        throw new ForbiddenException('Você só pode buscar usuários do seu próprio departamento.');
      }
      filters.department = req.user.department;
    }
    return this.usersService.findAll(filters);
  }

  @Get('me')
  @ApiOperation({ summary: 'Obter dados do usuário logado' })
  @ApiResponse({ status: 200, description: 'Dados do usuário', type: UserResponseDto })
  async getMe(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get('statistics')
  @Roles(Role.ADMIN, Role.DIRETOR)
  @ApiOperation({ summary: 'Obter estatísticas de usuários (apenas admins e diretores)' })
  @ApiResponse({ status: 200, description: 'Estatísticas dos usuários' })
  async getStatistics() {
    return this.usersService.getStatistics();
  }

  @Get('departments')
  @ApiOperation({ summary: 'Listar todos os departamentos disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de departamentos' })
  async getDepartments() {
    return this.departmentService.getAllDepartments();
  }

  @Get('positions')
  @ApiOperation({ summary: 'Listar todas as posições disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de posições' })
  async getPositions() {
    return this.departmentService.getAllPositions();
  }

  @Get('roles')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Listar todos os roles disponíveis (apenas admins)' })
  @ApiResponse({ status: 200, description: 'Lista de roles' })
  async getRoles() {
    return Object.values(Role);
  }

  @Get('department/:department')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.ENCARREGADO, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ summary: 'Listar usuários de um departamento específico' })
  @ApiParam({ name: 'department', description: 'Nome do departamento' })
  @ApiResponse({ status: 200, description: 'Usuários do departamento' })
  async findByDepartment(@Param('department') department: string, @Request() req) {
    if (req.user.role !== Role.ADMIN && req.user.role !== Role.DIRETOR && req.user.department !== department) {
      throw new ForbiddenException('Você não tem permissão para acessar usuários de outros departamentos.');
    }
    return this.usersService.findByDepartment(department);
  }

  @Get('subordinates/:id')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.ENCARREGADO, Role.COORDENADOR, Role.SUPERVISOR)
  @ApiOperation({ summary: 'Listar subordinados de um usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Lista de subordinados' })
  async findSubordinates(@Param('id') id: string, @Request() req) {
    if (req.user.id.toString() !== id && req.user.role !== Role.ADMIN && req.user.role !== Role.DIRETOR) {
      throw new ForbiddenException('Você não tem permissão para acessar os subordinados deste usuário.');
    }
    return this.usersService.findSubordinates(id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE, Role.ENCARREGADO, Role.COORDENADOR, Role.SUPERVISOR, Role.ANALISTA)
  @ApiOperation({ summary: 'Obter usuário por ID' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Dados do usuário', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findOne(@Param('id') id: string, @Request() req) {
    if (req.user.role !== Role.ADMIN && req.user.role !== Role.DIRETOR && req.user.id.toString() !== id) {
      const targetUser = await this.usersService.findById(id);
      if (!targetUser || targetUser.department !== req.user.department) {
        throw new ForbiddenException('Você não tem permissão para acessar este usuário.');
      }
    }
    return this.usersService.findOne(id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Atualizar dados do próprio usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado', type: UserResponseDto })
  async updateMe(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    const allowedFields = ['fullName', 'phone', 'notes'];
    const filteredDto = {};
    
    Object.keys(updateUserDto).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredDto[key] = updateUserDto[key];
      }
    });

    return this.usersService.update(req.user.id, filteredDto, req.user.id, req.user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE)
  @ApiOperation({ summary: 'Atualizar usuário por ID (admins, diretores e gerentes)' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário atualizado', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    if (req.user.role === Role.GERENTE) {
      const targetUser = await this.usersService.findById(id);
      if (!targetUser || targetUser.department !== req.user.department || !canManageRole(req.user.role, targetUser.role)) {
        throw new ForbiddenException('Você não tem permissão para atualizar este usuário.');
      }
      if (updateUserDto.role) {
        throw new ForbiddenException('Você não pode alterar a role de um usuário.');
      }
      if (updateUserDto.isActive !== undefined && !canManageRole(req.user.role, targetUser.role)) {
        throw new ForbiddenException('Você não tem permissão para alterar o status deste usuário.');
      }
    }
    return this.usersService.update(id, updateUserDto, req.user.id, req.user);
  }

  @Patch(':id/toggle-active')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE)
  @ApiOperation({ summary: 'Ativar/Desativar usuário (admins, diretores e gerentes)' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Status do usuário alterado', type: UserResponseDto })
  async toggleActive(@Param('id') id: string, @Request() req) {
    if (req.user.role === Role.GERENTE) {
      const targetUser = await this.usersService.findById(id);
      if (!targetUser || targetUser.department !== req.user.department || !canManageRole(req.user.role, targetUser.role)) {
        throw new ForbiddenException('Você não tem permissão para alterar o status deste usuário.');
      }
    }
    return this.usersService.toggleActive(id, req.user);
  }

  @Patch(':id/admin-change-password')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE)
  @ApiOperation({ summary: 'Alterar senha de usuário (administradores, diretores e gerentes)' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @HttpCode(HttpStatus.OK)
  async adminChangePassword(
    @Param('id') id: string,
    @Body() adminChangePasswordDto: AdminChangePasswordDto,
    @Request() req,
  ) {
    if (req.user.role === Role.GERENTE) {
      const targetUser = await this.usersService.findById(id);
      if (!targetUser || targetUser.department !== req.user.department || !canManageRole(req.user.role, targetUser.role)) {
        throw new ForbiddenException('Você não tem permissão para alterar a senha deste usuário.');
      }
    }
    await this.usersService.adminChangePassword(
      id,
      adminChangePasswordDto.newPassword,
      req.user
    );
    return { message: 'Senha alterada com sucesso pelo administrador' };
  }

  @Patch(':id/change-password')
  @ApiOperation({ summary: 'Alterar própria senha do usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Param('id') id: string,
    @Body() body: { currentPassword: string; newPassword: string },
    @Request() req,
  ) {
    if (req.user.id.toString() !== id) {
      throw new HttpException('Você só pode alterar sua própria senha', HttpStatus.FORBIDDEN);
    }

    await this.usersService.changePassword(
      id,
      body.currentPassword,
      body.newPassword,
      req.user,
    );
    return { message: 'Senha alterada com sucesso' };
  }

  @Patch(':id/reset-temporary-password')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE)
  @ApiOperation({ summary: 'Gerar nova senha temporária para usuário (admins, diretores e gerentes)' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Nova senha temporária gerada' })
  @HttpCode(HttpStatus.OK)
  async resetTemporaryPassword(
    @Param('id') id: string,
    @Request() req,
  ) {
    if (req.user.role === Role.GERENTE) {
      const targetUser = await this.usersService.findById(id);
      if (!targetUser || targetUser.department !== req.user.department || !canManageRole(req.user.role, targetUser.role)) {
        throw new ForbiddenException('Você não tem permissão para resetar a senha temporária deste usuário.');
      }
    }
    const result = await this.usersService.resetTemporaryPassword(id, req.user.id);
    return { 
      message: 'Nova senha temporária gerada com sucesso',
      temporaryPassword: result.temporaryPassword,
      expiresAt: result.expiresAt
    };
  }

  @Post(':id/send-welcome-email')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE)
  @ApiOperation({ summary: 'Reenviar email de boas-vindas (admins, diretores e gerentes)' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Email enviado com sucesso' })
  @HttpCode(HttpStatus.OK)
  async resendWelcomeEmail(
    @Param('id') id: string,
    @Request() req,
  ) {
    if (req.user.role === Role.GERENTE) {
      const targetUser = await this.usersService.findById(id);
      if (!targetUser || targetUser.department !== req.user.department || !canManageRole(req.user.role, targetUser.role)) {
        throw new ForbiddenException('Você não tem permissão para reenviar o email de boas-vindas para este usuário.');
      }
    }
    await this.usersService.resendWelcomeEmail(id, req.user.id);
    return { message: 'Email de boas-vindas reenviado com sucesso' };
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Remover usuário (apenas admins)' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @Request() req) {
    await this.usersService.remove(id, req.user);
    return { message: 'Usuário removido com sucesso' };
  }

  @Get(':id/temporary-credentials')
  @Roles(Role.ADMIN, Role.DIRETOR, Role.GERENTE)
  @ApiOperation({ summary: 'Obter credenciais temporárias do usuário (admins, diretores e gerentes)' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Credenciais temporárias' })
  async getTemporaryCredentials(@Param('id') id: string, @Request() req) {
    if (req.user.role === Role.GERENTE) {
      const targetUser = await this.usersService.findById(id);
      if (!targetUser || targetUser.department !== req.user.department || !canManageRole(req.user.role, targetUser.role)) {
        throw new ForbiddenException('Você não tem permissão para ver as credenciais temporárias deste usuário.');
      }
    }
    return this.usersService.getTemporaryCredentials(id);
  }

  @Public()
  @Post('validate-temporary')
  @ApiOperation({ summary: 'Validar credenciais temporárias (endpoint público)' })
  @ApiResponse({ status: 200, description: 'Credenciais válidas' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async validateTemporary(
    @Body() body: { username: string; temporaryPassword: string }
  ) {
    const isValid = await this.usersService.validateTemporaryCredentials(
      body.username, 
      body.temporaryPassword
    );
    
    if (!isValid) {
      throw new HttpException('Credenciais temporárias inválidas ou expiradas', HttpStatus.UNAUTHORIZED);
    }
    
    return { message: 'Credenciais válidas', valid: true };
  }

  @Public()
  @Post('first-login')
  @ApiOperation({ summary: 'Primeiro login com definição de nova senha (endpoint público)' })
  @ApiResponse({ status: 200, description: 'Senha definida com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async firstLogin(
    @Body() body: { username: string; temporaryPassword: string; newPassword: string }
  ) {
    const user = await this.usersService.processFirstLogin(
      body.username,
      body.temporaryPassword,
      body.newPassword
    );
    
    return { 
      message: 'Senha definida com sucesso. Faça login com suas novas credenciais.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName
      }
    };
  }
}