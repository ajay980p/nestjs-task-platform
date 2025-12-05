import { IsString, IsNotEmpty, IsOptional, IsArray, IsMongoId } from 'class-validator';

export class CreateProjectDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    // Optional: Agar Admin create karte waqt hi users assign karna chahe
    @IsOptional()
    @IsArray()
    @IsMongoId({ each: true }) // Check karega ki valid MongoDB IDs hain
    assignedUsers?: string[];
}