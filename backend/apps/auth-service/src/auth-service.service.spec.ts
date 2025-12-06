import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthServiceService } from './auth-service.service';
import { User } from './schemas/user.schema';
import { CreateUserDto, LoginUserDto, UserRole } from '@app/common';
import { RpcException } from '@nestjs/microservices';

// Mock bcrypt
jest.mock('bcryptjs');

describe('AuthServiceService', () => {
    let service: AuthServiceService;
    let userModel: any;
    let jwtService: JwtService;

    // Mock user document
    const mockUserId = '507f1f77bcf86cd799439011';
    const mockUser = {
        _id: { toString: () => mockUserId },
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: UserRole.USER,
    };

    // Mock JWT service
    const mockJwtService = {
        sign: jest.fn(),
        verifyAsync: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthServiceService,
                {
                    provide: getModelToken(User.name),
                    useValue: {},
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        service = module.get<AuthServiceService>(AuthServiceService);
        jwtService = module.get<JwtService>(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        const createUserDto: CreateUserDto = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            role: UserRole.USER,
        };

        it('should successfully register a new user', async () => {
            // Arrange
            const mockFindOne = jest.fn().mockResolvedValue(null); // User doesn't exist
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

            const mockSave = jest.fn().mockResolvedValue({
                ...mockUser,
                _id: { toString: () => mockUserId },
            });

            // Mock userModel with constructor
            const MockUserModel = jest.fn().mockImplementation((data) => ({
                ...data,
                _id: { toString: () => mockUserId },
                save: mockSave,
            }));

            // Override userModel in service
            (service as any).userModel = Object.assign(MockUserModel, {
                findOne: mockFindOne,
            });

            // Act
            const result = await service.register(createUserDto);

            // Assert
            expect(mockFindOne).toHaveBeenCalledWith({ email: createUserDto.email });
            expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
            expect(result).toHaveProperty('message', 'User registered successfully');
            expect(result).toHaveProperty('userId', mockUserId);
            expect(mockSave).toHaveBeenCalled();
        });

        it('should throw RpcException if user already exists', async () => {
            // Arrange
            const mockFindOne = jest.fn().mockResolvedValue(mockUser); // User exists

            // Override userModel in service
            (service as any).userModel = {
                findOne: mockFindOne,
            };

            // Act & Assert
            await expect(service.register(createUserDto)).rejects.toThrow(RpcException);
            expect(mockFindOne).toHaveBeenCalledWith({ email: createUserDto.email });
            expect(bcrypt.hash).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        const loginUserDto: LoginUserDto = {
            email: 'test@example.com',
            password: 'password123',
        };

        it('should successfully login with valid credentials', async () => {
            // Arrange
            const mockFindOne = jest.fn().mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockJwtService.sign.mockReturnValue('mockAccessToken');

            // Override userModel in service
            (service as any).userModel = {
                findOne: mockFindOne,
            };

            // Act
            const result = await service.login(loginUserDto);

            // Assert
            expect(mockFindOne).toHaveBeenCalledWith({ email: loginUserDto.email });
            expect(bcrypt.compare).toHaveBeenCalledWith(loginUserDto.password, mockUser.password);
            expect(mockJwtService.sign).toHaveBeenCalledWith({
                userId: mockUserId,
                email: mockUser.email,
                role: mockUser.role,
            });
            expect(result).toHaveProperty('accessToken', 'mockAccessToken');
            expect(result).toHaveProperty('user');
            expect(result.user).toHaveProperty('id', mockUserId);
            expect(result.user).toHaveProperty('name', mockUser.name);
            expect(result.user).toHaveProperty('role', mockUser.role);
        });

        it('should throw RpcException if user does not exist', async () => {
            // Arrange
            const mockFindOne = jest.fn().mockResolvedValue(null); // User doesn't exist

            // Override userModel in service
            (service as any).userModel = {
                findOne: mockFindOne,
            };

            // Act & Assert
            await expect(service.login(loginUserDto)).rejects.toThrow(RpcException);
            expect(mockFindOne).toHaveBeenCalledWith({ email: loginUserDto.email });
            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(mockJwtService.sign).not.toHaveBeenCalled();
        });

        it('should throw RpcException if password is incorrect', async () => {
            // Arrange
            const mockFindOne = jest.fn().mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Wrong password

            // Override userModel in service
            (service as any).userModel = {
                findOne: mockFindOne,
            };

            // Act & Assert
            await expect(service.login(loginUserDto)).rejects.toThrow(RpcException);
            expect(mockFindOne).toHaveBeenCalledWith({ email: loginUserDto.email });
            expect(bcrypt.compare).toHaveBeenCalledWith(loginUserDto.password, mockUser.password);
            expect(mockJwtService.sign).not.toHaveBeenCalled();
        });
    });
});
