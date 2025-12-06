import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { TaskServiceService } from './task-service.service';
import { Task, TaskStatus } from './schemas/task.schema';
import { CreateTaskDto, UpdateTaskStatusDto } from '@app/common';
import { NotFoundException } from '@nestjs/common';
import { of } from 'rxjs';

describe('TaskServiceService', () => {
  let service: TaskServiceService;
  let taskModel: any;
  let projectClient: jest.Mocked<ClientProxy>;

  // Mock IDs
  const mockProjectId = '507f1f77bcf86cd799439012';
  const mockTaskId = '507f1f77bcf86cd799439014';
  const mockUserId = '507f1f77bcf86cd799439011';

  const mockProject = {
    _id: { toString: () => mockProjectId },
    title: 'Test Project',
    createdBy: { toString: () => mockUserId },
  };

  const mockTask = {
    _id: { toString: () => mockTaskId },
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    dueDate: new Date('2024-12-31'),
    projectId: { toString: () => mockProjectId },
    assignedTo: { toString: () => mockUserId },
  };

  beforeEach(async () => {
    // Mock ClientProxy
    const mockClientProxy = {
      send: jest.fn(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskServiceService,
        {
          provide: getModelToken(Task.name),
          useValue: {},
        },
        {
          provide: 'PROJECT_SERVICE',
          useValue: mockClientProxy,
        },
      ],
    }).compile();

    service = module.get<TaskServiceService>(TaskServiceService);
    taskModel = module.get(getModelToken(Task.name));
    projectClient = module.get('PROJECT_SERVICE');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'Test Task',
      description: 'Test Description',
      dueDate: '2024-12-31',
      projectId: mockProjectId,
      assignedTo: mockUserId,
    };

    it('should successfully create a new task after validating project exists', async () => {
      // Arrange
      projectClient.send.mockReturnValue(of(mockProject)); // Project exists
      const mockSave = jest.fn().mockResolvedValue(mockTask);

      // Mock taskModel constructor
      const MockTaskModel = jest.fn().mockImplementation((data) => ({
        ...data,
        _id: { toString: () => mockTaskId },
        save: mockSave,
      }));

      // Override taskModel in service
      (service as any).taskModel = Object.assign(MockTaskModel, {});

      // Act
      const result = await service.create(createTaskDto);

      // Assert
      expect(projectClient.send).toHaveBeenCalledWith(
        { cmd: 'get_project_by_id' },
        mockProjectId,
      );
      expect(MockTaskModel).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if project does not exist', async () => {
      // Arrange
      projectClient.send.mockReturnValue(of(null)); // Project doesn't exist

      // Act & Assert
      await expect(service.create(createTaskDto)).rejects.toThrow(NotFoundException);
      await expect(service.create(createTaskDto)).rejects.toThrow('Project not found');
      expect(projectClient.send).toHaveBeenCalledWith(
        { cmd: 'get_project_by_id' },
        mockProjectId,
      );
    });

    it('should create task without assignedTo if not provided', async () => {
      // Arrange
      const createTaskDtoWithoutUser: CreateTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        dueDate: '2024-12-31',
        projectId: mockProjectId,
      };

      projectClient.send.mockReturnValue(of(mockProject));
      const mockSave = jest.fn().mockResolvedValue({
        ...mockTask,
        assignedTo: null,
      });

      const MockTaskModel = jest.fn().mockImplementation((data) => ({
        ...data,
        _id: { toString: () => mockTaskId },
        save: mockSave,
      }));

      (service as any).taskModel = Object.assign(MockTaskModel, {});

      // Act
      await service.create(createTaskDtoWithoutUser);

      // Assert
      expect(projectClient.send).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
    });
  });

  describe('findByProject', () => {
    it('should return all tasks for a specific project', async () => {
      // Arrange
      const mockExec = jest.fn().mockResolvedValue([mockTask]);
      const mockFind = jest.fn().mockReturnValue({
        exec: mockExec,
      });

      // Override taskModel in service
      (service as any).taskModel = {
        find: mockFind,
      };

      // Act
      const result = await service.findByProject(mockProjectId);

      // Assert
      expect(mockFind).toHaveBeenCalled();
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual([mockTask]);
    });

    it('should return empty array if no tasks found for project', async () => {
      // Arrange
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockFind = jest.fn().mockReturnValue({
        exec: mockExec,
      });

      // Override taskModel in service
      (service as any).taskModel = {
        find: mockFind,
      };

      // Act
      const result = await service.findByProject(mockProjectId);

      // Assert
      expect(mockFind).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    const updateTaskStatusDto: UpdateTaskStatusDto = {
      status: TaskStatus.IN_PROGRESS,
    };

    it('should successfully update task status', async () => {
      // Arrange
      const updatedTask = {
        _id: { toString: () => mockTaskId },
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date('2024-12-31'),
        projectId: { toString: () => mockProjectId },
        assignedTo: { toString: () => mockUserId },
      };

      const mockExec = jest.fn().mockResolvedValue(updatedTask);
      const mockFindByIdAndUpdate = jest.fn().mockReturnValue({
        exec: mockExec,
      });

      // Override taskModel in service
      (service as any).taskModel = {
        findByIdAndUpdate: mockFindByIdAndUpdate,
      };

      // Act
      const result = await service.updateStatus(mockTaskId, updateTaskStatusDto);

      // Assert
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        mockTaskId,
        { status: updateTaskStatusDto.status },
        { new: true },
      );
      expect(mockExec).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should update status to DONE', async () => {
      // Arrange
      const updateDto: UpdateTaskStatusDto = {
        status: TaskStatus.DONE,
      };

      const updatedTask = {
        _id: { toString: () => mockTaskId },
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.DONE,
        dueDate: new Date('2024-12-31'),
        projectId: { toString: () => mockProjectId },
        assignedTo: { toString: () => mockUserId },
      };

      const mockExec = jest.fn().mockResolvedValue(updatedTask);
      const mockFindByIdAndUpdate = jest.fn().mockReturnValue({
        exec: mockExec,
      });

      // Override taskModel in service
      (service as any).taskModel = {
        findByIdAndUpdate: mockFindByIdAndUpdate,
      };

      // Act
      const result = await service.updateStatus(mockTaskId, updateDto);

      // Assert
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        mockTaskId,
        { status: TaskStatus.DONE },
        { new: true },
      );
      expect(mockExec).toHaveBeenCalled();
      expect(result.status).toBe(TaskStatus.DONE);
    });

    it('should update status to TO_DO', async () => {
      // Arrange
      const updateDto: UpdateTaskStatusDto = {
        status: TaskStatus.TODO,
      };

      const updatedTask = {
        _id: { toString: () => mockTaskId },
        title: 'Test Task',
        description: 'Test Description',
        status: TaskStatus.TODO,
        dueDate: new Date('2024-12-31'),
        projectId: { toString: () => mockProjectId },
        assignedTo: { toString: () => mockUserId },
      };

      const mockExec = jest.fn().mockResolvedValue(updatedTask);
      const mockFindByIdAndUpdate = jest.fn().mockReturnValue({
        exec: mockExec,
      });

      // Override taskModel in service
      (service as any).taskModel = {
        findByIdAndUpdate: mockFindByIdAndUpdate,
      };

      // Act
      const result = await service.updateStatus(mockTaskId, updateDto);

      // Assert
      expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
        mockTaskId,
        { status: TaskStatus.TODO },
        { new: true },
      );
      expect(mockExec).toHaveBeenCalled();
      expect(result.status).toBe(TaskStatus.TODO);
    });
  });
});

