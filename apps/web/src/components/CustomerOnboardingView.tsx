import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Tabs,
  Table,
  Tag,
  Badge,
  Steps,
  Alert,
  Modal,
  notification,
  Space,
  Radio,
  Divider,
} from 'antd';
import {
  UserAddOutlined,
  EnvironmentOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AuditOutlined,
  BankOutlined,
  CompassOutlined,
  InfoCircleOutlined,
  ShopOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import type {
  SalesExecutive,
  CustomerFullProfile,
  CustomerDeliverySite,
  CreditFacilityApplication,
  SalesOrgType,
  EntityStatus,
} from '@wds/shared-types';

const INITIAL_AES: SalesExecutive[] = [
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
];

const INITIAL_CUSTOMERS: CustomerFullProfile[] = [
  {
    customerCode: 'CUST-B2B-001',
    customerNameTh: 'บริษัท อิตาเลียน-ไทย คอนสตรัคชั่น จำกัด (มหาชน)',
    taxId: '0107537000882',
    branchNumber: '00000',
    registeredAddressTh: 'เลขที่ 2034/132-161 อาคารอิตัลไทย ทาวเวอร์ ถนนเพชรบุรีตัดใหม่ แขวงบางกะปิ เขตห้วยขวาง กรุงเทพฯ 10310',
    customerSegment: 'COMMERCIAL_CONTRACTOR',
    salesOrgType: 'HEADQUARTERS',
    assignedAe: INITIAL_AES[2],
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
      {
        siteId: 'SITE-002',
        customerCode: 'CUST-B2B-001',
        siteName: 'โครงการทางด่วนสายพระราม 3 - ดาวคะนอง',
        latitude: 13.682145,
        longitude: 100.481234,
        subdistrict: 'บางมด',
        district: 'จอมทอง',
        province: 'กรุงเทพมหานคร',
        postalCode: '10150',
        zoneCode: 'BKK_WEST',
        contactPerson: 'วิศวกรวิรัช ก่อการ',
        contactPhone: '081-999-8882',
        isPrimary: false,
        createdAt: '2026-09-03T11:20:00Z',
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
    status: 'ACTIVE' as EntityStatus,
    createdAt: '2026-09-01T08:00:00Z',
  },
];

const INITIAL_APPLICATIONS: CreditFacilityApplication[] = [
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
];

// Modulo 11 Validator Helper
function validateThaiTaxId(taxId: string): boolean {
  if (!taxId || !/^\d{13}$/.test(taxId)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(taxId.charAt(i), 10) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(taxId.charAt(12), 10);
}

// Proximity Zone Resolver
function resolveZone(lat: number, lng: number): string {
  if (lat >= 13.4 && lat <= 14.2 && lng >= 100.2 && lng <= 101.0) {
    if (lng >= 100.6) return 'BKK_EAST';
    if (lat >= 13.8) return 'BKK_NORTH';
    return 'BKK_WEST';
  }
  if (lat >= 15.0 && lng >= 101.5) return 'UPCOUNTRY_NORTHEAST';
  if (lat >= 16.0) return 'UPCOUNTRY_NORTH';
  if (lat <= 13.0) return 'UPCOUNTRY_SOUTH';
  if (lng >= 101.0) return 'UPCOUNTRY_EAST';
  return 'UPCOUNTRY_CENTRAL';
}

export const CustomerOnboardingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState('onboard');
  const [currentStep, setCurrentStep] = useState(0);

  // States
  const [customers, setCustomers] = useState<CustomerFullProfile[]>(INITIAL_CUSTOMERS);
  const [creditApps, setCreditApps] = useState<CreditFacilityApplication[]>(INITIAL_APPLICATIONS);
  const [salesExecutives] = useState<SalesExecutive[]>(INITIAL_AES);

  // Form
  const [form] = Form.useForm();
  const [selectedOrgType, setSelectedOrgType] = useState<SalesOrgType>('HEADQUARTERS');
  const [taxIdInput, setTaxIdInput] = useState<string>('0107562000386');
  const [isTaxIdValid, setIsTaxIdValid] = useState<boolean>(true);
  const [geoLat, setGeoLat] = useState<number>(13.668212);
  const [geoLng, setGeoLng] = useState<number>(100.634123);
  const [detectedZone, setDetectedZone] = useState<string>('BKK_EAST');

  // Review Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedAppForReview, setSelectedAppForReview] = useState<CreditFacilityApplication | null>(null);
  const [checkerUserId, setCheckerUserId] = useState('USR-CREDIT-MGR-01');
  const [checkerNameTh, setCheckerNameTh] = useState('นางประภาศรี รักษาการ (Credit Manager)');

  // Handle Tax ID change
  const handleTaxIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setTaxIdInput(val);
    form.setFieldsValue({ taxId: val });
    setIsTaxIdValid(validateThaiTaxId(val));
  };

  // Preset Tax ID Selection
  const selectPresetTaxId = (code: string, name: string, addr: string) => {
    setTaxIdInput(code);
    setIsTaxIdValid(true);
    form.setFieldsValue({
      taxId: code,
      customerNameTh: name,
      registeredAddressTh: addr,
    });
  };

  // Handle Coordinate change
  const handleCoordinateChange = (lat?: number | null, lng?: number | null) => {
    const newLat = lat !== undefined && lat !== null ? lat : geoLat;
    const newLng = lng !== undefined && lng !== null ? lng : geoLng;
    setGeoLat(newLat);
    setGeoLng(newLng);
    const z = resolveZone(newLat, newLng);
    setDetectedZone(z);
    form.setFieldsValue({ latitude: newLat, longitude: newLng, zoneCode: z });
  };

  // Preset Sites Selection
  const selectPresetSite = (name: string, lat: number, lng: number, sub: string, dist: string, prov: string, post: string) => {
    setGeoLat(lat);
    setGeoLng(lng);
    const z = resolveZone(lat, lng);
    setDetectedZone(z);
    form.setFieldsValue({
      siteName: name,
      latitude: lat,
      longitude: lng,
      subdistrict: sub,
      district: dist,
      province: prov,
      postalCode: post,
      zoneCode: z,
    });
  };

  // Submit Onboarding
  const handleOnboardFinish = (values: any) => {
    if (!isTaxIdValid) {
      notification.error({
        message: 'เลขประจำตัวผู้เสียภาษีไม่ถูกต้อง',
        description: 'กรุณาตรวจสอบเลขประจำตัวผู้เสียภาษี 13 หลักตามมาตรฐาน Thai Modulo 11',
      });
      return;
    }

    const assignedAe = salesExecutives.find(ae => ae.aeCode === values.assignedAeCode) || salesExecutives[0];
    const customerCode = values.customerCode || `CUST-B2B-${(customers.length + 1).toString().padStart(3, '0')}`;
    const nowIso = new Date().toISOString();

    const newDeliverySite: CustomerDeliverySite = {
      siteId: `SITE-${Date.now().toString().slice(-6)}`,
      customerCode,
      siteName: values.siteName,
      latitude: values.latitude || geoLat,
      longitude: values.longitude || geoLng,
      subdistrict: values.subdistrict,
      district: values.district,
      province: values.province,
      postalCode: values.postalCode,
      zoneCode: detectedZone,
      contactPerson: values.contactPerson,
      contactPhone: values.contactPhone,
      isPrimary: true,
      createdAt: nowIso,
    };

    const newApp: CreditFacilityApplication = {
      applicationId: `APP-CREDIT-${Date.now().toString().slice(-6)}`,
      customerCode,
      customerNameTh: values.customerNameTh,
      requestedCreditLimit: Number(values.requestedCreditLimit || 0).toFixed(4),
      creditTermDays: values.creditTermDays || 30,
      makerUserId: 'USR-CREDIT-MAKER-01',
      makerNameTh: 'นายอนุชา รอบคอบ (Credit Analyst)',
      makerSubmittedAt: nowIso,
      status: 'PENDING',
      collateralType: values.collateralType || 'CLEAN_CREDIT',
      collateralValue: Number(values.collateralValue || 0).toFixed(4),
      notes: values.notes,
    };

    const newProfile: CustomerFullProfile = {
      customerCode,
      customerNameTh: values.customerNameTh,
      taxId: values.taxId,
      branchNumber: values.branchNumber || '00000',
      registeredAddressTh: values.registeredAddressTh,
      customerSegment: values.customerSegment || 'COMMERCIAL_CONTRACTOR',
      salesOrgType: selectedOrgType,
      assignedAe,
      deliverySites: [newDeliverySite],
      creditProfile: {
        creditTermDays: values.creditTermDays || 30,
        approvedCreditLimit: '0.0000',
        currentArBalance: '0.0000',
        pendingOrderExposure: '0.0000',
        unmaturedPdcAmount: '0.0000',
        availableCredit: '0.0000',
        isCreditBlocked: false,
      },
      latestCreditApplication: newApp,
      status: 'PENDING_APPROVAL' as EntityStatus,
      createdAt: nowIso,
    };

    setCustomers(prev => [newProfile, ...prev]);
    setCreditApps(prev => [newApp, ...prev]);

    notification.success({
      message: 'ลงทะเบียนลูกค้าสำเร็จ (Customer Onboarded)',
      description: `สร้างโปรไฟล์ลูกค้า ${customerCode} และส่งคำขอวงเงินสินเชื่อเข้าสู่คิว Maker-Checker เรียบร้อยแล้ว`,
    });

    setCurrentStep(0);
    form.resetFields();
    setActiveTab('registry');
  };

  // Review & Approve/Reject Credit Application
  const handleReviewAction = (action: 'APPROVE' | 'REJECT') => {
    if (!selectedAppForReview) return;

    if (selectedAppForReview.makerUserId === checkerUserId) {
      notification.error({
        message: 'ละเมิดหลักการ Dual Control',
        description: 'ผู้ตรวจสอบ (Checker) จะต้องไม่ใช่บุคคลเดียวกับผู้สร้างคำขอ (Maker)',
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const updatedApps = creditApps.map(app => {
      if (app.applicationId === selectedAppForReview.applicationId) {
        return {
          ...app,
          status: action === 'APPROVE' ? ('APPROVED' as const) : ('REJECTED' as const),
          approvedCreditLimit: action === 'APPROVE' ? app.requestedCreditLimit : '0.0000',
          checkerUserId,
          checkerNameTh,
          checkerReviewedAt: nowIso,
          rejectionReason: action === 'REJECT' ? 'ไม่อนุมัติเนื่องจากเกินเกณฑ์ความเสี่ยง' : undefined,
        };
      }
      return app;
    });

    setCreditApps(updatedApps);

    // Update Customer Profile
    setCustomers(prev =>
      prev.map(c => {
        if (c.customerCode === selectedAppForReview.customerCode) {
          return {
            ...c,
            status: action === 'APPROVE' ? ('ACTIVE' as EntityStatus) : ('REJECTED' as EntityStatus),
            creditProfile: {
              ...c.creditProfile,
              approvedCreditLimit: action === 'APPROVE' ? selectedAppForReview.requestedCreditLimit : '0.0000',
              availableCredit: action === 'APPROVE' ? selectedAppForReview.requestedCreditLimit : '0.0000',
            },
          };
        }
        return c;
      }),
    );

    notification.success({
      message: action === 'APPROVE' ? 'อนุมัติวงเงินสินเชื่อเรียบร้อย' : 'ปฏิเสธคำขอวงเงิน',
      description: `คำขอ ${selectedAppForReview.applicationId} ได้รับการพิจารณาโดย ${checkerNameTh}`,
    });

    setReviewModalVisible(false);
    setSelectedAppForReview(null);
  };

  const filteredAes = salesExecutives.filter(ae => ae.organizationType === selectedOrgType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-lg shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 m-0">CRM Customer Onboarding & AE Master Hub</h1>
            <Tag color="red" className="font-semibold">Day-0 Foundational Flow</Tag>
          </div>
          <p className="text-xs text-slate-500 mt-1 mb-0">
            ระบบสร้างข้อมูลลูกค้า (CRM + ปักหมุด GPS หน้างาน), กำหนดวงเงินสินเชื่อคู่ขนาน (Maker-Checker Credit Facility), และจัดสรรทีมขาย Account Executive (ส่วนกลาง vs ประจำสาขา)
          </p>
        </div>
        <div className="flex gap-2">
          <Tag color="blue" icon={<AuditOutlined />}>Req ID: [FR-MD-001] to [FR-CR-008]</Tag>
          <Tag color="green" icon={<SafetyCertificateOutlined />}>Thai Modulo 11 Active</Tag>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        className="bg-transparent"
        items={[
          {
            key: 'onboard',
            label: (
              <span className="flex items-center gap-1.5 font-medium">
                <UserAddOutlined />
                1. Customer Onboarding Wizard (3-Step)
              </span>
            ),
            children: (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <Steps
                  current={currentStep}
                  onChange={setCurrentStep}
                  className="mb-8"
                  items={[
                    { title: 'Step 1: CRM & Geo-Pinning', description: 'ข้อมูลนิติบุคคล & พิกัดหน้างาน GPS' },
                    { title: 'Step 2: Credit Facility', description: 'วงเงินสินเชื่อ & Maker-Checker' },
                    { title: 'Step 3: Sales Org & AE', description: 'สังกัดทีมขายส่วนกลาง / ประจำสาขา' },
                  ]}
                />

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleOnboardFinish}
                  initialValues={{
                    customerCode: 'CUST-B2B-002',
                    taxId: '0107562000386',
                    branchNumber: '00000',
                    customerSegment: 'COMMERCIAL_CONTRACTOR',
                    customerNameTh: 'บริษัท เซ็นทรัล รีเทล คอร์ปอเรชั่น จำกัด (มหาชน)',
                    registeredAddressTh: 'เลขที่ 22 อาคารซีอาร์ซีทาวเวอร์ ออลซีซั่นส์เพลส ถนนวิทยุ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330',
                    siteName: 'โครงการ Mega Bangna Village Phase 2 (ไซต์งานก่อสร้าง)',
                    latitude: 13.668212,
                    longitude: 100.634123,
                    subdistrict: 'บางแก้ว',
                    district: 'บางพลี',
                    province: 'สมุทรปราการ',
                    postalCode: '10540',
                    contactPerson: 'นายประสิทธิ์ มั่นคง (ผู้จัดการโครงการ)',
                    contactPhone: '081-456-7890',
                    requestedCreditLimit: 3000000,
                    creditTermDays: 45,
                    collateralType: 'BANK_GUARANTEE',
                    collateralValue: 3000000,
                    assignedAeCode: 'AE-HQ-001',
                  }}
                >
                  {/* Step 1: CRM & Geo-Pinning */}
                  <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <InfoCircleOutlined />
                        <span>ตัวอย่างเลขผู้เสียภาษี 13 หลักที่ผ่านเกณฑ์ Modulo 11:</span>
                      </div>
                      <Space>
                        <Button
                          size="small"
                          onClick={() =>
                            selectPresetTaxId(
                              '0107562000386',
                              'บริษัท เซ็นทรัล รีเทล คอร์ปอเรชั่น จำกัด (มหาชน)',
                              'เลขที่ 22 อาคารซีอาร์ซีทาวเวอร์ ออลซีซั่นส์เพลส ถนนวิทยุ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330',
                            )
                          }
                        >
                          CRC (0107562000386)
                        </Button>
                        <Button
                          size="small"
                          onClick={() =>
                            selectPresetTaxId(
                              '0107537000882',
                              'บริษัท อิตาเลียน-ไทย คอนสตรัคชั่น จำกัด (มหาชน)',
                              'เลขที่ 2034/132-161 อาคารอิตัลไทย ทาวเวอร์ ถนนเพชรบุรีตัดใหม่ แขวงบางกะปิ เขตห้วยขวาง กรุงเทพฯ 10310',
                            )
                          }
                        >
                          ITD (0107537000882)
                        </Button>
                        <Button
                          size="small"
                          onClick={() =>
                            selectPresetTaxId(
                              '0107537000955',
                              'บริษัท ปูนซิเมนต์ไทย จำกัด (มหาชน)',
                              'เลขที่ 1 ถนนปูนซิเมนต์ไทย แขวงบางซื่อ เขตบางซื่อ กรุงเทพฯ 10800',
                            )
                          }
                        >
                          SCG (0107537000955)
                        </Button>
                      </Space>
                    </div>

                    <Row gutter={16}>
                      <Col span={6}>
                        <Form.Item label="รหัสลูกค้า (Customer Code)" name="customerCode" required>
                          <Input placeholder="e.g. CUST-B2B-002" />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item
                          label={
                            <div className="flex items-center justify-between w-full">
                              <span>เลขประจำตัวผู้เสียภาษี 13 หลัก (Tax ID)</span>
                              {taxIdInput.length === 13 && (
                                <Badge
                                  status={isTaxIdValid ? 'success' : 'error'}
                                  text={
                                    isTaxIdValid ? (
                                      <span className="text-emerald-600 font-semibold">Thai Modulo 11 Valid</span>
                                    ) : (
                                      <span className="text-red-600 font-semibold">Invalid Checksum</span>
                                    )
                                  }
                                />
                              )}
                            </div>
                          }
                          name="taxId"
                          required
                        >
                          <Input
                            placeholder="กรอก 13 หลัก"
                            maxLength={13}
                            onChange={handleTaxIdChange}
                            suffix={
                              isTaxIdValid && taxIdInput.length === 13 ? (
                                <CheckCircleOutlined className="text-emerald-500" />
                              ) : (
                                <CloseCircleOutlined className="text-red-500" />
                              )
                            }
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item label="เลขที่สาขา (Branch Code)" name="branchNumber" required>
                          <Input placeholder="00000 (สนญ.)" maxLength={5} />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item label="กลุ่มลูกค้า (Segment)" name="customerSegment" required>
                          <Select
                            options={[
                              { label: 'ผู้รับเหมาพาณิชย์ (Contractor)', value: 'COMMERCIAL_CONTRACTOR' },
                              { label: 'โครงการพัฒนาอสังหาฯ (Developer)', value: 'DEVELOPER' },
                              { label: 'โครงการภาครัฐ (Government)', value: 'GOVERNMENT_PROJECT' },
                              { label: 'ร้านค้าย่อย/ช่วงงาน (Sub-dealer)', value: 'TRADE_SUBDEALER' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="ชื่อนิติบุคคล / ลูกค้า (Company Name - TH)" name="customerNameTh" required>
                          <Input placeholder="ชื่อบริษัทตามหนังสือรับรองกระทรวงพาณิชย์" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="ที่อยู่จดทะเบียนตาม ภ.พ.20 (Registered Tax Address)" name="registeredAddressTh" required>
                          <Input.TextArea rows={2} placeholder="ที่อยู่สำนักงานใหญ่สำหรับออกใบกำกับภาษีเต็มรูป Section 86/4" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Divider orientation="left" className="text-slate-600 font-semibold">
                      <EnvironmentOutlined className="text-red-600 mr-2" />
                      ปักหมุดที่อยู่จัดส่งหน้างาน (Delivery Site & GPS Geo-Pinning)
                    </Divider>

                    <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded text-xs flex items-center justify-between">
                      <span className="text-slate-600 font-medium">
                        <CompassOutlined className="mr-1" />
                        พิกัดทางด่วน/โครงการตัวอย่าง (Quick Preset Sites):
                      </span>
                      <Space>
                        <Button
                          size="small"
                          onClick={() =>
                            selectPresetSite(
                              'โครงการ Ideo Mega Bangna Km.4',
                              13.668212,
                              100.634123,
                              'บางแก้ว',
                              'บางพลี',
                              'สมุทรปราการ',
                              '10540',
                            )
                          }
                        >
                          บางนา (13.668, 100.634)
                        </Button>
                        <Button
                          size="small"
                          onClick={() =>
                            selectPresetSite(
                              'โครงการ Future Park รังสิต เฟส 3',
                              13.988212,
                              100.544123,
                              'ประชาธิปัตย์',
                              'ธัญบุรี',
                              'ปทุมธานี',
                              '12130',
                            )
                          }
                        >
                          รังสิต (13.988, 100.544)
                        </Button>
                        <Button
                          size="small"
                          onClick={() =>
                            selectPresetSite(
                              'โครงการสถานีรถไฟความเร็วสูงขอนแก่น',
                              16.441935,
                              102.835992,
                              'ในเมือง',
                              'เมืองขอนแก่น',
                              'ขอนแก่น',
                              '40000',
                            )
                          }
                        >
                          ขอนแก่น (16.441, 102.835)
                        </Button>
                      </Space>
                    </div>

                    <Row gutter={16}>
                      <Col span={10}>
                        <Form.Item label="ชื่อสถานที่/โครงการจัดส่ง (Site Name)" name="siteName" required>
                          <Input placeholder="e.g. โครงการ Ideo Mega Bangna Km.4" />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item label="พิกัด Latitude (GPS)" name="latitude" required>
                          <InputNumber
                            className="w-full"
                            step={0.000001}
                            value={geoLat}
                            onChange={val => handleCoordinateChange(val, null)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item label="พิกัด Longitude (GPS)" name="longitude" required>
                          <InputNumber
                            className="w-full"
                            step={0.000001}
                            value={geoLng}
                            onChange={val => handleCoordinateChange(null, val)}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item label="Logistics Zone (คำนวณอัตโนมัติ)">
                          <Tag color="cyan" className="text-sm py-1 px-3 font-semibold">
                            {detectedZone}
                          </Tag>
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={5}>
                        <Form.Item label="ตำบล / แขวง" name="subdistrict" required>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item label="อำเภอ / เขต" name="district" required>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item label="จังหวัด" name="province" required>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item label="รหัสไปรษณีย์" name="postalCode" required>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={5}>
                        <Form.Item label="ผู้ติดต่อหน้างาน & เบอร์โทร" name="contactPerson" required>
                          <Input placeholder="ชื่อผู้รับของหน้างาน" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <div className="flex justify-end mt-4">
                      <Button type="primary" onClick={() => setCurrentStep(1)}>
                        ถัดไป: กำหนดวงเงินสินเชื่อ (Step 2) →
                      </Button>
                    </div>
                  </div>

                  {/* Step 2: Credit Facility */}
                  <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                    <Alert
                      message="การกำกับดูแลสินเชื่อแบบ Dual-Control (Maker-Checker Rule)"
                      description="การยื่นขอวงเงินจะถูกบันทึกโดย Maker (เจ้าหน้าที่สินเชื่อ) และต้องได้รับการอนุมัติโดย Checker (ผู้จัดการสินเชื่อ/ผู้อำนวยการฝ่ายการเงิน) ก่อนที่วงเงินจะมีผลใช้งานในระบบ"
                      type="info"
                      showIcon
                      className="mb-6"
                    />

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item label="วงเงินสินเชื่อที่ขออนุมัติ (Requested Credit Limit - THB)" name="requestedCreditLimit" required>
                          <InputNumber
                            className="w-full"
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                            addonAfter="บาท (Zero-Float Standard)"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="ระยะเวลาให้สินเชื่อ (Credit Term Days)" name="creditTermDays" required>
                          <Select
                            options={[
                              { label: '30 วัน (มาตรฐานค้าส่ง)', value: 30 },
                              { label: '45 วัน (งานโครงการทั่วไป)', value: 45 },
                              { label: '60 วัน (ผู้รับเหมา Tier-1)', value: 60 },
                              { label: '90 วัน (โครงการภาครัฐ/รัฐวิสาหกิจ)', value: 90 },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="ประเภทหลักประกัน / การค้ำประกัน" name="collateralType">
                          <Select
                            options={[
                              { label: 'หนังสือค้ำประกันธนาคาร (Bank Guarantee - BG)', value: 'BANK_GUARANTEE' },
                              { label: 'โฉนดที่ดิน / อสังหาริมทรัพย์ (Title Deed)', value: 'TITLE_DEED' },
                              { label: 'หนังสือค้ำประกันส่วนบุคคลกรรมการ (Director Pledge)', value: 'DIRECTOR_PLEDGE' },
                              { label: 'สินเชื่อไม่มีหลักประกัน (Clean Credit)', value: 'CLEAN_CREDIT' },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item label="มูลค่าหลักทรัพย์ค้ำประกัน (Collateral Value)" name="collateralValue">
                          <InputNumber
                            className="w-full"
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value?.replace(/\$\s?|(,*)/g, '') as any}
                            addonAfter="บาท"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={16}>
                        <Form.Item label="บันทึกการพิจารณาความเสี่ยงและเอกสารแนบ" name="notes">
                          <Input placeholder="ระบุเลขที่สัญญาค้ำประกัน / หนังสือรับรองงบการเงิน" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-6 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-semibold text-slate-700">ผู้จัดทำคำขอ (Credit Maker): </span>
                        <Tag color="purple">USR-CREDIT-MAKER-01 (นายอนุชา รอบคอบ)</Tag>
                      </div>
                      <div className="text-slate-500">
                        สถานะหลังบันทึก: <Tag color="orange">PENDING_CHECKER_APPROVAL</Tag>
                      </div>
                    </div>

                    <div className="flex justify-between mt-4">
                      <Button onClick={() => setCurrentStep(0)}>← ย้อนกลับ</Button>
                      <Button type="primary" onClick={() => setCurrentStep(2)}>
                        ถัดไป: กำหนดทีมขายและ AE (Step 3) →
                      </Button>
                    </div>
                  </div>

                  {/* Step 3: Sales Org & AE */}
                  <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                    <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="text-sm font-bold text-slate-800 mb-2">เลือกประเภทสังกัดทีมขาย (Sales Organization Hierarchy):</div>
                      <Radio.Group
                        value={selectedOrgType}
                        onChange={e => {
                          setSelectedOrgType(e.target.value);
                          form.setFieldsValue({
                            assignedAeCode: e.target.value === 'HEADQUARTERS' ? 'AE-HQ-001' : 'AE-BKK-001',
                          });
                        }}
                        className="w-full grid grid-cols-2 gap-4"
                      >
                        <Radio.Button value="HEADQUARTERS" className="h-auto p-4 rounded-lg flex items-start gap-3">
                          <GlobalOutlined className="text-2xl text-blue-600 mt-1" />
                          <div>
                            <div className="font-bold text-slate-800 text-sm">ฝ่ายขายโครงการส่วนกลาง (Corporate Direct Sales / HQ)</div>
                            <div className="text-xs text-slate-500 font-normal">
                              ดูแลลูกค้ารายใหญ่, Multi-site, Mega Projects ข้ามสาขาทั่วประเทศ และสั่งจ่ายตรงจาก CDC
                            </div>
                          </div>
                        </Radio.Button>

                        <Radio.Button value="BRANCH_STORE" className="h-auto p-4 rounded-lg flex items-start gap-3">
                          <ShopOutlined className="text-2xl text-orange-600 mt-1" />
                          <div>
                            <div className="font-bold text-slate-800 text-sm">ฝ่ายขายตรงประจำสาขา (Branch Store Sales Desk)</div>
                            <div className="text-xs text-slate-500 font-normal">
                              ดูแลผู้รับเหมาประจำพื้นที่, จัดส่งจากคลังสาขาในรัศมี (เช่น บางนา, รังสิต, ขอนแก่น)
                            </div>
                          </div>
                        </Radio.Button>
                      </Radio.Group>
                    </div>

                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="เลือกพนักงานขายประจำตัวลูกค้า (Assigned Account Executive)" name="assignedAeCode" required>
                          <Select
                            options={filteredAes.map(ae => ({
                              label: `${ae.fullNameTh} (${ae.aeCode}) — ${ae.roleTitleTh}`,
                              value: ae.aeCode,
                            }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item label="อำนาจการให้ส่วนลดสูงสุด (DOFA Role Authority)">
                          <Tag color="volcano" className="py-1 px-3 text-sm font-semibold">
                            Max Discount Limit: 3.00% (AE Standard)
                          </Tag>
                          <span className="text-xs text-slate-400 ml-2">ส่วนลดเกิน 3% ต้องส่ง Supervisor อนุมัติ</span>
                        </Form.Item>
                      </Col>
                    </Row>

                    <div className="p-4 bg-slate-900 text-white rounded-lg mb-6 text-xs">
                      <div className="font-bold text-slate-300 mb-2 flex items-center gap-2">
                        <TeamOutlined className="text-red-400" />
                        DOFA Escalation & Management Chain:
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 bg-slate-800 rounded">
                          <div className="text-slate-400 text-xxs">Direct AE (3%)</div>
                          <div className="font-semibold text-white">นายกิตติศักดิ์ พัฒนกิจ</div>
                        </div>
                        <div className="p-2 bg-slate-800 rounded">
                          <div className="text-slate-400 text-xxs">Supervisor / KAM (8%)</div>
                          <div className="font-semibold text-white">นางสาวณิชาภา รัตนไพศาล</div>
                        </div>
                        <div className="p-2 bg-slate-800 rounded">
                          <div className="text-slate-400 text-xxs">VP Commercial (15%)</div>
                          <div className="font-semibold text-white">นายวิชัย สุวรรณภูมิ</div>
                        </div>
                        <div className="p-2 bg-slate-800 rounded">
                          <div className="text-slate-400 text-xxs">Credit & Risk Approver</div>
                          <div className="font-semibold text-white">นางประภาศรี รักษาการ</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between mt-4">
                      <Button onClick={() => setCurrentStep(1)}>← ย้อนกลับ</Button>
                      <Button type="primary" htmlType="submit" className="bg-emerald-600 hover:bg-emerald-700">
                        <CheckCircleOutlined /> ยืนยันการสร้างข้อมูลลูกค้าและส่งคำขอ (Submit Onboarding)
                      </Button>
                    </div>
                  </div>
                </Form>
              </div>
            ),
          },
          {
            key: 'registry',
            label: (
              <span className="flex items-center gap-1.5 font-medium">
                <BankOutlined />
                2. Customer Registry & Delivery Sites ({customers.length})
              </span>
            ),
            children: (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <Table
                  dataSource={customers}
                  rowKey="customerCode"
                  pagination={{ pageSize: 5 }}
                  columns={[
                    {
                      title: 'รหัส / ชื่อลูกค้า',
                      dataIndex: 'customerNameTh',
                      key: 'name',
                      render: (_, r) => (
                        <div>
                          <div className="font-bold text-slate-800">{r.customerNameTh}</div>
                          <div className="text-xs text-slate-500">
                            Code: <span className="font-mono">{r.customerCode}</span> | Tax ID:{' '}
                            <span className="font-mono text-blue-600">{r.taxId}</span> (สาขา {r.branchNumber})
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: 'สังกัดทีมขาย / AE ผู้ดูแล',
                      key: 'ae',
                      render: (_, r) => (
                        <div>
                          <Tag color={r.salesOrgType === 'HEADQUARTERS' ? 'blue' : 'orange'}>
                            {r.salesOrgType === 'HEADQUARTERS' ? 'ส่วนกลาง (HQ)' : 'สาขา (Store)'}
                          </Tag>
                          <div className="font-medium text-slate-700 text-xs mt-1">{r.assignedAe.fullNameTh}</div>
                          <div className="text-xxs text-slate-400">{r.assignedAe.roleTitleTh}</div>
                        </div>
                      ),
                    },
                    {
                      title: 'จุดส่งของที่ปักหมุด (Sites)',
                      key: 'sites',
                      render: (_, r) => (
                        <div>
                          {r.deliverySites.map(s => (
                            <div key={s.siteId} className="text-xs flex items-center gap-1 mb-1">
                              <EnvironmentOutlined className="text-red-500" />
                              <span>{s.siteName}</span>
                              <Tag color="cyan" className="text-xxs ml-1">
                                {s.zoneCode}
                              </Tag>
                            </div>
                          ))}
                        </div>
                      ),
                    },
                    {
                      title: 'วงเงินที่อนุมัติ (Credit Limit)',
                      key: 'credit',
                      render: (_, r) => (
                        <div className="text-right">
                          <div className="font-bold text-slate-800">
                            {Number(r.creditProfile.approvedCreditLimit).toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            THB
                          </div>
                          <div className="text-xs text-slate-400">Term: {r.creditProfile.creditTermDays} วัน</div>
                        </div>
                      ),
                    },
                    {
                      title: 'สถานะ',
                      dataIndex: 'status',
                      key: 'status',
                      render: (st: EntityStatus) => {
                        const map: Record<string, { color: string; label: string }> = {
                          ACTIVE: { color: 'green', label: 'พร้อมใช้งาน (ACTIVE)' },
                          PENDING_APPROVAL: { color: 'orange', label: 'รออนุมัติวงเงิน' },
                          REJECTED: { color: 'red', label: 'ปฏิเสธวงเงิน' },
                        };
                        return <Tag color={map[st]?.color || 'default'}>{map[st]?.label || st}</Tag>;
                      },
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'credit_desk',
            label: (
              <span className="flex items-center gap-1.5 font-medium">
                <SafetyCertificateOutlined />
                3. Credit Maker-Checker Review Desk (
                {creditApps.filter(a => a.status === 'PENDING').length} รอดำเนินการ)
              </span>
            ),
            children: (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm font-semibold text-slate-700">
                    รายการคำขออนุมัติวงเงินสินเชื่อลูกค้ารายใหม่ (Dual-Control Workflow)
                  </div>
                  <Tag color="purple">Checker: {checkerNameTh}</Tag>
                </div>

                <Table
                  dataSource={creditApps}
                  rowKey="applicationId"
                  pagination={{ pageSize: 5 }}
                  columns={[
                    {
                      title: 'รหัสคำขอ / ลูกค้า',
                      key: 'app',
                      render: (_, r) => (
                        <div>
                          <div className="font-bold text-slate-800">{r.customerNameTh}</div>
                          <div className="text-xs text-slate-500 font-mono">
                            App ID: {r.applicationId} | Cust: {r.customerCode}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: 'วงเงินที่ขอ / เงื่อนไข',
                      key: 'limit',
                      render: (_, r) => (
                        <div>
                          <div className="font-bold text-slate-800">
                            {Number(r.requestedCreditLimit).toLocaleString('th-TH', {
                              minimumFractionDigits: 2,
                            })}{' '}
                            THB
                          </div>
                          <div className="text-xs text-slate-500">
                            Term: {r.creditTermDays} วัน | ค้ำประกัน: {r.collateralType}
                          </div>
                        </div>
                      ),
                    },
                    {
                      title: 'ผู้สร้างคำขอ (Maker)',
                      dataIndex: 'makerNameTh',
                      key: 'maker',
                      render: (m: string) => <Tag color="blue">{m}</Tag>,
                    },
                    {
                      title: 'สถานะคำขอ',
                      dataIndex: 'status',
                      key: 'status',
                      render: (st: string) => {
                        const map: Record<string, { color: string; label: string }> = {
                          PENDING: { color: 'orange', label: 'รอ Checker อนุมัติ' },
                          APPROVED: { color: 'green', label: 'อนุมัติแล้ว' },
                          REJECTED: { color: 'red', label: 'ปฏิเสธ' },
                        };
                        return <Tag color={map[st]?.color || 'default'}>{map[st]?.label || st}</Tag>;
                      },
                    },
                    {
                      title: 'การดำเนินการ (Checker Action)',
                      key: 'actions',
                      render: (_, r) => (
                        <div>
                          {r.status === 'PENDING' ? (
                            <Button
                              type="primary"
                              size="small"
                              className="bg-purple-600 hover:bg-purple-700"
                              onClick={() => {
                                setSelectedAppForReview(r);
                                setReviewModalVisible(true);
                              }}
                            >
                              ตรวจพิจารณาอนุมัติ
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              ตรวจโดย: {r.checkerNameTh || 'N/A'}
                            </span>
                          )}
                        </div>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'ae_directory',
            label: (
              <span className="flex items-center gap-1.5 font-medium">
                <TeamOutlined />
                4. Sales Executive Directory ({salesExecutives.length})
              </span>
            ),
            children: (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <Row gutter={[16, 16]}>
                  {salesExecutives.map(ae => (
                    <Col span={8} key={ae.aeCode}>
                      <Card className="border border-slate-200 shadow-none hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <Tag color={ae.organizationType === 'HEADQUARTERS' ? 'blue' : 'orange'}>
                            {ae.organizationType === 'HEADQUARTERS' ? 'ส่วนกลาง (HQ)' : `สาขา ${ae.assignedBranchCode}`}
                          </Tag>
                          <Tag color="volcano">DOFA: {ae.maxDiscountPct.toFixed(2)}%</Tag>
                        </div>
                        <div className="font-bold text-slate-800 text-base">{ae.fullNameTh}</div>
                        <div className="text-xs text-slate-500 font-mono mb-2">
                          AE Code: {ae.aeCode} | Emp ID: {ae.employeeId}
                        </div>
                        <div className="text-xs text-slate-600 mb-3">{ae.roleTitleTh}</div>
                        <Divider className="my-2" />
                        <div className="text-xxs text-slate-400 flex justify-between">
                          <span>Tel: {ae.phone}</span>
                          <span>Email: {ae.email}</span>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            ),
          },
        ]}
      />

      {/* Review Modal */}
      <Modal
        title="พิจารณาอนุมัติวงเงินสินเชื่อ (Credit Facility Review)"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
      >
        {selectedAppForReview && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
              <div className="font-bold text-slate-800 mb-1">{selectedAppForReview.customerNameTh}</div>
              <div className="text-slate-500">รหัสลูกค้า: {selectedAppForReview.customerCode}</div>
              <div className="text-slate-500">
                วงเงินที่ขอ:{' '}
                <span className="font-bold text-blue-600">
                  {Number(selectedAppForReview.requestedCreditLimit).toLocaleString()} บาท
                </span>{' '}
                (เครดิตเทอม {selectedAppForReview.creditTermDays} วัน)
              </div>
              <div className="text-slate-500">
                ผู้จัดทำ (Maker): <Tag color="blue">{selectedAppForReview.makerNameTh}</Tag>
              </div>
            </div>

            <div className="text-xs">
              <div className="font-semibold text-slate-700 mb-1">ผู้ตรวจพิจารณา (Checker Role):</div>
              <Select
                value={checkerUserId}
                className="w-full"
                onChange={val => {
                  setCheckerUserId(val);
                  setCheckerNameTh(
                    val === 'USR-CREDIT-MGR-01'
                      ? 'นางประภาศรี รักษาการ (Credit Manager)'
                      : 'นายวรพจน์ การเงินยิ่ง (Finance Director)',
                  );
                }}
                options={[
                  { label: 'นางประภาศรี รักษาการ (Credit Manager)', value: 'USR-CREDIT-MGR-01' },
                  { label: 'นายวรพจน์ การเงินยิ่ง (Finance Director)', value: 'USR-FIN-DIR-01' },
                ]}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button danger onClick={() => handleReviewAction('REJECT')}>
                ปฏิเสธคำขอ (Reject)
              </Button>
              <Button
                type="primary"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleReviewAction('APPROVE')}
              >
                อนุมัติวงเงิน (Approve Credit)
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
