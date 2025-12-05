import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Plus, ArrowLeft, X, Calendar, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { taskApi } from '../api/taskApi';
import { projectApi } from '../api/projectApi';

const TASK_STATUS = {
  TO_DO: 'TO_DO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
};

const ProjectDetailPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [userName, setUserName] = useState('');
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignedTo: '',
  });

  useEffect(() => {
    // Read user name from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserName(user.name || user.email || 'User');
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  useEffect(() => {
    fetchProjectAndTasks();
  }, [projectId]);

  const fetchProjectAndTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch project details
      const projectData = await projectApi.getById(projectId);
      setProject(projectData);

      // Fetch tasks for this project
      const tasksData = await taskApi.getByProject(projectId);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch project data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Group tasks by status
  const tasksByStatus = {
    TO_DO: tasks.filter((task) => task.status === TASK_STATUS.TO_DO),
    IN_PROGRESS: tasks.filter((task) => task.status === TASK_STATUS.IN_PROGRESS),
    DONE: tasks.filter((task) => task.status === TASK_STATUS.DONE),
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await taskApi.updateStatus(taskId, newStatus);
      toast.success('Task status updated successfully');
      fetchProjectAndTasks(); // Refresh tasks
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update task status';
      toast.error(errorMessage);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();

    if (!newTask.title || !newTask.dueDate) {
      toast.error('Title and Due Date are required');
      return;
    }

    try {
      await taskApi.create({
        ...newTask,
        projectId: projectId,
      });
      toast.success('Task created successfully');
      setShowTaskModal(false);
      setNewTask({
        title: '',
        description: '',
        dueDate: '',
        assignedTo: '',
      });
      fetchProjectAndTasks(); // Refresh tasks
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create task';
      toast.error(errorMessage);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
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
              Welcome, {userName}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Kanban Board */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Add Task Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowTaskModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors shadow-md"
          >
            <Plus className="h-5 w-5" />
            <span>Add New Task</span>
          </button>
        </div>

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
          newTask={newTask}
          setNewTask={setNewTask}
          onClose={() => setShowTaskModal(false)}
          onSubmit={handleCreateTask}
        />
      )}
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, onStatusUpdate, formatDate }) => {
  const getStatusOptions = (currentStatus) => {
    const allStatuses = Object.values(TASK_STATUS);
    return allStatuses.filter((status) => status !== currentStatus);
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
            <span>{task.assignedTo}</span>
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
const TaskModal = ({ newTask, setNewTask, onClose, onSubmit }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              placeholder="Enter task description"
            />
          </div>

          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
              Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="dueDate"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
              Assigned To (User ID)
            </label>
            <input
              type="text"
              id="assignedTo"
              value={newTask.assignedTo}
              onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              placeholder="Enter user ID (optional)"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectDetailPage;

