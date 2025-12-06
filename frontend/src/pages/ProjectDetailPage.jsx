import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, ArrowLeft, X, Calendar, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { taskApi } from '../api/taskApi';
import { projectApi } from '../api/projectApi';
import { authApi } from '../api/authApi';

const TASK_STATUS = {
  TO_DO: 'TO_DO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
};

// Validation schema for Create Task form
const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .min(3, 'Task title must be at least 3 characters')
    .max(100, 'Task title must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  dueDate: z
    .string()
    .min(1, 'Due date is required')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'Due date must be today or in the future'),
  assignedTo: z.string().optional().or(z.literal('')),
});

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Fetch user profile using React Query
  const { data: user } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const userData = await authApi.getProfile();
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    },
    retry: false,
  });

  // Fetch project details using React Query
  const {
    data: project,
    isLoading: isLoadingProject,
    error: projectError,
  } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      return await projectApi.getById(projectId);
    },
    enabled: !!projectId,
    retry: false,
  });

  // Fetch tasks using React Query
  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    error: tasksError,
  } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const tasksData = await taskApi.getByProject(projectId);
      return Array.isArray(tasksData) ? tasksData : [];
    },
    enabled: !!projectId,
    retry: false,
  });

  // Fetch all users using React Query
  const {
    data: allUsers = [],
    isLoading: isLoadingUsers,
  } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      return await authApi.getAllUsers();
    },
    enabled: showTaskModal, // Only fetch when modal is open
    retry: false,
  });

  // Group tasks by status
  const tasksByStatus = {
    TO_DO: tasks.filter((task) => task.status === TASK_STATUS.TO_DO),
    IN_PROGRESS: tasks.filter((task) => task.status === TASK_STATUS.IN_PROGRESS),
    DONE: tasks.filter((task) => task.status === TASK_STATUS.DONE),
  };

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }) => {
      return await taskApi.updateStatus(taskId, status);
    },
    onSuccess: () => {
      toast.success('Task status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update task status';
      toast.error(errorMessage);
    },
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData) => {
      return await taskApi.create({
        ...taskData,
        projectId: projectId,
      });
    },
    onSuccess: () => {
      toast.success('Task created successfully');
      setShowTaskModal(false);
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create task';
      toast.error(errorMessage);
    },
  });

  const handleStatusUpdate = (taskId, newStatus) => {
    updateStatusMutation.mutate({ taskId, status: newStatus });
  };

  const handleOpenTaskModal = () => {
    setShowTaskModal(true);
    // Invalidate users query to refetch when modal opens
    queryClient.invalidateQueries({ queryKey: ['allUsers'] });
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const isLoading = isLoadingProject || isLoadingTasks;
  const error = projectError || tasksError;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !project) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch project data';
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-red-600 mb-4">{errorMessage}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {project?.title || project?.name || 'Project'}
                </h1>
                {project?.description && (
                  <p className="text-gray-600 text-sm mt-1">{project.description}</p>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Welcome, {user?.name || user?.email || 'User'}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Kanban Board */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Add Task Button - Only visible to ADMIN */}
        {user?.role === 'ADMIN' && (
          <div className="mb-6">
            <button
              onClick={handleOpenTaskModal}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-md"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Task</span>
            </button>
          </div>
        )}

        {/* Kanban Board - Three Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TO DO Column */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-700">
                TO DO ({tasksByStatus.TO_DO.length})
              </h2>
            </div>
            <div className="space-y-3">
              {tasksByStatus.TO_DO.map((task) => (
                <TaskCard
                  key={task._id || task.id}
                  task={task}
                  onStatusUpdate={handleStatusUpdate}
                  formatDate={formatDate}
                  allUsers={allUsers}
                />
              ))}
              {tasksByStatus.TO_DO.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No tasks
                </div>
              )}
            </div>
          </div>

          {/* IN PROGRESS Column */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-700">
                IN PROGRESS ({tasksByStatus.IN_PROGRESS.length})
              </h2>
            </div>
            <div className="space-y-3">
              {tasksByStatus.IN_PROGRESS.map((task) => (
                <TaskCard
                  key={task._id || task.id}
                  task={task}
                  onStatusUpdate={handleStatusUpdate}
                  formatDate={formatDate}
                  allUsers={allUsers}
                />
              ))}
              {tasksByStatus.IN_PROGRESS.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No tasks
                </div>
              )}
            </div>
          </div>

          {/* DONE Column */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-700">
                DONE ({tasksByStatus.DONE.length})
              </h2>
            </div>
            <div className="space-y-3">
              {tasksByStatus.DONE.map((task) => (
                <TaskCard
                  key={task._id || task.id}
                  task={task}
                  onStatusUpdate={handleStatusUpdate}
                  formatDate={formatDate}
                  allUsers={allUsers}
                />
              ))}
              {tasksByStatus.DONE.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No tasks
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <TaskModal
          onClose={handleCloseTaskModal}
          onSubmit={(data) => createTaskMutation.mutate(data)}
          allUsers={allUsers}
          isLoadingUsers={isLoadingUsers}
          isPending={createTaskMutation.isPending}
        />
      )}
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, onStatusUpdate, formatDate, allUsers }) => {
  // Find user name from user ID
  const getAssignedUserName = (userId) => {
    if (!userId || !allUsers || allUsers.length === 0) return userId;
    const user = allUsers.find((u) => (u.id || u._id) === userId);
    return user ? (user.name || user.email || userId) : userId;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow border border-gray-200">
      <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="space-y-2 mb-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{formatDate(task.dueDate)}</span>
        </div>

        {task.assignedTo && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{getAssignedUserName(task.assignedTo)}</span>
          </div>
        )}
      </div>

      {/* Status Update Dropdown */}
      <select
        value={task.status}
        onChange={(e) => onStatusUpdate(task._id || task.id, e.target.value)}
        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-700"
      >
        <option value={TASK_STATUS.TO_DO}>TO DO</option>
        <option value={TASK_STATUS.IN_PROGRESS}>IN PROGRESS</option>
        <option value={TASK_STATUS.DONE}>DONE</option>
      </select>
    </div>
  );
};

// Task Modal Component
const TaskModal = ({ onClose, onSubmit, allUsers, isLoadingUsers, isPending }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      assignedTo: '',
    },
  });

  const handleFormSubmit = (data) => {
    const taskData = {
      title: data.title.trim(),
      ...(data.description?.trim() && { description: data.description.trim() }),
      dueDate: data.dueDate,
      ...(data.assignedTo && data.assignedTo.trim() && { assignedTo: data.assignedTo.trim() }),
    };
    onSubmit(taskData);
    reset(); // Reset form after submission
  };

  const handleClose = () => {
    reset(); // Reset form when closing
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              {...register('title')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 ${errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Enter task title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows="3"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 ${errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Enter task description (optional)"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="dueDate"
              {...register('dueDate')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 ${errors.dueDate ? 'border-red-500' : 'border-gray-300'
                }`}
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600">{errors.dueDate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
              Assigned To
            </label>
            {isLoadingUsers ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-white">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                <span className="text-sm text-gray-500">Loading users...</span>
              </div>
            ) : (
              <select
                id="assignedTo"
                {...register('assignedTo')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white ${errors.assignedTo ? 'border-red-500' : 'border-gray-300'
                  }`}
              >
                <option value="">Select a user (optional)</option>
                {allUsers.map((user) => (
                  <option key={user.id || user._id} value={user.id || user._id}>
                    {user.name || user.email} {user.email && user.name ? `(${user.email})` : ''}
                  </option>
                ))}
              </select>
            )}
            {errors.assignedTo && (
              <p className="mt-1 text-sm text-red-600">{errors.assignedTo.message}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectDetailPage;

