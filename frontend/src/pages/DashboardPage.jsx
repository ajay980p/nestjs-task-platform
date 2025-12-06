import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, LogOut, Plus, FolderKanban, X, MoreVertical } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { projectApi } from '../api/projectApi';
import { authApi } from '../api/authApi';

// Validation schema for Create Project form
const createProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Project title is required')
    .min(3, 'Project title must be at least 3 characters')
    .max(100, 'Project title must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  assignedUsers: z.array(z.string()).optional().default([]),
});

// Validation schema for Edit Project form
const editProjectSchema = z.object({
  title: z
    .string()
    .min(1, 'Project title is required')
    .min(3, 'Project title must be at least 3 characters')
    .max(100, 'Project title must be less than 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  assignedUsers: z.array(z.string()).optional().default([]),
});

const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  // React Hook Form for Create Project
  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    formState: { errors: createErrors },
    reset: resetCreate,
    watch: watchCreate,
    setValue: setValueCreate,
  } = useForm({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      assignedUsers: [],
    },
  });

  const createAssignedUsers = watchCreate('assignedUsers') || [];

  // React Hook Form for Edit Project
  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    formState: { errors: editErrors },
    reset: resetEdit,
    watch: watchEdit,
    setValue: setValueEdit,
  } = useForm({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      assignedUsers: [],
    },
  });

  const editAssignedUsers = watchEdit('assignedUsers') || [];

  // Fetch user profile using React Query
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const userData = await authApi.getProfile();
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    },
    retry: false,
    onError: (err) => {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch user profile';
      toast.error(errorMessage);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      navigate('/login');
    },
  });

  // Fetch projects using React Query
  const {
    data: projects = [],
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const projectData = await projectApi.getAll();
      return Array.isArray(projectData) ? projectData : [];
    },
    enabled: !!user, // Only fetch when user is loaded
    onError: (err) => {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch projects';
      toast.error(errorMessage);
    },
  });

  // Fetch all users using React Query
  const {
    data: allUsers = [],
    isLoading: isLoadingUsers,
  } = useQuery({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const users = await authApi.getAllUsers();
      return users;
    },
    enabled: !!user && (showCreateModal || showEditModal), // Only fetch when modal is open
    onError: (err) => {
      console.error('Failed to load users:', err);
      toast.error('Failed to load users');
    },
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData) => {
      return await projectApi.create(projectData);
    },
    onSuccess: () => {
      toast.success('Project created successfully!');
      resetCreate(); // Reset form after successful creation
      handleCloseModal();
      // Invalidate and refetch projects
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create project';
      toast.error(errorMessage);
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ projectId, projectData }) => {
      return await projectApi.update(projectId, projectData);
    },
    onSuccess: () => {
      toast.success('Project updated successfully!');
      handleCloseEditModal();
      // Invalidate and refetch projects
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update project';
      toast.error(errorMessage);
    },
  });

  // Populate edit form when modal opens with project data
  useEffect(() => {
    if (showEditModal && editingProject && allUsers.length > 0) {
      const assignedUserIds = editingProject.assignedUsers?.map((u) => {
        if (typeof u === 'string') return u;
        if (u._id) return u._id.toString();
        if (u.id) return u.id.toString();
        return u.toString();
      }) || [];

      const userRoleIds = new Set(
        allUsers.map(u => (u.id || u._id)?.toString()).filter(Boolean)
      );
      const filteredAssignedUsers = assignedUserIds.filter(userId =>
        userRoleIds.has(userId.toString())
      );

      resetEdit({
        title: editingProject.title || editingProject.name || '',
        description: editingProject.description || '',
        assignedUsers: filteredAssignedUsers,
      });
    }
  }, [showEditModal, editingProject, allUsers, resetEdit]);

  // Helper function to filter out admin users and get only USER role user IDs
  const filterUserRoleIds = (assignedUsersArray) => {
    if (!assignedUsersArray || assignedUsersArray.length === 0) return [];

    // Convert all IDs to strings
    const userIds = assignedUsersArray.map(u => {
      if (typeof u === 'string') return u;
      if (u._id) return u._id.toString();
      if (u.id) return u.id.toString();
      return u.toString();
    });

    // Filter to only include IDs that exist in allUsers (which are all USER role)
    if (allUsers.length > 0) {
      const userRoleIds = new Set(
        allUsers.map(u => (u.id || u._id)?.toString()).filter(Boolean)
      );
      return userIds.filter(userId => userRoleIds.has(userId.toString()));
    }

    // Fallback: if we don't have allUsers loaded yet, assume all are USER except first one (admin)
    return userIds.slice(1);
  };

  // Helper function to count only USER role users (exclude ADMIN)
  const getAssignedUsersCount = (project) => {
    const userIds = filterUserRoleIds(project.assignedUsers);
    return userIds.length;
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookie from backend
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all queries
      queryClient.clear();
      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
    // Refetch users when modal opens
    queryClient.invalidateQueries({ queryKey: ['allUsers'] });
  };

  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowEditModal(true);
    // Refetch users to ensure we have latest data
    queryClient.invalidateQueries({ queryKey: ['allUsers'] });
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingProject(null);
    resetEdit();
  };

  const handleEditUserSelection = (userId) => {
    const currentUsers = editAssignedUsers || [];
    const isSelected = currentUsers.includes(userId);

    if (isSelected) {
      setValueEdit('assignedUsers', currentUsers.filter((id) => id !== userId), {
        shouldValidate: true,
      });
    } else {
      setValueEdit('assignedUsers', [...currentUsers, userId], {
        shouldValidate: true,
      });
    }
  };

  const onSubmitEditProject = (data) => {
    if (!editingProject) {
      toast.error('Project not found');
      return;
    }

    const projectData = {
      title: data.title.trim(),
      ...(data.description?.trim() && { description: data.description.trim() }),
      ...(data.assignedUsers && data.assignedUsers.length > 0 && { assignedUsers: data.assignedUsers }),
    };

    updateProjectMutation.mutate({
      projectId: editingProject._id || editingProject.id,
      projectData,
    });
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    resetCreate();
  };

  const handleUserSelection = (userId) => {
    const currentUsers = createAssignedUsers || [];
    const isSelected = currentUsers.includes(userId);

    if (isSelected) {
      setValueCreate('assignedUsers', currentUsers.filter((id) => id !== userId), {
        shouldValidate: true,
      });
    } else {
      setValueCreate('assignedUsers', [...currentUsers, userId], {
        shouldValidate: true,
      });
    }
  };

  const onSubmitCreateProject = (data) => {
    if (!user) {
      toast.error('User not found');
      return;
    }

    const projectData = {
      title: data.title.trim(),
      ...(data.description?.trim() && { description: data.description.trim() }),
      ...(data.assignedUsers && data.assignedUsers.length > 0 && { assignedUsers: data.assignedUsers }),
    };

    createProjectMutation.mutate(projectData);
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Fixed Dark Sidebar */}
      <aside className="w-20 bg-gray-900 text-white flex flex-col items-center py-6 fixed h-full">
        <div className="mb-8">
          <FolderKanban className="h-8 w-8 text-indigo-400" />
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="mt-auto flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-800 transition-colors"
          title="Logout"
        >
          <LogOut className="h-6 w-6" />
          <span className="text-xs">Logout</span>
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-20 p-8">
        {/* Header with Welcome Message */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user.name || user.email}!
            </h1>
            <p className="text-gray-600 mt-1">
              {user.role === 'ADMIN' ? 'Manage all projects' : 'View your assigned projects'}
            </p>
          </div>

          {/* Create New Project Button (Admin Only) */}
          {user.role === 'ADMIN' && (
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-md"
            >
              <Plus className="h-5 w-5" />
              <span>Create New Project</span>
            </button>
          )}
        </div>

        {/* Projects Section */}
        {isLoadingProjects ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : projectsError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{projectsError.response?.data?.message || projectsError.message || 'Failed to fetch projects'}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <FolderKanban className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No projects found</h3>
            <p className="text-gray-500">
              {user.role === 'ADMIN'
                ? 'Create your first project to get started'
                : 'You have no assigned projects yet'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project._id || project.id}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow hover:border-indigo-500 border-2 border-transparent relative group"
              >
                {/* Three-dot menu button */}
                {user.role === 'ADMIN' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditProject(project);
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                    title="Edit Project"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-600" />
                  </button>
                )}

                <div onClick={() => handleProjectClick(project._id || project.id)}>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 pr-8">
                    {project.title || project.name}
                  </h3>
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>
                      {getAssignedUsersCount(project)} assigned
                    </span>
                    {project.status && (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                        {project.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreate(onSubmitCreateProject)} className="p-6 space-y-6">
              {/* Title Field */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  {...registerCreate('title')}
                  className={`w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-400 ${createErrors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter project title"
                />
                {createErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{createErrors.title.message}</p>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  {...registerCreate('description')}
                  rows="4"
                  className={`w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-400 ${createErrors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter project description (optional)"
                />
                {createErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{createErrors.description.message}</p>
                )}
              </div>

              {/* Assign Users Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Users
                </label>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                    {allUsers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No users available
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {allUsers.map((userItem) => {
                          const userId = userItem.id || userItem._id;
                          const isSelected = createAssignedUsers.includes(userId);
                          return (
                            <label
                              key={userId}
                              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleUserSelection(userId)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {userItem.name || userItem.email}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {userItem.email} {userItem.role && `• ${userItem.role}`}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="text-indigo-600 text-sm font-medium">
                                  Selected
                                </div>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {createAssignedUsers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {createAssignedUsers.length} user(s) selected
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Edit Project</h2>
              <button
                onClick={handleCloseEditModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSubmitEdit(onSubmitEditProject)} className="p-6 space-y-6">
              {/* Title Field */}
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-title"
                  {...registerEdit('title')}
                  className={`w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-400 ${editErrors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter project title"
                />
                {editErrors.title && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.title.message}</p>
                )}
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  {...registerEdit('description')}
                  rows="4"
                  className={`w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-400 ${editErrors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Enter project description (optional)"
                />
                {editErrors.description && (
                  <p className="mt-1 text-sm text-red-600">{editErrors.description.message}</p>
                )}
              </div>

              {/* Assign Users Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Users
                </label>
                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                  </div>
                ) : (
                  <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
                    {allUsers.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No users available
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200">
                        {allUsers.map((userItem) => {
                          const userId = userItem.id || userItem._id;
                          const isSelected = editAssignedUsers.includes(userId);
                          return (
                            <label
                              key={userId}
                              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleEditUserSelection(userId)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {userItem.name || userItem.email}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {userItem.email} {userItem.role && `• ${userItem.role}`}
                                </div>
                              </div>
                              {isSelected && (
                                <div className="text-indigo-600 text-sm font-medium">
                                  Selected
                                </div>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {editAssignedUsers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {editAssignedUsers.length} user(s) selected
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProjectMutation.isPending}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateProjectMutation.isPending ? 'Updating...' : 'Update Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
