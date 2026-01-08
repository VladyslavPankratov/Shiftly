import prisma from './prisma';

/**
 * Tenant validation utilities for multi-tenant data isolation.
 * Ensures resources belong to the specified organization before operations.
 */

export interface TenantValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that an employee belongs to the specified organization.
 */
export async function validateEmployeeTenant(
  employeeId: string,
  organizationId: string
): Promise<TenantValidationResult> {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, organizationId },
    select: { id: true },
  });

  if (!employee) {
    return { valid: false, error: 'Працівник не належить до вашої організації' };
  }

  return { valid: true };
}

/**
 * Validates that a department belongs to the specified organization.
 */
export async function validateDepartmentTenant(
  departmentId: string,
  organizationId: string
): Promise<TenantValidationResult> {
  const department = await prisma.department.findFirst({
    where: { id: departmentId, organizationId },
    select: { id: true },
  });

  if (!department) {
    return { valid: false, error: 'Відділ не належить до вашої організації' };
  }

  return { valid: true };
}

/**
 * Validates multiple resources belong to the organization.
 * Returns first validation error encountered.
 */
export async function validateTenantResources(
  organizationId: string,
  resources: {
    employeeId?: string;
    departmentId?: string;
  }
): Promise<TenantValidationResult> {
  if (resources.employeeId) {
    const result = await validateEmployeeTenant(resources.employeeId, organizationId);
    if (!result.valid) return result;
  }

  if (resources.departmentId) {
    const result = await validateDepartmentTenant(resources.departmentId, organizationId);
    if (!result.valid) return result;
  }

  return { valid: true };
}
