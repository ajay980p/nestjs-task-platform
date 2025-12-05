import { IsString, IsOptional, IsArray, IsMongoId } from 'class-validator';

export class UpdateProjectDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;

    // Optional: Update assigned users
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true })
    assignedUsers?: string[];
}

