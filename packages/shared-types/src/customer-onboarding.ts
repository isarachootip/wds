import { MoneyString, EntityStatus } from './common.js';

export type SalesOrgType = 'HEADQUARTERS' | 'BRANCH_STORE';

export interface SalesExecutive {
  aeCode: string; // e.g. "AE-HQ-001", "AE-BKK-001"
  employeeId: string; // e.g. "EMP-9001"
  fullNameTh: string;
  fullNameEn: string;
  organizationType: SalesOrgType;
  assignedBranchCode?: string; // e.g. "00001" for Bangna, undefined for HQ
  assignedBranchNameTh?: string;
  supervisorAeCode?: string;
  supervisorNameTh?: string;
  maxDiscountPct: number; // 3.00 for AE, 5.00 for Supervisor, 8.00 for Mgr, 15.00 for VP
  roleTitleTh: string; // e.g. "เจ้าหน้าที่บริหารงานขายโครงการ (ส่วนกลาง)", "หัวหน้าทีมขายสาขาบางนา"
  phone: string;
  email: string;
  isActive: boolean;
}

export interface CustomerDeliverySite {
  siteId: string;
  customerCode: string;
  siteName: string; // e.g. "โครงการ Ideo Bangna Km.4"
  latitude: number; // e.g. 13.668212
  longitude: number; // e.g. 100.634123
  subdistrict: string; // แขวง/ตำบล
  district: string; // เขต/อำเภอ
  province: string; // จังหวัด
  postalCode: string; // รหัสไปรษณีย์
  zoneCode: string; // e.g. "BKK_EAST", "BKK_NORTH", "UPCOUNTRY_CENTRAL"
  contactPerson: string;
  contactPhone: string;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
}

export type CreditApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CreditFacilityApplication {
  applicationId: string;
  customerCode: string;
  customerNameTh: string;
  requestedCreditLimit: MoneyString;
  approvedCreditLimit?: MoneyString;
  creditTermDays: number; // 30, 45, 60, 90
  makerUserId: string; // e.g. "USR-CREDIT-MAKER-01"
  makerNameTh: string;
  makerSubmittedAt: string;
  checkerUserId?: string; // e.g. "USR-CREDIT-MGR-01"
  checkerNameTh?: string;
  checkerReviewedAt?: string;
  status: CreditApplicationStatus;
  collateralType?: 'BANK_GUARANTEE' | 'TITLE_DEED' | 'DIRECTOR_PLEDGE' | 'CLEAN_CREDIT';
  collateralValue?: MoneyString;
  rejectionReason?: string;
  notes?: string;
}

export interface CustomerOnboardingDto {
  customerCode: string;
  customerNameTh: string;
  taxId: string;
  branchNumber: string; // "00000" for HQ or 5-digit branch
  registeredAddressTh: string;
  customerSegment: 'COMMERCIAL_CONTRACTOR' | 'GOVERNMENT_PROJECT' | 'DEVELOPER' | 'TRADE_SUBDEALER';
  
  // Delivery Site with Geo-Pinning
  deliverySite: {
    siteName: string;
    latitude: number;
    longitude: number;
    subdistrict: string;
    district: string;
    province: string;
    postalCode: string;
    contactPerson: string;
    contactPhone: string;
  };

  // Credit Facility Request
  creditApplication: {
    requestedCreditLimit: MoneyString;
    creditTermDays: number;
    collateralType?: 'BANK_GUARANTEE' | 'TITLE_DEED' | 'DIRECTOR_PLEDGE' | 'CLEAN_CREDIT';
    collateralValue?: MoneyString;
    notes?: string;
  };

  // Sales Executive Assignment
  assignedAeCode: string;
  salesOrgType: SalesOrgType;
}

export interface CustomerFullProfile {
  customerCode: string;
  customerNameTh: string;
  taxId: string;
  branchNumber: string;
  registeredAddressTh: string;
  customerSegment: string;
  salesOrgType: SalesOrgType;
  assignedAe: SalesExecutive;
  deliverySites: CustomerDeliverySite[];
  creditProfile: {
    creditTermDays: number;
    approvedCreditLimit: MoneyString;
    currentArBalance: MoneyString;
    pendingOrderExposure: MoneyString;
    unmaturedPdcAmount: MoneyString;
    availableCredit: MoneyString;
    isCreditBlocked: boolean;
    creditBlockReason?: string;
  };
  latestCreditApplication?: CreditFacilityApplication;
  status: EntityStatus;
  createdAt: string;
}

export interface CreditApprovalDto {
  applicationId: string;
  checkerUserId: string;
  checkerNameTh: string;
  action: 'APPROVE' | 'REJECT';
  approvedCreditLimit?: MoneyString;
  rejectionReason?: string;
}
