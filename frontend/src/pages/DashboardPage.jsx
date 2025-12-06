import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogOut, Plus, FolderKanban, X, MoreVertical } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { projectApi } from '../api/projectApi';
import { authApi } from '../api/authApi';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

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
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedUsers: [],
  });
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    assignedUsers: [],
  });

  useEffect(() => {
    // Fetch user profile from backend using token
    const fetchUserProfile = async () => {
      try {
        const userData = await authApi.getProfile();
        setUser(userData);
        // Also save to localStorage for quick access (optional)
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch user profile';
        toast.error(errorMessage);
        // Clear localStorage if token is invalid
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };

    fetchUserProfile();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let projectData;

        if (user.role === 'ADMIN') {
          // Admin: Fetch all projects
          projectData = await projectApi.getAll();
        } else {
          // User: Fetch only assigned projects
          projectData = await projectApi.getMyProjects(user.id || user._id);
        }

        setProjects(Array.isArray(projectData) ? projectData : []);
      } catch (err) {
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch projects';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();

    // Also fetch all users for counting assigned users correctly
    const fetchUsers = async () => {
      try {
        const users = await authApi.getAllUsers();
        setAllUsers(users);
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    };
    fetchUsers();
  }, [user]);

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookie from backend
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const handleCreateProject = async () => {
    setShowCreateModal(true);
    // Fetch all users when modal opens
    setIsLoadingUsers(true);
    try {
      const users = await authApi.getAllUsers();
      setAllUsers(users);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleEditProject = async (project) => {
    // Fetch all users first so we can filter admin from assignedUsers
    setIsLoadingUsers(true);
    try {
      const users = await authApi.getAllUsers();
      setAllUsers(users);

      // Now filter out admin users from assignedUsers before setting editFormData
      const assignedUserIds = project.assignedUsers?.map((u) => {
        if (typeof u === 'string') return u;
        if (u._id) return u._id.toString();
        if (u.id) return u.id.toString();
        return u.toString();
      }) || [];

      // Filter to only include USER role users (exclude admin)
      const userRoleIds = new Set(
        users.map(u => (u.id || u._id)?.toString()).filter(Boolean)
      );
      const filteredAssignedUsers = assignedUserIds.filter(userId =>
        userRoleIds.has(userId.toString())
      );

      setEditingProject(project);
      setEditFormData({
        title: project.title || project.name || '',
        description: project.description || '',
        assignedUsers: filteredAssignedUsers,
      });
      setShowEditModal(true);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingProject(null);
    setEditFormData({
      title: '',
      description: '',
      assignedUsers: [],
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditUserSelection = (userId) => {
    setEditFormData((prev) => {
      const isSelected = prev.assignedUsers.includes(userId);
      if (isSelected) {
        return {
          ...prev,
          assignedUsers: prev.assignedUsers.filter((id) => id !== userId),
        };
      } else {
        return {
          ...prev,
          assignedUsers: [...prev.assignedUsers, userId],
        };
      }
    });
  };

  const handleUpdateProject = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent card click

    if (!editFormData.title.trim()) {
      toast.error('Project title is required');
      return;
    }

    if (!editingProject) {
      toast.error('Project not found');
      return;
    }

    setIsLoading(true);

    try {
      const projectData = {
        title: editFormData.title.trim(),
        ...(editFormData.description.trim() && { description: editFormData.description.trim() }),
        assignedUsers: editFormData.assignedUsers,
      };

      await projectApi.update(editingProject._id || editingProject.id, projectData);
      toast.success('Project updated successfully!');
      handleCloseEditModal();

      // Refresh projects list
      if (user.role === 'ADMIN') {
        const updatedProjects = await projectApi.getAll();
        setProjects(Array.isArray(updatedProjects) ? updatedProjects : []);
      } else {
        const updatedProjects = await projectApi.getMyProjects(user.id || user._id);
        setProjects(Array.isArray(updatedProjects) ? updatedProjects : []);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update project';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setFormData({
      title: '',
      description: '',
      assignedUsers: [],
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUserSelection = (userId) => {
    setFormData((prev) => {
      const isSelected = prev.assignedUsers.includes(userId);
      if (isSelected) {
        return {
          ...prev,
          assignedUsers: prev.assignedUsers.filter((id) => id !== userId),
        };
      } else {
        return {
          ...prev,
          assignedUsers: [...prev.assignedUsers, userId],
        };
      }
    });
  };

  const handleSubmitProject = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Project title is required');
      return;
    }

    if (!user) {
      toast.error('User not found');
      return;
    }

    setIsLoading(true);

    try {
      const projectData = {
        title: formData.title.trim(),
        ...(formData.description.trim() && { description: formData.description.trim() }),
        ...(formData.assignedUsers.length > 0 && { assignedUsers: formData.assignedUsers }),
      };

      await projectApi.create(projectData, user.id || user._id);
      toast.success('Project created successfully!');
      handleCloseModal();

      // Refresh projects list
      if (user.role === 'ADMIN') {
        const updatedProjects = await projectApi.getAll();
        setProjects(Array.isArray(updatedProjects) ? updatedProjects : []);
      } else {
        const updatedProjects = await projectApi.getMyProjects(user.id || user._id);
        setProjects(Array.isArray(updatedProjects) ? updatedProjects : []);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create project';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
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
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">{error}</p>
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

            <form onSubmit={handleSubmitProject} className="p-6 space-y-6">
              {/* Title Field */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="Enter project title"
                />
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  rows="4"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="Enter project description (optional)"
                />
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
                          const isSelected = formData.assignedUsers.includes(userItem.id || userItem._id);
                          return (
                            <label
                              key={userItem.id || userItem._id}
                              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-indigo-50' : ''
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleUserSelection(userItem.id || userItem._id)}
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
                {formData.assignedUsers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {formData.assignedUsers.length} user(s) selected
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
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Creating...' : 'Create Project'}
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

            <form onSubmit={handleUpdateProject} className="p-6 space-y-6">
              {/* Title Field */}
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="edit-title"
                  name="title"
                  value={editFormData.title}
                  onChange={handleEditFormChange}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="Enter project title"
                />
              </div>

              {/* Description Field */}
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={editFormData.description}
                  onChange={handleEditFormChange}
                  rows="4"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-400"
                  placeholder="Enter project description (optional)"
                />
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
                          const isSelected = editFormData.assignedUsers.includes(userId);
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
                {editFormData.assignedUsers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {editFormData.assignedUsers.length} user(s) selected
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
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Updating...' : 'Update Project'}
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

