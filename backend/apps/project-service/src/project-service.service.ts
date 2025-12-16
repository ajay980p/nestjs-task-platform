import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto, UpdateProjectDto } from '@app/common';

@Injectable()
export class ProjectServiceService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) { }

  // Create a new project with title, description, assigned users, and automatically assign creator as admin
  async create(createProjectDto: CreateProjectDto, userId: string) {
    try {
      // Admin ko automatically assignedUsers mein daal rahe hain
      const adminId = new Types.ObjectId(userId);

      const newProject = new this.projectModel({
        ...createProjectDto,
        createdBy: adminId,
        assignedUsers: [adminId, ...(createProjectDto.assignedUsers?.map(id => new Types.ObjectId(id)) || [])],
      });
      return await newProject.save();
    } catch (error) {
      // Re-throw RpcException as-is (for business logic errors)
      if (error instanceof RpcException) {
        throw error;
      }
      // Handle unexpected errors
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to create project',
      });
    }
  }

  // Get all projects created by a specific user (filters by createdBy field)
  async findAll(userId: string) {
    try {
      return await this.projectModel.find({
        createdBy: new Types.ObjectId(userId)
      }).exec();
    } catch (error) {
      // Re-throw RpcException as-is (for business logic errors)
      if (error instanceof RpcException) {
        throw error;
      }
      // Handle unexpected errors
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to fetch all projects',
      });
    }
  }

  // Get all projects assigned to a specific user (filters by assignedUsers array)
  async findByUser(userId: string) {
    try {
      return await this.projectModel.find({
        assignedUsers: new Types.ObjectId(userId)
      }).exec();
    } catch (error) {
      // Re-throw RpcException as-is (for business logic errors)
      if (error instanceof RpcException) {
        throw error;
      }
      // Handle unexpected errors
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to fetch user projects',
      });
    }
  }

  // Get a single project by its ID (used for task service validation)
  async findOne(id: string) {
    try {
      return await this.projectModel.findById(id).exec();
    } catch (error) {
      // Re-throw RpcException as-is (for business logic errors)
      if (error instanceof RpcException) {
        throw error;
      }
      // Handle unexpected errors
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to fetch project',
      });
    }
  }

  // Update project details (title, description, assigned users) while preserving creator in assignedUsers
  async update(id: string, updateProjectDto: UpdateProjectDto, userId?: string) {
    try {
      const updateData: any = {};

      if (updateProjectDto.title) {
        updateData.title = updateProjectDto.title;
      }

      if (updateProjectDto.description !== undefined) {
        updateData.description = updateProjectDto.description;
      }

      if (updateProjectDto.assignedUsers !== undefined) {
        // Get existing project to preserve admin in assignedUsers
        const existingProject = await this.projectModel.findById(id).exec();
        const adminId = existingProject?.createdBy || (userId ? new Types.ObjectId(userId) : null);

        // Always include admin, then add the new assigned users
        const newAssignedUsers = updateProjectDto.assignedUsers.map(userId => new Types.ObjectId(userId));
        if (adminId && !newAssignedUsers.some(id => id.equals(adminId))) {
          updateData.assignedUsers = [adminId, ...newAssignedUsers];
        } else {
          updateData.assignedUsers = newAssignedUsers;
        }
      }

      return await this.projectModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      ).exec();
    } catch (error) {
      // Re-throw RpcException as-is (for business logic errors)
      if (error instanceof RpcException) {
        throw error;
      }
      // Handle unexpected errors
      throw new RpcException({
        status: 500,
        message: error.message || 'Failed to update project',
      });
    }
  }
}