const swaggerJSDoc = require('swagger-jsdoc');

const port = process.env.PORT || 5000;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PartnerSync API',
      version: '1.0.0',
      description: 'REST API documentation for PartnerSync backend services.'
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Local server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            error: { type: 'string', example: 'Not authorized to access this route' }
          }
        },
        SuccessMessage: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' }
          }
        },
        AuthUser: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '67f18cc4b3b0b8f4d7b07f92' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            organization: { type: 'string', example: 'NGO Lanka' },
            role: { type: 'string', example: 'partner' }
          }
        },
        AuthSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/AuthUser' }
          }
        },
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '67f18cc4b3b0b8f4d7b07f95' },
            title: { type: 'string', example: 'Clean Water Initiative' },
            description: { type: 'string', example: 'Installing rural water systems.' },
            sdgGoal: { type: 'string', example: 'Clean Water' },
            organization: { type: 'string', example: 'NGO Lanka' },
            budget: { type: 'number', example: 2500000 },
            status: { type: 'string', example: 'In Progress' }
          }
        },
        ProjectInput: {
          type: 'object',
          required: ['title', 'description', 'sdgGoal', 'organization'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            sdgGoal: { type: 'string' },
            organization: { type: 'string' },
            budget: { type: 'number' },
            status: { type: 'string', example: 'Proposed' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' }
          }
        },
        Report: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '67f18cc4b3b0b8f4d7b07f97' },
            project: { type: 'string', example: '67f18cc4b3b0b8f4d7b07f95' },
            reportType: { type: 'string', example: 'financial' },
            amountLKR: { type: 'number', example: 100000 },
            amountUSD: { type: 'number', example: 333.33 },
            peopleImpacted: { type: 'integer', example: 150 },
            description: { type: 'string', example: 'Q1 report' }
          }
        },
        ReportInput: {
          type: 'object',
          required: ['project', 'reportType', 'description'],
          properties: {
            project: { type: 'string' },
            reportType: { type: 'string', enum: ['financial', 'people_helped', 'milestone', 'other'] },
            amountLKR: { type: 'number' },
            peopleImpacted: { type: 'integer' },
            description: { type: 'string' }
          }
        },
        SDG: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            targetNumber: { type: 'string', example: '17.1' },
            title: { type: 'string' },
            description: { type: 'string' },
            indicatorCode: { type: 'string' },
            benchmark: { type: 'string' },
            category: { type: 'string', example: 'Goal 17' },
            isOfficialUN: { type: 'boolean' }
          }
        },
        SDGInput: {
          type: 'object',
          required: ['targetNumber', 'title', 'description'],
          properties: {
            targetNumber: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            indicatorCode: { type: 'string' },
            benchmark: { type: 'string' }
          }
        },
        CollabPostInput: {
          type: 'object',
          required: ['title', 'content', 'type'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            type: { type: 'string', enum: ['Announcement', 'Call for Partnership'] }
          }
        },
        CollabCommentInput: {
          type: 'object',
          required: ['postId', 'text'],
          properties: {
            postId: { type: 'string' },
            text: { type: 'string' }
          }
        }
      }
    },
    paths: {
      '/': {
        get: {
          tags: ['Health'],
          summary: 'Health check',
          responses: {
            200: {
              description: 'API status message'
            }
          }
        }
      },
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password', 'organization'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string' },
                    password: { type: 'string' },
                    organization: { type: 'string' },
                    role: { type: 'string', example: 'partner' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'User registered',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthSuccess' }
                }
              }
            },
            400: {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthSuccess' }
                }
              }
            },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ErrorResponse' }
                }
              }
            }
          }
        }
      },
      '/api/auth/approve/{id}': {
        put: {
          tags: ['Auth'],
          summary: 'Approve user and assign requested role',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'User approved' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'User not found' }
          }
        }
      },
      '/api/auth/users': {
        get: {
          tags: ['Auth'],
          summary: 'Get all users (admin only)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Users fetched' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' }
          }
        }
      },
      '/api/auth/users/{id}': {
        delete: {
          tags: ['Auth'],
          summary: 'Delete a user (admin only)',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'User removed' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'User not found' }
          }
        }
      },
      '/api/projects': {
        get: {
          tags: ['Projects'],
          summary: 'Get all projects',
          responses: {
            200: {
              description: 'Projects fetched'
            }
          }
        },
        post: {
          tags: ['Projects'],
          summary: 'Create a project',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProjectInput' }
              }
            }
          },
          responses: {
            201: { description: 'Project created' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' }
          }
        }
      },
      '/api/projects/with-stats': {
        get: {
          tags: ['Projects'],
          summary: 'Get projects with computed statistics and pagination',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', example: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', example: 12 } },
            { in: 'query', name: 'sdgGoal', schema: { type: 'string' } },
            { in: 'query', name: 'status', schema: { type: 'string' } },
            { in: 'query', name: 'organization', schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Projects with stats fetched' }
          }
        }
      },
      '/api/projects/organizations': {
        get: {
          tags: ['Projects'],
          summary: 'Get unique organizations list',
          responses: {
            200: { description: 'Organizations fetched' }
          }
        }
      },
      '/api/projects/{id}/statistics': {
        get: {
          tags: ['Projects'],
          summary: 'Get statistics for a single project',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'Project statistics fetched' },
            400: { description: 'Invalid project id' },
            404: { description: 'Project statistics not found' }
          }
        }
      },
      '/api/projects/{id}': {
        get: {
          tags: ['Projects'],
          summary: 'Get project by ID',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'Project found' },
            404: { description: 'Project not found' }
          }
        },
        put: {
          tags: ['Projects'],
          summary: 'Update project',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'Project updated' },
            401: { description: 'Unauthorized' }
          }
        },
        delete: {
          tags: ['Projects'],
          summary: 'Delete project',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'Project deleted' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' }
          }
        }
      },
      '/api/reports': {
        get: {
          tags: ['Reports'],
          summary: 'Get all reports',
          parameters: [
            { in: 'query', name: 'project', schema: { type: 'string' } },
            { in: 'query', name: 'reportType', schema: { type: 'string' } }
          ],
          responses: {
            200: { description: 'Reports fetched' }
          }
        },
        post: {
          tags: ['Reports'],
          summary: 'Create a project report',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReportInput' }
              }
            }
          },
          responses: {
            201: { description: 'Report submitted' },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' }
          }
        }
      },
      '/api/reports/{id}': {
        get: {
          tags: ['Reports'],
          summary: 'Get report by ID',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'Report fetched' },
            404: { description: 'Report not found' }
          }
        },
        put: {
          tags: ['Reports'],
          summary: 'Update report by ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReportInput' }
              }
            }
          },
          responses: {
            200: { description: 'Report updated' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Report not found' }
          }
        },
        delete: {
          tags: ['Reports'],
          summary: 'Delete report by ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'Report deleted' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Report not found' }
          }
        }
      },
      '/api/reports/project/{id}': {
        get: {
          tags: ['Reports'],
          summary: 'Get reports by project',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'Project reports fetched' }
          }
        }
      },
      '/api/reports/stats/summary': {
        get: {
          tags: ['Reports'],
          summary: 'Get aggregate report stats',
          responses: {
            200: { description: 'Stats fetched' }
          }
        }
      },
      '/api/sdg/create': {
        post: {
          tags: ['SDG'],
          summary: 'Create SDG target',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SDGInput' }
              }
            }
          },
          responses: {
            201: { description: 'SDG created' },
            400: { description: 'Validation error' }
          }
        }
      },
      '/api/sdg/all': {
        get: {
          tags: ['SDG'],
          summary: 'Get all SDG targets',
          responses: {
            200: { description: 'SDGs fetched' }
          }
        }
      },
      '/api/sdg/{id}': {
        get: {
          tags: ['SDG'],
          summary: 'Get SDG target by ID',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'SDG target fetched' },
            404: { description: 'SDG target not found' }
          }
        }
      },
      '/api/sdg/update/{id}': {
        put: {
          tags: ['SDG'],
          summary: 'Update SDG target',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SDGInput' }
              }
            }
          },
          responses: {
            200: { description: 'SDG updated' },
            404: { description: 'SDG target not found' }
          }
        }
      },
      '/api/sdg/delete/{id}': {
        delete: {
          tags: ['SDG'],
          summary: 'Delete SDG target',
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'SDG deleted' },
            404: { description: 'SDG target not found' }
          }
        }
      },
      '/api/sdg/sync-un': {
        post: {
          tags: ['SDG'],
          summary: 'Sync SDG targets from UN API',
          responses: {
            200: { description: 'UN sync completed' }
          }
        }
      },
      '/api/collab/feed': {
        get: {
          tags: ['Collaboration'],
          summary: 'Get collaboration feed',
          responses: {
            200: { description: 'Feed fetched' }
          }
        }
      },
      '/api/collab/post': {
        post: {
          tags: ['Collaboration'],
          summary: 'Create collaboration post',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CollabPostInput' }
              }
            }
          },
          responses: {
            201: { description: 'Post created' },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' }
          }
        }
      },
      '/api/collab/comment': {
        post: {
          tags: ['Collaboration'],
          summary: 'Add comment to post',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CollabCommentInput' }
              }
            }
          },
          responses: {
            201: { description: 'Comment added' },
            401: { description: 'Unauthorized' },
            404: { description: 'Post not found' }
          }
        }
      },
      '/api/collab/comment/{commentId}': {
        put: {
          tags: ['Collaboration'],
          summary: 'Update a comment by comment ID',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'commentId',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['text'],
                  properties: {
                    text: { type: 'string', example: 'Updated comment text' }
                  }
                }
              }
            }
          },
          responses: {
            200: { description: 'Comment updated' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Comment not found' }
          }
        }
      },
      '/api/collab/notifications': {
        get: {
          tags: ['Collaboration'],
          summary: 'Get notifications for current user',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Notifications fetched' },
            401: { description: 'Unauthorized' }
          }
        }
      },
      '/api/collab/post/{id}': {
        put: {
          tags: ['Collaboration'],
          summary: 'Update collaboration post',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CollabPostInput' }
              }
            }
          },
          responses: {
            200: { description: 'Post updated' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Post not found' }
          }
        },
        delete: {
          tags: ['Collaboration'],
          summary: 'Delete collaboration post',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: 'path',
              name: 'id',
              required: true,
              schema: { type: 'string' }
            }
          ],
          responses: {
            200: { description: 'Post deleted' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' },
            404: { description: 'Post not found' }
          }
        }
      },
      '/api/collab/announcement': {
        post: {
          tags: ['Collaboration'],
          summary: 'Create a system-wide announcement',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    message: { type: 'string', example: 'System maintenance at 10 PM.' }
                  }
                }
              }
            }
          },
          responses: {
            201: { description: 'Announcement sent to all users' },
            400: { description: 'Validation error' },
            401: { description: 'Unauthorized' },
            403: { description: 'Forbidden' }
          }
        }
      }
    }
  },
  apis: []
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
