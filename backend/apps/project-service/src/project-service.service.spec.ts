import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ProjectServiceService } from './project-service.service';
import { Project } from './schemas/project.schema';
import { CreateProjectDto, UpdateProjectDto } from '@app/common';
import { Types } from 'mongoose';

describe('ProjectServiceService', () => {
  let service: ProjectServiceService;
  let projectModel: any;

  // Mock project document
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockProjectId = '507f1f77bcf86cd799439012';
  const mockUser2Id = '507f1f77bcf86cd799439013';

  const mockProject = {
    _id: { toString: () => mockProjectId },
    title: 'Test Project',
    description: 'Test Description',
    createdBy: { toString: () => mockUserId },
    assignedUsers: [
      { toString: () => mockUserId },
      { toString: () => mockUser2Id },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectServiceService,
        {
          provide: getModelToken(Project.name),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ProjectServiceService>(ProjectServiceService);
    projectModel = module.get(getModelToken(Project.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createProjectDto: CreateProjectDto = {
      title: 'Test Project',
      description: 'Test Description',
      assignedUsers: [mockUser2Id],
    };

    it('should successfully create a new project with admin in assignedUsers', async () => {
      // Arrange
      const mockSave = jest.fn().mockResolvedValue({
        ...mockProject,
        _id: { toString: () => mockProjectId },
      });

      // Mock projectModel constructor
      const MockProjectModel = jest.fn().mockImplementation((data) => ({
        ...data,
        _id: { toString: () => mockProjectId },
        save: mockSave,
      }));

      // Override projectModel in service
      (service as any).projectModel = Object.assign(MockProjectModel, {});

      // Act
      const result = await service.create(createProjectDto, mockUserId);

      // Assert
      expect(MockProjectModel).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(mockSave).toHaveBeenCalled();
    });

    it('should include creator in assignedUsers when creating project', async () => {
      // Arrange
      const mockSave = jest.fn().mockResolvedValue(mockProject);

      const MockProjectModel = jest.fn().mockImplementation((data) => {
        return {
          ...data,
          _id: { toString: () => mockProjectId },
          save: mockSave,
        };
      });

      (service as any).projectModel = Object.assign(MockProjectModel, {});

      // Act
      await service.create(createProjectDto, mockUserId);

      // Assert
      expect(MockProjectModel).toHaveBeenCalled();
      const callArgs = MockProjectModel.mock.calls[0][0];
      expect(callArgs.createdBy.toString()).toBe(mockUserId);
      expect(callArgs.assignedUsers).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all projects created by a specific user', async () => {
      // Arrange
      const mockExec = jest.fn().mockResolvedValue([mockProject]);
      const mockFind = jest.fn().mockReturnValue({
        exec: mockExec,
      });

      // Override projectModel in service
      (service as any).projectModel = {
        find: mockFind,
      };

      // Act
      const result = await service.findAll(mockUserId);

      // Assert
      expect(mockFind).toHaveBeenCalledWith({
        createdBy: expect.any(Types.ObjectId),
      });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual([mockProject]);
    });
  });

  describe('findByUser', () => {
    it('should return all projects assigned to a specific user', async () => {
      // Arrange
      const mockExec = jest.fn().mockResolvedValue([mockProject]);
      const mockFind = jest.fn().mockReturnValue({
        exec: mockExec,
      });

      // Override projectModel in service
      (service as any).projectModel = {
        find: mockFind,
      };

      // Act
      const result = await service.findByUser(mockUser2Id);

      // Assert
      expect(mockFind).toHaveBeenCalledWith({
        assignedUsers: expect.any(Types.ObjectId),
      });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual([mockProject]);
    });
  });

  describe('findOne', () => {
    it('should return a project by its ID', async () => {
      // Arrange
      const mockExec = jest.fn().mockResolvedValue(mockProject);
      const mockFindById = jest.fn().mockReturnValue({
        exec: mockExec,
      });

      // Override projectModel in service
      (service as any).projectModel = {
        findById: mockFindById,
      };

      // Act
      const result = await service.findOne(mockProjectId);

      // Assert
      expect(mockFindById).toHaveBeenCalledWith(mockProjectId);
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockProject);
    });

    it('should return null if project not found', async () => {
      // Arrange
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockFindById = jest.fn().mockReturnValue({
        exec: mockExec,
      });

      // Override projectModel in service
      (service as any).projectModel = {
        findById: mockFindById,
      };

      // Act
      const result = await service.findOne('invalid-id');

      // Assert
      expect(mockFindById).toHaveBeenCalledWith('invalid-id');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateProjectDto: UpdateProjectDto = {
      title: 'Updated Project Title',
      description: 'Updated Description',
    };

    it('should successfully update project details', async () => {
      // Arrange
      const mockExec = jest.fn().mockResolvedValue({
        ...mockProject,
        title: updateProjectDto.title,
        description: updateProjectDto.description,
      });

      const mockFindByIdAndUpdate = jest.fn().mockReturnValue({
        exec: mockExec,
      });

      // Override projectModel in service
      (service as any).projectModel = {
        findByIdAndUpdate: mockFindByIdAndUpdate,
      };

      // Act
      const result = await service.update(mockProjectId, updateProjectDto);

      // Assert
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        mockProjectId,
        { $set: updateProjectDto },
        { new: true },
      );
      expect(result).toBeDefined();
    });

    it('should preserve admin in assignedUsers when updating', async () => {
      // Arrange
      const updateDto: UpdateProjectDto = {
        assignedUsers: [mockUser2Id],
      };

      const mockExistingProject = {
        ...mockProject,
        createdBy: new Types.ObjectId(mockUserId),
      };

      const mockFindById = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockExistingProject),
      });

      const mockExec = jest.fn().mockResolvedValue({
        ...mockProject,
        assignedUsers: [new Types.ObjectId(mockUserId), new Types.ObjectId(mockUser2Id)],
      });

      const mockFindByIdAndUpdate = jest.fn().mockReturnValue({
        exec: mockExec,
      });

      // Override projectModel in service
      (service as any).projectModel = {
        findById: mockFindById,
        findByIdAndUpdate: mockFindByIdAndUpdate,
      };

      // Act
      await service.update(mockProjectId, updateDto);

      // Assert
      expect(mockFindById).toHaveBeenCalledWith(mockProjectId);
      const updateCall = mockFindByIdAndUpdate.mock.calls[0];
      expect(updateCall[1].$set.assignedUsers).toBeDefined();
      // Admin should be included
      expect(updateCall[1].$set.assignedUsers[0].toString()).toBe(mockUserId);
    });
  });
});

