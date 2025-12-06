import { IsString, IsNotEmpty, IsOptional, IsEnum, IsMongoId, IsDateString, MinLength, MaxLength } from 'class-validator';

export enum TaskStatus {
    TODO = 'TO_DO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
}

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty({ message: 'Task title is required' })
    @MinLength(3, { message: 'Task title must be at least 3 characters long' })
    @MaxLength(100, { message: 'Task title must be less than 100 characters' })
    title: string;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Description must be less than 500 characters' })
    description?: string;

    @IsDateString({}, { message: 'Due date must be a valid date string' })
    @IsNotEmpty({ message: 'Due date is required' })
    dueDate: string;

    @IsMongoId({ message: 'Project ID must be a valid MongoDB ID' })
    @IsNotEmpty({ message: 'Project ID is required' })
    projectId: string;

    @IsOptional()
    @IsMongoId({ message: 'Assigned user ID must be a valid MongoDB ID' })
    assignedTo?: string;
}

export class UpdateTaskStatusDto {
    @IsEnum(TaskStatus, { message: 'Status must be one of: TO_DO, IN_PROGRESS, DONE' })
    @IsNotEmpty({ message: 'Status is required' })
    status: TaskStatus;
}