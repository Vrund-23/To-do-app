import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/index.js';

export default function TodoApp() {
  const { user, logout } = useAuth();
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newTime, setNewTime] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editTime, setEditTime] = useState('');
  const [sortBy, setSortBy] = useState('created');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const now = new Date();

  // Fetch todos from backend
  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const response = await api.get('/todos');
      setTodos(response.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching todos:', err);
      setError('Failed to load todos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (deadline) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    return deadlineDate < now;
  };

  const getDeadlineStatus = (deadline, completed) => {
    if (!deadline || completed) return 'none';
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffHours = diffTime / (1000 * 60 * 60);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffTime < 0) return 'overdue';
    if (diffHours <= 24 && diffDays <= 1) return 'today';
    if (diffDays <= 3) return 'soon';
    return 'normal';
  };

  const addTodo = async () => {
    if (newTodo.trim() !== '') {
      try {
        const todoData = { text: newTodo.trim() };
        
        if (newDeadline) {
          const deadlineDateTime = newTime ? 
            new Date(`${newDeadline}T${newTime}`).toISOString() :
            new Date(`${newDeadline}T23:59`).toISOString();
          todoData.deadline = deadlineDateTime;
        }

        const response = await api.post('/todos', todoData);
        setTodos([response.data.data, ...todos]);
        setNewTodo('');
        setNewDeadline('');
        setNewTime('');
        setError('');
      } catch (err) {
        console.error('Error adding todo:', err);
        setError('Failed to add todo. Please try again.');
      }
    }
  };

  const toggleTodo = async (id) => {
    try {
      const todo = todos.find(t => t._id === id);
      const response = await api.put(`/todos/${id}`, {
        completed: !todo.completed
      });
      
      setTodos(todos.map(todo =>
        todo._id === id ? response.data.data : todo
      ));
      setError('');
    } catch (err) {
      console.error('Error updating todo:', err);
      setError('Failed to update todo. Please try again.');
    }
  };

  const deleteTodo = async (id) => {
    try {
      await api.delete(`/todos/${id}`);
      setTodos(todos.filter(todo => todo._id !== id));
      setError('');
    } catch (err) {
      console.error('Error deleting todo:', err);
      setError('Failed to delete todo. Please try again.');
    }
  };

  const startEdit = (id, text, deadline) => {
    setEditingId(id);
    setEditText(text);
    if (deadline) {
      const date = new Date(deadline);
      setEditDeadline(date.toISOString().split('T')[0]);
      setEditTime(date.toTimeString().slice(0, 5));
    } else {
      setEditDeadline('');
      setEditTime('');
    }
  };

  const saveEdit = async () => {
    if (editText.trim() !== '') {
      try {
        const updateData = { text: editText.trim() };
        
        if (editDeadline) {
          const deadlineDateTime = editTime ? 
            new Date(`${editDeadline}T${editTime}`).toISOString() :
            new Date(`${editDeadline}T23:59`).toISOString();
          updateData.deadline = deadlineDateTime;
        } else {
          updateData.deadline = null;
        }

        const response = await api.put(`/todos/${editingId}`, updateData);
        
        setTodos(todos.map(todo =>
          todo._id === editingId ? response.data.data : todo
        ));
        
        setEditingId(null);
        setEditText('');
        setEditDeadline('');
        setEditTime('');
        setError('');
      } catch (err) {
        console.error('Error updating todo:', err);
        setError('Failed to update todo. Please try again.');
      }
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditDeadline('');
    setEditTime('');
  };

  const sortedTodos = [...todos].sort((a, b) => {
    if (sortBy === 'deadline') {
      if (!a.deadline && !b.deadline) return new Date(b.createdAt) - new Date(a.createdAt);
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    }
    if (sortBy === 'priority') {
      const aStatus = getDeadlineStatus(a.deadline, a.completed);
      const bStatus = getDeadlineStatus(b.deadline, b.completed);
      const priority = { overdue: 0, today: 1, soon: 2, normal: 3, none: 4 };
      return priority[aStatus] - priority[bStatus];
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const filteredTodos = sortedTodos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    if (filter === 'overdue') return isOverdue(todo.deadline) && !todo.completed;
    return true;
  });

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return '';
    const date = new Date(deadline);
    const diffTime = date - now;
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (diffTime < 0) {
      if (diffHours >= -24) return `${timeStr} (${Math.abs(diffHours)}h ago)`;
      return `${date.toLocaleDateString()} ${timeStr}`;
    }
    
    if (diffHours <= 24) {
      if (diffHours === 0) return `${timeStr} (now)`;
      return `${timeStr} (${diffHours}h left)`;
    }
    
    return `${date.toLocaleDateString()} ${timeStr}`;
  };

  const completedCount = todos.filter(todo => todo.completed).length;
  const activeCount = todos.filter(todo => !todo.completed).length;
  const overdueCount = todos.filter(todo => isOverdue(todo.deadline) && !todo.completed).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your todos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with user info and logout */}
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div className="text-center flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
              Todo List
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Welcome back, {user?.name}!
            </p>
          </div>
          <button
            onClick={logout}
            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
          >
            Logout
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md mb-4 text-sm">
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-2 text-red-800 hover:text-red-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* Add Todo Section */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border mb-4 sm:mb-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addTodo)}
                placeholder="Add a new todo..."
                className="flex-1 px-3 sm:px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
              <button
                onClick={addTodo}
                disabled={!newTodo.trim()}
                className="w-full sm:w-auto px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 flex items-center justify-center gap-2 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <span>+</span>
                Add Task
              </button>
            </div>
            
            {/* Date and time inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">📅</span>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">🕐</span>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                />
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 text-center">Optional deadline and time</p>
          </div>
        </div>

        {/* Stats and Controls */}
        <div className="bg-white rounded-lg p-4 shadow-sm border mb-4 sm:mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
              <span className="truncate">Total: {todos.length}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="truncate">Active: {activeCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="truncate">Done: {completedCount}</span>
            </div>
            {overdueCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="truncate">Overdue: {overdueCount}</span>
              </div>
            )}
          </div>

          <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
            {/* Filter buttons */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['all', 'active', 'completed', 'overdue'].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                    filter === filterType
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                  }`}
                >
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                </button>
              ))}
            </div>

            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 whitespace-nowrap">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="created">Created</option>
                <option value="deadline">Deadline</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        </div>

        {/* Todo List */}
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <div className="bg-white rounded-lg p-6 sm:p-8 shadow-sm border text-center">
              <div className="text-gray-400 mb-3">
                <span className="text-3xl sm:text-4xl">📋</span>
              </div>
              <p className="text-gray-500 text-base sm:text-lg mb-2">
                {filter === 'all' ? 'No todos yet!' : 
                 filter === 'active' ? 'No active todos!' : 
                 filter === 'completed' ? 'No completed todos!' :
                 'No overdue todos!'}
              </p>
              <p className="text-gray-400 text-sm">
                {filter === 'all' ? 'Add your first todo above' : 'Switch to "all" to see other todos'}
              </p>
            </div>
          ) : (
            filteredTodos.map((todo) => {
              const deadlineStatus = getDeadlineStatus(todo.deadline, todo.completed);
              
              return (
                <div
                  key={todo._id}
                  className={`bg-white rounded-lg p-3 sm:p-4 shadow-sm border transition-all duration-200 hover:shadow-md ${
                    todo.completed ? 'opacity-70' : ''
                  } ${
                    deadlineStatus === 'overdue' ? 'border-l-4 border-red-500' :
                    deadlineStatus === 'today' ? 'border-l-4 border-orange-500' :
                    deadlineStatus === 'soon' ? 'border-l-4 border-yellow-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTodo(todo._id)}
                      className={`w-6 h-6 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 mt-0.5 flex-shrink-0 ${
                        todo.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400 active:border-green-500'
                      }`}
                    >
                      {todo.completed && <span className="text-xs">✓</span>}
                    </button>

                    <div className="flex-1 min-w-0">
                      {editingId === todo._id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyPress={(e) => handleKeyPress(e, saveEdit)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                            autoFocus
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-sm">📅</span>
                              <input
                                type="date"
                                value={editDeadline}
                                onChange={(e) => setEditDeadline(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 text-sm">🕐</span>
                              <input
                                type="time"
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <p className={`text-base leading-relaxed flex-1 ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                              {todo.text}
                            </p>
                            {deadlineStatus === 'overdue' && !todo.completed && (
                              <span className="text-red-500 text-sm flex-shrink-0">⚠️</span>
                            )}
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs">
                            <span className="text-gray-400">
                              Created: {new Date(todo.createdAt).toLocaleDateString()}
                            </span>
                            
                            {todo.deadline && (
                              <div className="flex items-center gap-1">
                                <span className={`text-sm ${
                                  deadlineStatus === 'overdue' ? 'text-red-500' :
                                  deadlineStatus === 'today' ? 'text-orange-500' :
                                  deadlineStatus === 'soon' ? 'text-yellow-600' :
                                  'text-gray-500'
                                }`}>🕐</span>
                                <span className={`${
                                  deadlineStatus === 'overdue' ? 'text-red-500 font-medium' :
                                  deadlineStatus === 'today' ? 'text-orange-500 font-medium' :
                                  deadlineStatus === 'soon' ? 'text-yellow-600 font-medium' :
                                  'text-gray-500'
                                }`}>
                                  Due: {formatDeadline(todo.deadline)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Priority Indicator and Action Buttons */}
                    <div className="flex items-center gap-2">
                      {deadlineStatus === 'overdue' && !todo.completed && (
                        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                      )}
                      {deadlineStatus === 'today' && !todo.completed && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                      )}
                      {deadlineStatus === 'soon' && !todo.completed && (
                        <div className="w-2 h-2 bg-yellow-500 rounded-full flex-shrink-0"></div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-1">
                        {editingId === todo._id ? (
                          <>
                            <button
                              onClick={saveEdit}
                              className="p-2 sm:p-1.5 text-green-600 hover:bg-green-50 active:bg-green-100 rounded-md transition-colors duration-200"
                            >
                              <span className="text-base sm:text-sm">✓</span>
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-2 sm:p-1.5 text-gray-600 hover:bg-gray-50 active:bg-gray-100 rounded-md transition-colors duration-200"
                            >
                              <span className="text-base sm:text-sm">✕</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEdit(todo._id, todo.text, todo.deadline)}
                              className="p-2 sm:p-1.5 text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-md transition-colors duration-200"
                            >
                              <span className="text-base sm:text-sm">✏️</span>
                            </button>
                            <button
                              onClick={() => deleteTodo(todo._id)}
                              className="p-2 sm:p-1.5 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-md transition-colors duration-200"
                            >
                              <span className="text-base sm:text-sm">🗑️</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {todos.length > 0 && (
          <div className="text-center mt-6 sm:mt-8 pb-6">
            <p className="text-gray-600 text-sm px-4">
              {overdueCount > 0 ? (
                <span className="text-red-600 font-medium">
                  ⚠️ {overdueCount} overdue {overdueCount === 1 ? 'task' : 'tasks'}! 
                </span>
              ) : (
                <span>
                  {activeCount} {activeCount === 1 ? 'task' : 'tasks'} remaining
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}