import React, { useState } from 'react';

export default function App() {
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

  const now = new Date();

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

  const addTodo = () => {
    if (newTodo.trim() !== '') {
      let deadlineDateTime = null;
      if (newDeadline) {
        deadlineDateTime = newTime ? 
          new Date(`${newDeadline}T${newTime}`).toISOString() :
          new Date(`${newDeadline}T23:59`).toISOString();
      }

      const todo = {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        deadline: deadlineDateTime,
        createdAt: new Date().toISOString()
      };
      setTodos([todo, ...todos]);
      setNewTodo('');
      setNewDeadline('');
      setNewTime('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
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

  const saveEdit = () => {
    if (editText.trim() !== '') {
      let deadlineDateTime = null;
      if (editDeadline) {
        deadlineDateTime = editTime ? 
          new Date(`${editDeadline}T${editTime}`).toISOString() :
          new Date(`${editDeadline}T23:59`).toISOString();
      }

      setTodos(todos.map(todo =>
        todo.id === editingId ? { 
          ...todo, 
          text: editText.trim(),
          deadline: deadlineDateTime
        } : todo
      ));
    }
    setEditingId(null);
    setEditText('');
    setEditDeadline('');
    setEditTime('');
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

  return (
    <div className="min-h-screen bg-green-50 p-3 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header - Mobile Optimized */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
            Todo List
          </h1>
          <p className="text-sm sm:text-base text-gray-600">Keep track of your tasks</p>
        </div>

        {/* Add Todo Section - Mobile First */}
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border mb-4 sm:mb-6">
          <div className="space-y-3 sm:space-y-4">
            {/* Main input row */}
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
                className="w-full sm:w-auto px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
              >
                <span>+</span>
                Add Task
              </button>
            </div>
            
            {/* Date and time inputs - Mobile stacked */}
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

        {/* Stats and Controls - Mobile Responsive */}
        <div className="bg-white rounded-lg p-4 shadow-sm border mb-4 sm:mb-6">
          {/* Stats - Mobile friendly grid */}
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

          {/* Filter and Sort - Mobile stacked */}
          <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
            {/* Filter buttons - Mobile scrollable */}
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

        {/* Todo List - Mobile Optimized */}
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
                  key={todo.id}
                  className={`bg-white rounded-lg p-3 sm:p-4 shadow-sm border transition-all duration-200 hover:shadow-md ${
                    todo.completed ? 'opacity-70' : ''
                  } ${
                    deadlineStatus === 'overdue' ? 'border-l-4 border-red-500' :
                    deadlineStatus === 'today' ? 'border-l-4 border-orange-500' :
                    deadlineStatus === 'soon' ? 'border-l-4 border-yellow-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox - Larger for mobile */}
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={`w-6 h-6 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-colors duration-200 mt-0.5 flex-shrink-0 ${
                        todo.completed
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400 active:border-green-500'
                      }`}
                    >
                      {todo.completed && <span className="text-xs sm:text-xs">✓</span>}
                    </button>

                    <div className="flex-1 min-w-0">
                      {editingId === todo.id ? (
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
                            <p className={`text-base sm:text-base leading-relaxed flex-1 ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
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

                    {/* Priority Indicator */}
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

                      {/* Action Buttons - Larger for mobile */}
                      <div className="flex gap-1">
                        {editingId === todo.id ? (
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
                              onClick={() => startEdit(todo.id, todo.text, todo.deadline)}
                              className="p-2 sm:p-1.5 text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-md transition-colors duration-200"
                            >
                              <span className="text-base sm:text-sm">✏️</span>
                            </button>
                            <button
                              onClick={() => deleteTodo(todo.id)}
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

        {/* Footer - Mobile Optimized */}
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