import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import Decimal from 'decimal.js';
import {
  CustomerOnboardingDto,
  CustomerFullProfile,
  CustomerDeliverySite,
  SalesExecutive,
  CreditFacilityApplication,
  CreditApprovalDto,
  SalesOrgType,
  EntityStatus,
} from '@wds/shared-types';

@Injectable()
export class CustomerService {
  // Master Sales Executives
  private salesExecutives: Map<string, SalesExecutive> = new Map([
    [
      'AE-HQ-VP-01',
      {
        aeCode: 'AE-HQ-VP-01',
        employeeId: 'EMP-8001',
        fullNameTh: 'นายวิชัย สุวรรณภูมิ (VP Commercial)',
        fullNameEn: 'Wichai Suwarnabhumi',
        organizationType: 'HEADQUARTERS',
        maxDiscountPct: 15.0,
        roleTitleTh: 'รองกรรมการผู้จัดการฝ่ายขายโครงการพาณิชย์ (ส่วนกลาง)',
        phone: '02-101-0001',
        email: 'wichai.su@thaiwatsadu.com',
        isActive: true,
      },
    ],
    [
      'AE-HQ-MGR-01',
      {
        aeCode: 'AE-HQ-MGR-01',
        employeeId: 'EMP-8002',
        fullNameTh: 'นางสาวณิชาภา รัตนไพศาล (Key Account Mgr)',
        fullNameEn: 'Nichapa Rattanapaisan',
        organizationType: 'HEADQUARTERS',
        supervisorAeCode: 'AE-HQ-VP-01',
        supervisorNameTh: 'นายวิชัย สุวรรณภูมิ',
        maxDiscountPct: 8.0,
        roleTitleTh: 'ผู้จัดการฝ่ายขายลูกค้ารายใหญ่ส่วนกลาง',
        phone: '02-101-0002',
        email: 'nichapa.ra@thaiwatsadu.com',
        isActive: true,
      },
    ],
    [
      'AE-HQ-001',
      {
        aeCode: 'AE-HQ-001',
        employeeId: 'EMP-9001',
        fullNameTh: 'นายกิตติศักดิ์ พัฒนกิจ (Senior Key Account AE)',
        fullNameEn: 'Kittisak Pattanakit',
        organizationType: 'HEADQUARTERS',
        supervisorAeCode: 'AE-HQ-MGR-01',
        supervisorNameTh: 'นางสาวณิชาภา รัตนไพศาล',
        maxDiscountPct: 3.0,
        roleTitleTh: 'เจ้าหน้าที่บริหารงานขายโครงการส่วนกลาง',
        phone: '081-444-1111',
        email: 'kittisak.pa@thaiwatsadu.com',
        isActive: true,
      },
    ],
    [
      'AE-BKK-001',
      {
        aeCode: 'AE-BKK-001',
        employeeId: 'EMP-9011',
        fullNameTh: 'นายสมเกียรติ มั่นคง (Branch AE - บางนา)',
        fullNameEn: 'Somkiat Mankhong',
        organizationType: 'BRANCH_STORE',
        assignedBranchCode: '00001',
        assignedBranchNameTh: 'สาขาบางนา (00001)',
        maxDiscountPct: 3.0,
        roleTitleTh: 'เจ้าหน้าที่ฝ่ายขายตรงประจำสาขาบางนา',
        phone: '089-222-3331',
        email: 'somkiat.ma@thaiwatsadu.com',
        isActive: true,
      },
    ],
    [
      'AE-BKK-002',
      {
        aeCode: 'AE-BKK-002',
        employeeId: 'EMP-9012',
        fullNameTh: 'นางสาววรัญญา เลิศชัย (Branch AE - รังสิต)',
        fullNameEn: 'Waranya Lertchai',
        organizationType: 'BRANCH_STORE',
        assignedBranchCode: '00002',
        assignedBranchNameTh: 'สาขารังสิต (00002)',
        maxDiscountPct: 3.0,
        roleTitleTh: 'เจ้าหน้าที่ฝ่ายขายตรงประจำสาขารังสิต',
        phone: '089-222-3332',
        email: 'waranya.le@thaiwatsadu.com',
        isActive: true,
      },
    ],
    [
      'AE-UPC-001',
      {
        aeCode: 'AE-UPC-001',
        employeeId: 'EMP-9021',
        fullNameTh: 'นายธนพล เจริญทรัพย์ (Branch AE - ขอนแก่น)',
        fullNameEn: 'Thanapol Charoensub',
        organizationType: 'BRANCH_STORE',
        assignedBranchCode: '00012',
        assignedBranchNameTh: 'สาขาขอนแก่น (00012)',
        maxDiscountPct: 3.0,
        roleTitleTh: 'เจ้าหน้าที่ฝ่ายขายตรงประจำสาขาขอนแก่น',
        phone: '087-555-6661',
        email: 'thanapol.ch@thaiwatsadu.com',
        isActive: true,
      },
    ],
  ]);

  // Customer In-Memory Store
  private customers: Map<string, CustomerFullProfile> = new Map([
    [
      'CUST-B2B-001',
      {
        customerCode: 'CUST-B2B-001',
        customerNameTh: 'บริษัท อิตาเลียน-ไทย คอนสตรัคชั่น จำกัด (มหาชน)',
        taxId: '0107537000882',
        branchNumber: '00000',
        registeredAddressTh: 'เลขที่ 2034/132-161 อาคารอิตัลไทย ทาวเวอร์ ถนนเพชรบุรีตัดใหม่ แขวงบางกะปิ เขตห้วยขวาง กรุงเทพฯ 10310',
        customerSegment: 'COMMERCIAL_CONTRACTOR',
        salesOrgType: 'HEADQUARTERS',
        assignedAe: {
          aeCode: 'AE-HQ-001',
          employeeId: 'EMP-9001',
          fullNameTh: 'นายกิตติศักดิ์ พัฒนกิจ (Senior Key Account AE)',
          fullNameEn: 'Kittisak Pattanakit',
          organizationType: 'HEADQUARTERS',
          supervisorAeCode: 'AE-HQ-MGR-01',
          supervisorNameTh: 'นางสาวณิชาภา รัตนไพศาล',
          maxDiscountPct: 3.0,
          roleTitleTh: 'เจ้าหน้าที่บริหารงานขายโครงการส่วนกลาง',
          phone: '081-444-1111',
          email: 'kittisak.pa@thaiwatsadu.com',
          isActive: true,
        },
        deliverySites: [
          {
            siteId: 'SITE-001',
            customerCode: 'CUST-B2B-001',
            siteName: 'โครงการรถไฟฟ้าสายสีส้ม สัญญาที่ 3 (สถานีคลองบ้านม้า)',
            latitude: 13.766124,
            longitude: 100.672314,
            subdistrict: 'สะพานสูง',
            district: 'สะพานสูง',
            province: 'กรุงเทพมหานคร',
            postalCode: '10240',
            zoneCode: 'BKK_EAST',
            contactPerson: 'วิศวกรสมศักดิ์ นำชัย',
            contactPhone: '081-999-8881',
            isPrimary: true,
            createdAt: '2026-09-01T08:00:00Z',
          },
        ],
        creditProfile: {
          creditTermDays: 45,
          approvedCreditLimit: '5000000.0000',
          currentArBalance: '1200000.0000',
          pendingOrderExposure: '350000.0000',
          unmaturedPdcAmount: '500000.0000',
          availableCredit: '3450000.0000',
          isCreditBlocked: false,
        },
        status: EntityStatus.ACTIVE,
        createdAt: '2026-09-01T08:00:00Z',
      },
    ],
  ]);

  // Credit Applications In-Memory Store
  private creditApplications: Map<string, CreditFacilityApplication> = new Map([
    [
      'APP-CREDIT-001',
      {
        applicationId: 'APP-CREDIT-001',
        customerCode: 'CUST-B2B-001',
        customerNameTh: 'บริษัท อิตาเลียน-ไทย คอนสตรัคชั่น จำกัด (มหาชน)',
        requestedCreditLimit: '5000000.0000',
        approvedCreditLimit: '5000000.0000',
        creditTermDays: 45,
        makerUserId: 'USR-CREDIT-MAKER-01',
        makerNameTh: 'นายอนุชา รอบคอบ (Credit Analyst)',
        makerSubmittedAt: '2026-09-01T08:15:00Z',
        checkerUserId: 'USR-CREDIT-MGR-01',
        checkerNameTh: 'นางประภาศรี รักษาการ (Credit Manager)',
        checkerReviewedAt: '2026-09-01T10:30:00Z',
        status: 'APPROVED',
        collateralType: 'BANK_GUARANTEE',
        collateralValue: '5000000.0000',
        notes: 'ผ่านการอนุมัติวงเงินตามนโยบายระดับ 2 มีหนังสือค้ำประกันธนาคารกสิกรไทย',
      },
    ],
  ]);

  /**
   * Thai Modulo 11 Tax ID validation algorithm
   */
  validateThaiTaxId(taxId: string): boolean {
    if (!taxId || !/^\d{13}$/.test(taxId)) {
      return false;
    }
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(taxId.charAt(i), 10) * (13 - i);
    }
    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === parseInt(taxId.charAt(12), 10);
  }

  /**
   * Automatic Proximity Logistics Zone resolution from GPS Coordinates
   */
  resolveZoneFromCoordinates(latitude: number, longitude: number, province?: string): string {
    // Bangkok & Perimeter Zones
    if (latitude >= 13.4 && latitude <= 14.2 && longitude >= 100.2 && longitude <= 101.0) {
      if (longitude >= 100.6) {
        return 'BKK_EAST'; // Bangna, Samut Prakan, Suvarnabhumi, Min Buri
      }
      if (latitude >= 13.8) {
        return 'BKK_NORTH'; // Rangsit, Pathum Thani, Nonthaburi
      }
      return 'BKK_WEST'; // Thonburi, Samut Sakhon, Nakhon Pathom
    }

    // Upcountry Provincial Zones
    if (latitude >= 15.0 && longitude >= 101.5) {
      return 'UPCOUNTRY_NORTHEAST'; // Khon Kaen, Korat, Udon
    }
    if (latitude >= 16.0) {
      return 'UPCOUNTRY_NORTH'; // Chiang Mai, Chiang Rai
    }
    if (latitude <= 13.0) {
      return 'UPCOUNTRY_SOUTH'; // Surat Thani, Phuket, Hat Yai
    }
    if (longitude >= 101.0) {
      return 'UPCOUNTRY_EAST'; // Chonburi, Rayong, Pattaya
    }

    return 'UPCOUNTRY_CENTRAL';
  }

  /**
   * Onboard New Customer (3 Pillars: CRM + Geo-Pinning + Credit Facility + AE Assignment)
   */
  onboardCustomer(dto: CustomerOnboardingDto, makerUserId = 'USR-CREDIT-MAKER-01', makerNameTh = 'เจ้าหน้าที่สินเชื่อฝ่ายตั้งเรื่อง'): CustomerFullProfile {
    // 1. Validate Thai Tax ID with Modulo 11
    if (!this.validateThaiTaxId(dto.taxId)) {
      throw new BadRequestException(`เลขประจำตัวผู้เสียภาษี '${dto.taxId}' ไม่ถูกต้องตามมาตรฐาน Thai Modulo 11 Checksum`);
    }

    // 2. Validate AE existence
    const ae = this.salesExecutives.get(dto.assignedAeCode);
    if (!ae) {
      throw new BadRequestException(`ไม่พบรหัสพนักงานขาย/AE: ${dto.assignedAeCode}`);
    }

    // 3. Resolve Logistics Zone from GPS
    const resolvedZone = this.resolveZoneFromCoordinates(
      dto.deliverySite.latitude,
      dto.deliverySite.longitude,
      dto.deliverySite.province,
    );

    const siteId = `SITE-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    const deliverySite: CustomerDeliverySite = {
      siteId,
      customerCode: dto.customerCode,
      siteName: dto.deliverySite.siteName,
      latitude: dto.deliverySite.latitude,
      longitude: dto.deliverySite.longitude,
      subdistrict: dto.deliverySite.subdistrict,
      district: dto.deliverySite.district,
      province: dto.deliverySite.province,
      postalCode: dto.deliverySite.postalCode,
      zoneCode: resolvedZone,
      contactPerson: dto.deliverySite.contactPerson,
      contactPhone: dto.deliverySite.contactPhone,
      isPrimary: true,
      createdAt: nowIso,
    };

    // 4. Create Credit Application for Dual-Control Maker-Checker
    const appId = `APP-CREDIT-${Date.now().toString().slice(-6)}`;
    const creditApp: CreditFacilityApplication = {
      applicationId: appId,
      customerCode: dto.customerCode,
      customerNameTh: dto.customerNameTh,
      requestedCreditLimit: new Decimal(dto.creditApplication.requestedCreditLimit || '0').toFixed(4),
      creditTermDays: dto.creditApplication.creditTermDays || 30,
      makerUserId,
      makerNameTh,
      makerSubmittedAt: nowIso,
      status: 'PENDING',
      collateralType: dto.creditApplication.collateralType || 'CLEAN_CREDIT',
      collateralValue: new Decimal(dto.creditApplication.collateralValue || '0').toFixed(4),
      notes: dto.creditApplication.notes,
    };

    this.creditApplications.set(appId, creditApp);

    // 5. Assemble Full Profile
    const profile: CustomerFullProfile = {
      customerCode: dto.customerCode,
      customerNameTh: dto.customerNameTh,
      taxId: dto.taxId,
      branchNumber: dto.branchNumber || '00000',
      registeredAddressTh: dto.registeredAddressTh,
      customerSegment: dto.customerSegment,
      salesOrgType: dto.salesOrgType,
      assignedAe: ae,
      deliverySites: [deliverySite],
      creditProfile: {
        creditTermDays: dto.creditApplication.creditTermDays || 30,
        approvedCreditLimit: '0.0000', // Zero until Checker approves
        currentArBalance: '0.0000',
        pendingOrderExposure: '0.0000',
        unmaturedPdcAmount: '0.0000',
        availableCredit: '0.0000',
        isCreditBlocked: false,
      },
      latestCreditApplication: creditApp,
      status: EntityStatus.PENDING_APPROVAL,
      createdAt: nowIso,
    };

    this.customers.set(dto.customerCode, profile);
    return profile;
  }

  /**
   * Dual-Control Maker-Checker Credit Approval
   */
  reviewCreditApplication(dto: CreditApprovalDto): CreditFacilityApplication {
    const app = this.creditApplications.get(dto.applicationId);
    if (!app) {
      throw new NotFoundException(`ไม่พบใบคำขอสินเชื่อรหัส ${dto.applicationId}`);
    }

    // Constraint: Maker and Checker cannot be the same user
    if (app.makerUserId === dto.checkerUserId) {
      throw new BadRequestException('ระเบียบการควบคุมภายใน (Maker-Checker Dual Control): ผู้ตรวจสอบอนุมัติ (Checker) จะต้องไม่ใช่บุคคลเดียวกับผู้สร้างคำขอ (Maker)');
    }

    const nowIso = new Date().toISOString();
    app.checkerUserId = dto.checkerUserId;
    app.checkerNameTh = dto.checkerNameTh;
    app.checkerReviewedAt = nowIso;

    if (dto.action === 'APPROVE') {
      const approvedAmount = dto.approvedCreditLimit
        ? new Decimal(dto.approvedCreditLimit).toFixed(4)
        : app.requestedCreditLimit;

      app.status = 'APPROVED';
      app.approvedCreditLimit = approvedAmount;

      // Update Customer profile
      const cust = this.customers.get(app.customerCode);
      if (cust) {
        cust.creditProfile.approvedCreditLimit = approvedAmount;
        cust.creditProfile.availableCredit = approvedAmount;
        cust.creditProfile.creditTermDays = app.creditTermDays;
        cust.status = EntityStatus.ACTIVE;
        cust.latestCreditApplication = app;
      }
    } else {
      app.status = 'REJECTED';
      app.rejectionReason = dto.rejectionReason || 'ไม่อนุมัติวงเงินตามเกณฑ์ความเสี่ยง';

      const cust = this.customers.get(app.customerCode);
      if (cust) {
        cust.status = EntityStatus.REJECTED;
        cust.latestCreditApplication = app;
      }
    }

    return app;
  }

  /**
   * Add a Delivery Site with Geo-Pinning to an Existing Customer
   */
  addDeliverySite(customerCode: string, site: Omit<CustomerDeliverySite, 'siteId' | 'customerCode' | 'zoneCode' | 'createdAt'>): CustomerDeliverySite {
    const cust = this.customers.get(customerCode);
    if (!cust) {
      throw new NotFoundException(`ไม่พบข้อมูลลูกค้า: ${customerCode}`);
    }

    const zoneCode = this.resolveZoneFromCoordinates(site.latitude, site.longitude, site.province);
    const siteId = `SITE-${Date.now().toString().slice(-6)}`;
    const newSite: CustomerDeliverySite = {
      ...site,
      siteId,
      customerCode,
      zoneCode,
      createdAt: new Date().toISOString(),
    };

    if (site.isPrimary) {
      cust.deliverySites.forEach(s => (s.isPrimary = false));
    }

    cust.deliverySites.push(newSite);
    return newSite;
  }

  /**
   * Get all customers
   */
  getAllCustomers(): CustomerFullProfile[] {
    return Array.from(this.customers.values());
  }

  /**
   * Get customer by code
   */
  getCustomer(customerCode: string): CustomerFullProfile {
    const cust = this.customers.get(customerCode);
    if (!cust) {
      throw new NotFoundException(`ไม่พบข้อมูลลูกค้า: ${customerCode}`);
    }
    return cust;
  }

  /**
   * Get all Sales Executives (optionally filtered by Org Type or Branch)
   */
  getSalesExecutives(orgType?: SalesOrgType, branchCode?: string): SalesExecutive[] {
    let list = Array.from(this.salesExecutives.values());
    if (orgType) {
      list = list.filter(ae => ae.organizationType === orgType);
    }
    if (branchCode) {
      list = list.filter(ae => ae.assignedBranchCode === branchCode);
    }
    return list;
  }

  /**
   * Get all Credit Facility Applications
   */
  getCreditApplications(): CreditFacilityApplication[] {
    return Array.from(this.creditApplications.values());
  }
}
