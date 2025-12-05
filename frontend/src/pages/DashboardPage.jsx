import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, LogOut, Plus, FolderKanban } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { projectApi } from '../api/projectApi';
import { authApi } from '../api/authApi';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleCreateProject = () => {
    navigate('/projects/create');
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
                onClick={() => handleProjectClick(project._id || project.id)}
                className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow hover:border-indigo-500 border-2 border-transparent"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {project.title || project.name}
                </h3>
                {project.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>
                    {project.assignedUsers?.length || 0} assigned
                  </span>
                  {project.status && (
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                      {project.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;

