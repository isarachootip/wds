import { CustomerService } from '../src/modules/customer/customer.service';
import { CustomerOnboardingDto } from '@wds/shared-types';

describe('CustomerService (CRM Onboarding, Geo-Pinning, Credit Governance, AE Hierarchy)', () => {
  let service: CustomerService;

  beforeEach(() => {
    service = new CustomerService();
  });

  describe('1. Thai Tax ID Modulo 11 Verification', () => {
    it('should validate correct 13-digit Thai Corporate Tax ID', () => {
      // 0107537000882 is Italian-Thai Development PCL
      expect(service.validateThaiTaxId('0107537000882')).toBe(true);
      // 0107562000386 is Central Retail Corporation PCL
      expect(service.validateThaiTaxId('0107562000386')).toBe(true);
      // 0107537000955 is Siam Cement PCL
      expect(service.validateThaiTaxId('0107537000955')).toBe(true);
    });

    it('should reject invalid Tax IDs (wrong check digit or bad format)', () => {
      expect(service.validateThaiTaxId('0107537000881')).toBe(false); // Invalid check digit
      expect(service.validateThaiTaxId('12345')).toBe(false); // Too short
      expect(service.validateThaiTaxId('ABCDEFGHIJKLM')).toBe(false); // Non-numeric
      expect(service.validateThaiTaxId('')).toBe(false);
    });
  });

  describe('2. Geo-Pinning & Logistics Zone Resolution', () => {
    it('should resolve Bangkok East (Bangna / Suvarnabhumi) zone from GPS coordinates', () => {
      const zone = service.resolveZoneFromCoordinates(13.668212, 100.634123, 'สมุทรปราการ');
      expect(zone).toBe('BKK_EAST');
    });

    it('should resolve Bangkok North (Rangsit / Pathum Thani) zone from GPS coordinates', () => {
      const zone = service.resolveZoneFromCoordinates(13.988212, 100.544123, 'ปทุมธานี');
      expect(zone).toBe('BKK_NORTH');
    });

    it('should resolve Upcountry Northeast (Khon Kaen) zone from GPS coordinates', () => {
      const zone = service.resolveZoneFromCoordinates(16.441935, 102.835992, 'ขอนแก่น');
      expect(zone).toBe('UPCOUNTRY_NORTHEAST');
    });
  });

  describe('3. Customer Onboarding & AE Assignment', () => {
    const validOnboardingDto: CustomerOnboardingDto = {
      customerCode: 'CUST-NEW-001',
      customerNameTh: 'บริษัท นครหลวงคอนสตรัคชั่น 2026 จำกัด',
      taxId: '0107562000386',
      branchNumber: '00000',
      registeredAddressTh: 'เลขที่ 88/9 หมู่ 2 ถนนบางนา-ตราด ต.บางแก้ว อ.บางพลี จ.สมุทรปราการ 10540',
      customerSegment: 'COMMERCIAL_CONTRACTOR',
      deliverySite: {
        siteName: 'โครงการ เมกา บางนา วิลเลจ เฟส 2',
        latitude: 13.648212,
        longitude: 100.684123,
        subdistrict: 'บางแก้ว',
        district: 'บางพลี',
        province: 'สมุทรปราการ',
        postalCode: '10540',
        contactPerson: 'นายประสิทธิ์ มั่นคง',
        contactPhone: '081-222-9999',
      },
      creditApplication: {
        requestedCreditLimit: '3000000.0000',
        creditTermDays: 45,
        collateralType: 'BANK_GUARANTEE',
        collateralValue: '3000000.0000',
        notes: 'ผู้รับเหมาหลักโครงการเมกาบางนาวิลเลจ',
      },
      assignedAeCode: 'AE-HQ-001',
      salesOrgType: 'HEADQUARTERS',
    };

    it('should successfully onboard customer and create pending credit application', () => {
      const profile = service.onboardCustomer(validOnboardingDto, 'USR-MAKER-01', 'นายเจ้าหน้าที่สินเชื่อ');

      expect(profile.customerCode).toBe('CUST-NEW-001');
      expect(profile.taxId).toBe('0107562000386');
      expect(profile.assignedAe.aeCode).toBe('AE-HQ-001');
      expect(profile.assignedAe.organizationType).toBe('HEADQUARTERS');
      expect(profile.deliverySites).toHaveLength(1);
      expect(profile.deliverySites[0].zoneCode).toBe('BKK_EAST');
      expect(profile.creditProfile.approvedCreditLimit).toBe('0.0000'); // Pending approval
      expect(profile.status).toBe('PENDING_APPROVAL');
    });

    it('should reject onboarding when Tax ID is invalid', () => {
      const invalidDto = { ...validOnboardingDto, taxId: '1111111111111' };
      expect(() => service.onboardCustomer(invalidDto)).toThrow(
        /Thai Modulo 11 Checksum/,
      );
    });

    it('should reject onboarding when AE code does not exist', () => {
      const invalidDto = { ...validOnboardingDto, assignedAeCode: 'AE-NON-EXISTENT' };
      expect(() => service.onboardCustomer(invalidDto)).toThrow(
        /ไม่พบรหัสพนักงานขาย\/AE/,
      );
    });
  });

  describe('4. Maker-Checker Dual-Control Credit Facility Approval', () => {
    it('should enforce Maker-Checker segregation (Checker cannot be Maker)', () => {
      const onboardDto: CustomerOnboardingDto = {
        customerCode: 'CUST-MC-001',
        customerNameTh: 'บริษัท สามัคคีวิศวกรรม จำกัด',
        taxId: '0107562000386',
        branchNumber: '00000',
        registeredAddressTh: 'กรุงเทพฯ',
        customerSegment: 'COMMERCIAL_CONTRACTOR',
        deliverySite: {
          siteName: 'หน้างาน 1',
          latitude: 13.7,
          longitude: 100.5,
          subdistrict: 'ปทุมวัน',
          district: 'ปทุมวัน',
          province: 'กรุงเทพฯ',
          postalCode: '10330',
          contactPerson: 'สมชาย',
          contactPhone: '0812345678',
        },
        creditApplication: {
          requestedCreditLimit: '1000000.0000',
          creditTermDays: 30,
        },
        assignedAeCode: 'AE-BKK-001',
        salesOrgType: 'BRANCH_STORE',
      };

      const profile = service.onboardCustomer(onboardDto, 'USER-SAME-ID', 'นายผู้สร้างคำขอ');
      const appId = profile.latestCreditApplication?.applicationId!;

      // Attempting to self-approve with the same user ID must fail
      expect(() =>
        service.reviewCreditApplication({
          applicationId: appId,
          checkerUserId: 'USER-SAME-ID',
          checkerNameTh: 'นายผู้สร้างคำขอ (พยายามอนุมัติตนเอง)',
          action: 'APPROVE',
        }),
      ).toThrow(/Maker-Checker Dual Control/);
    });

    it('should successfully approve credit limit when Checker is independent user', () => {
      const onboardDto: CustomerOnboardingDto = {
        customerCode: 'CUST-MC-002',
        customerNameTh: 'บริษัท รุ่งเรืองพัฒนาการก่อสร้าง จำกัด',
        taxId: '0107562000386',
        branchNumber: '00000',
        registeredAddressTh: 'กรุงเทพฯ',
        customerSegment: 'COMMERCIAL_CONTRACTOR',
        deliverySite: {
          siteName: 'หน้างาน 2',
          latitude: 13.7,
          longitude: 100.5,
          subdistrict: 'ปทุมวัน',
          district: 'ปทุมวัน',
          province: 'กรุงเทพฯ',
          postalCode: '10330',
          contactPerson: 'สมบูรณ์',
          contactPhone: '0812345678',
        },
        creditApplication: {
          requestedCreditLimit: '2500000.0000',
          creditTermDays: 30,
        },
        assignedAeCode: 'AE-BKK-001',
        salesOrgType: 'BRANCH_STORE',
      };

      const profile = service.onboardCustomer(onboardDto, 'MAKER-01', 'นายเจ้าหน้าที่ทำเรื่อง');
      const appId = profile.latestCreditApplication?.applicationId!;

      const reviewedApp = service.reviewCreditApplication({
        applicationId: appId,
        checkerUserId: 'CHECKER-MGR-01',
        checkerNameTh: 'นางผู้จัดการสินเชื่อผู้อนุมัติ',
        action: 'APPROVE',
        approvedCreditLimit: '2500000.0000',
      });

      expect(reviewedApp.status).toBe('APPROVED');
      expect(reviewedApp.approvedCreditLimit).toBe('2500000.0000');

      const updatedCust = service.getCustomer('CUST-MC-002');
      expect(updatedCust.status).toBe('ACTIVE');
      expect(updatedCust.creditProfile.approvedCreditLimit).toBe('2500000.0000');
      expect(updatedCust.creditProfile.availableCredit).toBe('2500000.0000');
    });
  });
});
