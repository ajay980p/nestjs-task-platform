import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

export enum TaskStatus {
    TODO = 'TO_DO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
}

@Schema({ timestamps: true })
export class Task {
    @Prop({ required: true, trim: true })
    title: string;

    @Prop()
    description: string;

    @Prop({ required: true, enum: TaskStatus, default: TaskStatus.TODO })
    status: string;

    @Prop({ required: true })
    dueDate: Date;

    @Prop({ type: Types.ObjectId, required: true })
    projectId: Types.ObjectId;

    @Prop({ type: Types.ObjectId })
    assignedTo: Types.ObjectId;
}

export const TaskSchema = SchemaFactory.createForClass(Task);