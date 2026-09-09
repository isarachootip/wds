import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Select, InputNumber, Alert, Progress, Tag, Button } from 'antd';
import Decimal from 'decimal.js';

export const CreditDeskView: React.FC = () => {
  const [selectedCust, setSelectedCust] = useState('CUST-B2B-001');
  const [orderAmount, setOrderAmount] = useState<number>(350000);

  const customerData: Record<string, any> = {
    'CUST-B2B-001': {
      code: 'CUST-B2B-001',
      name: 'บริษัท อิตาเลียน-ไทย คอนสตรัคชั่น จำกัด (มหาชน)',
      creditLimit: 5000000,
      arBalance: 1200000,
      pendingOrders: 350000,
      unmaturedPdc: 500000,
      overdue30Days: 0,
      isBlocked: false,
    },
    'CUST-B2B-002': {
      code: 'CUST-B2B-002',
      name: 'ห้างหุ้นส่วนจำกัด บางนา โฮม บิลเดอร์',
      creditLimit: 500000,
      arBalance: 480000,
      pendingOrders: 50000,
      unmaturedPdc: 0,
      overdue30Days: 25000,
      isBlocked: true,
      reason: 'มีหนี้ค้างชำระเกิน 30 วัน (Overdue > 30 Days)',
    },
  };

  const cust = customerData[selectedCust];
  const limit = new Decimal(cust.creditLimit);
  const ar = new Decimal(cust.arBalance);
  const pending = new Decimal(cust.pendingOrders);
  const currentExposure = ar.plus(pending);

  const newOrder = new Decimal(orderAmount || 0);
  const projectedExposure = currentExposure.plus(newOrder);
  const projectedAvailable = limit.minus(projectedExposure);

  const isOverLimit = projectedExposure.greaterThan(limit);
  const isBlocked = cust.isBlocked || isOverLimit;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Credit & PDC Exposure Control Desk (Epic E03)</h2>
          <p className="text-xs text-slate-500">
            ระบบตรวจสอบวงเงินสินเชื่อ, การค้างชำระเกิน 30 วัน และบริหารจัดการเช็คลงวันที่ล่วงหน้า (Post-Dated Cheques)
          </p>
        </div>
        <Tag color="purple">Req ID: [FR-CR-001] to [FR-CR-012]</Tag>
      </div>

      <Card className="shadow-sm">
        <Row gutter={16} className="mb-4">
          <Col span={12}>
            <label className="block text-xs font-semibold text-slate-600 mb-1">เลือกลูกค้าโครงการ B2B</label>
            <Select
              value={selectedCust}
              onChange={setSelectedCust}
              className="w-full"
              options={[
                { value: 'CUST-B2B-001', label: 'CUST-B2B-001: บมจ. อิตาเลียน-ไทย คอนสตรัคชั่น (วงเงิน 5,000,000 บาท)' },
                { value: 'CUST-B2B-002', label: 'CUST-B2B-002: หจก. บางนา โฮม บิลเดอร์ (วงเงิน 500,000 บาท / ติด Block)' },
              ]}
            />
          </Col>
          <Col span={12}>
            <label className="block text-xs font-semibold text-slate-600 mb-1">มูลค่าคำสั่งซื้อใหม่ (Order Total)</label>
            <InputNumber
              value={orderAmount}
              onChange={v => setOrderAmount(v || 0)}
              className="w-full font-bold"
              formatter={value => `฿ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Col>
        </Row>

        {isBlocked && (
          <Alert
            type="error"
            showIcon
            className="mb-4"
            message="CREDIT HARD-STOP: คำสั่งซื้อถูกระงับการออกใบส่งของ"
            description={
              cust.isBlocked
                ? `ลูกค้าติดระงับสินเชื่อเนื่องจาก: ${cust.reason}`
                : `วงเงินคงเหลือไม่เพียงพอ (ต้องการวงเงินเพิ่ม ${projectedExposure.minus(limit).toFixed(2)} บาท) ต้องขออนุมัติจากฝ่ายสินเชื่อสำนักงานใหญ่ (Credit Director)`
            }
          />
        )}

        <Row gutter={16} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <Col span={6}>
            <Statistic
              title="Approved Credit Limit"
              value={cust.creditLimit}
              precision={2}
              suffix="฿"
              valueStyle={{ color: '#175CD3' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Current AR Balance"
              value={cust.arBalance}
              precision={2}
              suffix="฿"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Unmatured PDC (เช็คล่วงหน้า)"
              value={cust.unmaturedPdc}
              precision={2}
              suffix="฿"
              valueStyle={{ color: '#039855' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Projected Available Credit"
              value={projectedAvailable.toNumber()}
              precision={2}
              suffix="฿"
              valueStyle={{ color: projectedAvailable.isNegative() ? '#D92D20' : '#027A48', fontWeight: 'bold' }}
            />
          </Col>
        </Row>

        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>อัตราการใช้วงเงิน (Credit Utilization Ratio)</span>
            <span className="font-bold">
              {Math.min(100, Math.round((projectedExposure.toNumber() / cust.creditLimit) * 100))}%
            </span>
          </div>
          <Progress
            percent={Math.round((projectedExposure.toNumber() / cust.creditLimit) * 100)}
            status={isOverLimit ? 'exception' : 'active'}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button disabled={isBlocked} type="primary" className="bg-blue-600">
            อนุมัติการตัดวงเงินและส่งต่องานคลัง (Release to Picking)
          </Button>
          {isBlocked && (
            <Button danger type="dashed">
              ส่งคำขอปลดล็อคสินเชื่อชั่วคราว (Request Temporary Credit Override)
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
