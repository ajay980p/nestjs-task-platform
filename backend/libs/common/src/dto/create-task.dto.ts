import { IsString, IsNotEmpty, IsOptional, IsEnum, IsMongoId, IsDateString } from 'class-validator';

export enum TaskStatus {
    TODO = 'TO_DO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
}

export class CreateTaskDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsDateString() // Valid ISO Date string check karega
    dueDate: string;

    @IsMongoId()
    projectId: string; // Task kis project ka hai

    @IsOptional()
    @IsMongoId()
    assignedTo?: string; // Kis employee ko dena hai
}

// Update ke liye bhi DTO chahiye hoga (Status change karne ke liye)
export class UpdateTaskStatusDto {
    @IsEnum(TaskStatus)
    status: TaskStatus;
}