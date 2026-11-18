/** Domain records returned by the repositories (camelCase API shape). */
export type MemberStatus = 'active' | 'deferred' | 'retired';
export type RequestCategory = 'address-change' | 'value-transfer' | 'retirement-quote' | 'complaint';
export type RequestStatus = 'open' | 'in-progress' | 'closed';

export interface Employer { id: string; name: string; sector: string; city: string }

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  employerId: string;
  startDate: string;
  fullTimeSalary: number;
  partTimeFactor: number;
  status: MemberStatus;
}

export interface Contribution {
  memberId: string;
  year: number;
  fullTimeSalary: number;
  partTimeFactor: number;
  pensionableSalary: number;
  accrual: number;
  employerContribution: number;
  employeeContribution: number;
}

export interface ServiceRequest {
  id: string;
  memberId: string;
  category: RequestCategory;
  subject: string;
  description: string;
  status: RequestStatus;
  createdAt: string;
  closedAt: string | null;
}
