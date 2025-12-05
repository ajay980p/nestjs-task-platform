import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from '@app/common'; // Shared Library se import

@Injectable()
export class ProjectServiceService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) { }

  // 1. Create Project
  async create(createProjectDto: CreateProjectDto, userId: string) {
    // Admin ko automatically assignedUsers mein daal rahe hain
    const adminId = new Types.ObjectId(userId);

    const newProject = new this.projectModel({
      ...createProjectDto,
      createdBy: adminId,
      assignedUsers: [adminId, ...(createProjectDto.assignedUsers?.map(id => new Types.ObjectId(id)) || [])],
    });
    return newProject.save();
  }

  // 2. Get All Projects (Admin Only)
  async findAll() {
    return this.projectModel.find().exec();
  }

  // 3. Get My Projects (User Only)
  async findByUser(userId: string) {
    return this.projectModel.find({
      assignedUsers: new Types.ObjectId(userId)
    }).exec();
  }

  // 4. Find One (Task Service validation ke liye)
  async findOne(id: string) {
    return this.projectModel.findById(id).exec();
  }
}