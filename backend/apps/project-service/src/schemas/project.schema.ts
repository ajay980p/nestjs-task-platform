import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {

    // 1. Project Title
    @Prop({ required: true, trim: true })
    title: string;

    // 2. Description
    @Prop()
    description: string;

    // 3. Created By (Admin ID)
    @Prop({ type: Types.ObjectId, required: true })
    createdBy: Types.ObjectId;

    // 4. Assigned Users (Employees)
    @Prop({ type: [{ type: Types.ObjectId }], default: [] })
    assignedUsers: Types.ObjectId[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);