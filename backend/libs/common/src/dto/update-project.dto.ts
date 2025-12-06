import { IsString, IsOptional, IsArray, IsMongoId, MinLength, MaxLength, ArrayMinSize } from 'class-validator';

export class UpdateProjectDto {
    @IsString()
    @IsOptional()
    @MinLength(3, { message: 'Project title must be at least 3 characters long' })
    @MaxLength(100, { message: 'Project title must be less than 100 characters' })
    title?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500, { message: 'Description must be less than 500 characters' })
    description?: string;

    // Optional: Update assigned users
    @IsOptional()
    @IsArray({ message: 'Assigned users must be an array' })
    @ArrayMinSize(0, { message: 'Assigned users array cannot be negative' })
    @IsMongoId({ each: true, message: 'Each assigned user must be a valid MongoDB ID' })
    assignedUsers?: string[];
}

