import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Shiftly API',
      version: '1.0.0',
      description: `
Shiftly is a workforce scheduling and shift management API. It provides endpoints for managing employees, shifts, departments, and shift templates within multi-tenant organizations.

## Authentication

This API uses JWT (JSON Web Token) authentication. To access protected endpoints:

1. Register a new organization or login to get an access token
2. Include the token in the \`Authorization\` header as \`Bearer <token>\`
3. Access tokens expire after a configured period; use the refresh token endpoint to get a new one

## Multi-Tenancy

All data is scoped to the authenticated user's organization. Users can only access resources belonging to their organization.

## Rate Limiting

API calls may be subject to rate limiting in production environments.
      `,
      contact: {
        name: 'Shiftly Support',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.shiftly.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        // Auth schemas
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name', 'organizationName'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@company.com',
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'securePassword123',
            },
            name: {
              type: 'string',
              example: 'John Admin',
            },
            organizationName: {
              type: 'string',
              example: 'Acme Corporation',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@company.com',
            },
            password: {
              type: 'string',
              example: 'securePassword123',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            user: {
              $ref: '#/components/schemas/User',
            },
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              example: 'a1b2c3d4e5f6...',
            },
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              example: 'a1b2c3d4e5f6...',
            },
          },
        },
        TokenResponse: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              example: 'a1b2c3d4e5f6...',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@company.com',
            },
            name: {
              type: 'string',
              example: 'John Admin',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MANAGER', 'EMPLOYEE'],
              example: 'ADMIN',
            },
            organizationId: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174001',
            },
          },
        },
        // Employee schemas
        Employee: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              example: 'Jane Smith',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'jane.smith@company.com',
            },
            phone: {
              type: 'string',
              nullable: true,
              example: '+1234567890',
            },
            position: {
              type: 'string',
              example: 'Cashier',
            },
            color: {
              type: 'string',
              example: '#3B82F6',
            },
            weeklyHoursLimit: {
              type: 'integer',
              nullable: true,
              example: 40,
            },
            organizationId: {
              type: 'string',
              format: 'uuid',
            },
            departmentId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            department: {
              $ref: '#/components/schemas/Department',
            },
            availability: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/EmployeeAvailability',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateEmployeeRequest: {
          type: 'object',
          required: ['name', 'email', 'position'],
          properties: {
            name: {
              type: 'string',
              example: 'Jane Smith',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'jane.smith@company.com',
            },
            phone: {
              type: 'string',
              example: '+1234567890',
            },
            position: {
              type: 'string',
              example: 'Cashier',
            },
            departmentId: {
              type: 'string',
              format: 'uuid',
              description: 'UUID of the department',
            },
            color: {
              type: 'string',
              example: '#3B82F6',
              default: '#3B82F6',
            },
            weeklyHoursLimit: {
              type: 'integer',
              example: 40,
            },
            availability: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AvailabilityInput',
              },
            },
          },
        },
        UpdateEmployeeRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'Jane Smith',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'jane.smith@company.com',
            },
            phone: {
              type: 'string',
              example: '+1234567890',
            },
            position: {
              type: 'string',
              example: 'Cashier',
            },
            departmentId: {
              type: 'string',
              format: 'uuid',
            },
            color: {
              type: 'string',
              example: '#3B82F6',
            },
            weeklyHoursLimit: {
              type: 'integer',
              example: 40,
            },
            availability: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/AvailabilityInput',
              },
            },
          },
        },
        EmployeeAvailability: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            employeeId: {
              type: 'string',
              format: 'uuid',
            },
            dayOfWeek: {
              type: 'integer',
              minimum: 0,
              maximum: 6,
              description: '0 = Sunday, 6 = Saturday',
              example: 1,
            },
            startTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '09:00',
            },
            endTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '17:00',
            },
          },
        },
        AvailabilityInput: {
          type: 'object',
          required: ['dayOfWeek', 'startTime', 'endTime'],
          properties: {
            dayOfWeek: {
              type: 'integer',
              minimum: 0,
              maximum: 6,
              description: '0 = Sunday, 6 = Saturday',
              example: 1,
            },
            startTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '09:00',
            },
            endTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '17:00',
            },
          },
        },
        // Department schemas
        Department: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              example: 'Sales',
            },
            color: {
              type: 'string',
              example: '#6B7280',
            },
            organizationId: {
              type: 'string',
              format: 'uuid',
            },
            _count: {
              type: 'object',
              properties: {
                employees: {
                  type: 'integer',
                  example: 5,
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateDepartmentRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              example: 'Sales',
            },
            color: {
              type: 'string',
              example: '#6B7280',
              default: '#6B7280',
            },
          },
        },
        UpdateDepartmentRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'Sales',
            },
            color: {
              type: 'string',
              example: '#6B7280',
            },
          },
        },
        // Shift schemas
        Shift: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            employeeId: {
              type: 'string',
              format: 'uuid',
            },
            startTime: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T09:00:00.000Z',
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T17:00:00.000Z',
            },
            position: {
              type: 'string',
              example: 'Cashier',
            },
            notes: {
              type: 'string',
              nullable: true,
              example: 'Opening shift',
            },
            status: {
              type: 'string',
              enum: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
              example: 'SCHEDULED',
            },
            organizationId: {
              type: 'string',
              format: 'uuid',
            },
            departmentId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            employee: {
              $ref: '#/components/schemas/Employee',
            },
            department: {
              $ref: '#/components/schemas/Department',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        CreateShiftRequest: {
          type: 'object',
          required: ['employeeId', 'startTime', 'endTime', 'position'],
          properties: {
            employeeId: {
              type: 'string',
              format: 'uuid',
              description: 'UUID of the employee to assign',
            },
            startTime: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T09:00:00.000Z',
            },
            endTime: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T17:00:00.000Z',
            },
            position: {
              type: 'string',
              example: 'Cashier',
            },
            departmentId: {
              type: 'string',
              format: 'uuid',
            },
            notes: {
              type: 'string',
              example: 'Opening shift',
            },
            status: {
              type: 'string',
              enum: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
              default: 'SCHEDULED',
            },
            overrideConflicts: {
              type: 'boolean',
              default: false,
              description: 'Set to true to override warning-level conflicts',
            },
          },
        },
        UpdateShiftRequest: {
          type: 'object',
          properties: {
            employeeId: {
              type: 'string',
              format: 'uuid',
            },
            startTime: {
              type: 'string',
              format: 'date-time',
            },
            endTime: {
              type: 'string',
              format: 'date-time',
            },
            position: {
              type: 'string',
            },
            departmentId: {
              type: 'string',
              format: 'uuid',
            },
            notes: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'],
            },
            overrideConflicts: {
              type: 'boolean',
              description: 'Set to true to override warning-level conflicts',
            },
          },
        },
        ConflictCheckRequest: {
          type: 'object',
          required: ['employeeId', 'startTime', 'endTime'],
          properties: {
            employeeId: {
              type: 'string',
              format: 'uuid',
            },
            startTime: {
              type: 'string',
              format: 'date-time',
            },
            endTime: {
              type: 'string',
              format: 'date-time',
            },
            shiftId: {
              type: 'string',
              format: 'uuid',
              description: 'Exclude this shift from conflict check (for updates)',
            },
          },
        },
        ConflictResponse: {
          type: 'object',
          properties: {
            hasConflicts: {
              type: 'boolean',
            },
            conflicts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    example: 'OVERLAPPING_SHIFT',
                  },
                  severity: {
                    type: 'string',
                    enum: ['ERROR', 'WARNING'],
                  },
                  message: {
                    type: 'string',
                  },
                },
              },
            },
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  startTime: {
                    type: 'string',
                    format: 'date-time',
                  },
                  endTime: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
              },
            },
          },
        },
        AutoScheduleRequest: {
          type: 'object',
          required: ['startDate', 'endDate', 'templateIds'],
          properties: {
            startDate: {
              type: 'string',
              format: 'date',
              example: '2024-01-15',
            },
            endDate: {
              type: 'string',
              format: 'date',
              example: '2024-01-21',
            },
            templateIds: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uuid',
              },
              description: 'Array of template IDs to use for scheduling',
            },
          },
        },
        AutoScheduleResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Created 10 shifts',
            },
            shifts: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Shift',
              },
            },
          },
        },
        // Template schemas
        ShiftTemplate: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            name: {
              type: 'string',
              example: 'Morning Shift',
            },
            dayOfWeek: {
              type: 'integer',
              minimum: 0,
              maximum: 6,
              description: '0 = Sunday, 6 = Saturday',
              example: 1,
            },
            startTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '09:00',
            },
            endTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '17:00',
            },
            position: {
              type: 'string',
              example: 'Cashier',
            },
            requiredEmployees: {
              type: 'integer',
              example: 2,
            },
            organizationId: {
              type: 'string',
              format: 'uuid',
            },
            departmentId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            department: {
              $ref: '#/components/schemas/Department',
            },
          },
        },
        CreateTemplateRequest: {
          type: 'object',
          required: ['name', 'dayOfWeek', 'startTime', 'endTime', 'position'],
          properties: {
            name: {
              type: 'string',
              example: 'Morning Shift',
            },
            dayOfWeek: {
              type: 'integer',
              minimum: 0,
              maximum: 6,
              description: '0 = Sunday, 6 = Saturday',
              example: 1,
            },
            startTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '09:00',
            },
            endTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
              example: '17:00',
            },
            position: {
              type: 'string',
              example: 'Cashier',
            },
            departmentId: {
              type: 'string',
              format: 'uuid',
            },
            requiredEmployees: {
              type: 'integer',
              default: 1,
              example: 2,
            },
          },
        },
        UpdateTemplateRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'Morning Shift',
            },
            dayOfWeek: {
              type: 'integer',
              minimum: 0,
              maximum: 6,
            },
            startTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
            },
            endTime: {
              type: 'string',
              pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$',
            },
            position: {
              type: 'string',
            },
            departmentId: {
              type: 'string',
              format: 'uuid',
            },
            requiredEmployees: {
              type: 'integer',
            },
          },
        },
        ApplyTemplatesRequest: {
          type: 'object',
          required: ['templateIds', 'startDate', 'endDate'],
          properties: {
            templateIds: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uuid',
              },
            },
            startDate: {
              type: 'string',
              format: 'date',
              example: '2024-01-15',
            },
            endDate: {
              type: 'string',
              format: 'date',
              example: '2024-01-21',
            },
            preview: {
              type: 'boolean',
              default: true,
            },
          },
        },
        ApplyTemplatesResponse: {
          type: 'object',
          properties: {
            preview: {
              type: 'boolean',
            },
            count: {
              type: 'integer',
            },
            shifts: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  templateId: {
                    type: 'string',
                    format: 'uuid',
                  },
                  templateName: {
                    type: 'string',
                  },
                  startTime: {
                    type: 'string',
                    format: 'date-time',
                  },
                  endTime: {
                    type: 'string',
                    format: 'date-time',
                  },
                  position: {
                    type: 'string',
                  },
                  departmentId: {
                    type: 'string',
                    format: 'uuid',
                    nullable: true,
                  },
                  departmentName: {
                    type: 'string',
                    nullable: true,
                  },
                  dayOfWeek: {
                    type: 'integer',
                  },
                },
              },
            },
            message: {
              type: 'string',
            },
          },
        },
        // Common schemas
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'An error occurred',
            },
          },
        },
        SuccessMessage: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Operation successful',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'System',
        description: 'System health and status endpoints',
      },
      {
        name: 'Authentication',
        description: 'User authentication and token management',
      },
      {
        name: 'Employees',
        description: 'Employee management operations',
      },
      {
        name: 'Departments',
        description: 'Department management operations',
      },
      {
        name: 'Shifts',
        description: 'Shift scheduling and management',
      },
      {
        name: 'Templates',
        description: 'Shift template management for recurring schedules',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
