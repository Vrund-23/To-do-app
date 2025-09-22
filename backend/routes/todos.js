const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Todo = require('../models/Todo');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/todos
// @desc    Get all todos for user
// @access  Private
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('completed').optional().isBoolean().withMessage('Completed must be a boolean'),
    query('search').optional().trim().isLength({ max: 100 }).withMessage('Search term too long'),
    query('sortBy').optional().isIn(['createdAt', 'deadline', 'priority', 'text']).withMessage('Invalid sort field'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // Build filter object
      const filter = { user: req.user.id };

      // Filter by completion status
      if (req.query.completed !== undefined) {
        filter.completed = req.query.completed === 'true';
      }

      // Filter by category
      if (req.query.category) {
        filter.category = req.query.category;
      }

      // Search functionality
      if (req.query.search) {
        filter.text = { $regex: req.query.search, $options: 'i' };
      }

      // Build sort object
      const sortBy = req.query.sortBy || 'createdAt';
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      const sort = { [sortBy]: sortOrder };

      // Execute query
      const todos = await Todo.find(filter)
        .sort(sort)
        .limit(limit)
        .skip(skip)
        .exec();

      // Get total count for pagination
      const total = await Todo.countDocuments(filter);

      // Calculate pagination info
      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      res.json({
        success: true,
        data: todos,
        pagination: {
          current: page,
          total: totalPages,
          hasNext: hasNextPage,
          hasPrev: hasPrevPage,
          totalTodos: total
        }
      });
    } catch (error) {
      console.error('Get todos error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching todos'
      });
    }
  }
);

// @route   GET /api/todos/:id
// @desc    Get single todo
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    res.json({
      success: true,
      data: todo
    });
  } catch (error) {
    console.error('Get todo error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/todos
// @desc    Create new todo
// @access  Private
router.post('/',
  [
    body('text')
      .trim()
      .notEmpty()
      .withMessage('Todo text is required')
      .isLength({ max: 500 })
      .withMessage('Todo text cannot exceed 500 characters'),
    body('deadline')
      .optional()
      .isISO8601()
      .withMessage('Deadline must be a valid date'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Category cannot exceed 50 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { text, deadline, priority, category } = req.body;

      const todoData = {
        text,
        user: req.user.id
      };

      if (deadline) todoData.deadline = new Date(deadline);
      if (priority) todoData.priority = priority;
      if (category) todoData.category = category;

      const todo = await Todo.create(todoData);

      res.status(201).json({
        success: true,
        message: 'Todo created successfully',
        data: todo
      });
    } catch (error) {
      console.error('Create todo error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while creating todo'
      });
    }
  }
);

// @route   PUT /api/todos/:id
// @desc    Update todo
// @access  Private
router.put('/:id',
  [
    body('text')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Todo text cannot be empty')
      .isLength({ max: 500 })
      .withMessage('Todo text cannot exceed 500 characters'),
    body('completed')
      .optional()
      .isBoolean()
      .withMessage('Completed must be a boolean'),
    body('deadline')
      .optional()
      .custom((value) => {
        if (value === null || value === '') return true;
        return new Date(value).toString() !== 'Invalid Date';
      })
      .withMessage('Deadline must be a valid date or null'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Priority must be low, medium, or high'),
    body('category')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Category cannot exceed 50 characters')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { text, completed, deadline, priority, category } = req.body;

      // Find todo
      let todo = await Todo.findOne({
        _id: req.params.id,
        user: req.user.id
      });

      if (!todo) {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }

      // Update fields
      if (text !== undefined) todo.text = text;
      if (completed !== undefined) todo.completed = completed;
      if (deadline !== undefined) {
        todo.deadline = deadline === null || deadline === '' ? null : new Date(deadline);
      }
      if (priority !== undefined) todo.priority = priority;
      if (category !== undefined) todo.category = category;

      await todo.save();

      res.json({
        success: true,
        message: 'Todo updated successfully',
        data: todo
      });
    } catch (error) {
      console.error('Update todo error:', error);
      if (error.name === 'CastError') {
        return res.status(404).json({
          success: false,
          message: 'Todo not found'
        });
      }
      res.status(500).json({
        success: false,
        message: 'Server error while updating todo'
      });
    }
  }
);

// @route   DELETE /api/todos/:id
// @desc    Delete todo
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!todo) {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }

    res.json({
      success: true,
      message: 'Todo deleted successfully'
    });
  } catch (error) {
    console.error('Delete todo error:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Todo not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error while deleting todo'
    });
  }
});

// @route   GET /api/todos/stats/summary
// @desc    Get todo statistics for user
// @access  Private
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Todo.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: { $sum: { $cond: ['$completed', 1, 0] } },
          pending: { $sum: { $cond: ['$completed', 0, 1] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$deadline', new Date()] },
                    { $eq: ['$completed', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      completed: 0,
      pending: 0,
      overdue: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

// @route   PATCH /api/todos/bulk
// @desc    Bulk update todos (complete all, delete completed, etc.)
// @access  Private
router.patch('/bulk',
  [
    body('action')
      .isIn(['complete-all', 'delete-completed', 'delete-all'])
      .withMessage('Invalid bulk action')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { action } = req.body;
      let result;

      switch (action) {
        case 'complete-all':
          result = await Todo.updateMany(
            { user: req.user.id, completed: false },
            { completed: true }
          );
          break;
        case 'delete-completed':
          result = await Todo.deleteMany({
            user: req.user.id,
            completed: true
          });
          break;
        case 'delete-all':
          result = await Todo.deleteMany({ user: req.user.id });
          break;
      }

      res.json({
        success: true,
        message: `Bulk ${action} completed successfully`,
        modifiedCount: result.modifiedCount || result.deletedCount || 0
      });
    } catch (error) {
      console.error('Bulk operation error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during bulk operation'
      });
    }
  }
);

module.exports = router;