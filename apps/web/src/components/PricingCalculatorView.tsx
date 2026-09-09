import React, { useState } from 'react';
import { Card, InputNumber, Select, Alert, Tag, Divider, Row, Col, Statistic, Button } from 'antd';
import Decimal from 'decimal.js';

export const PricingCalculatorView: React.FC = () => {
  const [sku, setSku] = useState('SKU-CEM-001');
  const [quantity, setQuantity] = useState<number>(250);
  const [truckType, setTruckType] = useState('SIX_WHEEL_6W');
  const [manualOverridePrice, setManualOverridePrice] = useState<number | null>(null);

  // Demo Product Data
  const basePrice = new Decimal(sku === 'SKU-CEM-001' ? '145.0000' : '160.0000');
  const costFloor = new Decimal(sku === 'SKU-CEM-001' ? '120.0000' : '135.0000');
  const qty = new Decimal(quantity || 0);

  // Volume Break
  let volumeDiscountPct = new Decimal(0);
  if (qty.greaterThanOrEqualTo(500)) volumeDiscountPct = new Decimal(8);
  else if (qty.greaterThanOrEqualTo(200)) volumeDiscountPct = new Decimal(5);
  else if (qty.greaterThanOrEqualTo(50)) volumeDiscountPct = new Decimal(3);

  let effectiveUnitPrice = basePrice.times(new Decimal(1).minus(volumeDiscountPct.dividedBy(100)));

  if (manualOverridePrice !== null && manualOverridePrice > 0) {
    effectiveUnitPrice = new Decimal(manualOverridePrice);
  }

  const isFloorViolated = effectiveUnitPrice.lessThan(costFloor);
  const extendedAmount = effectiveUnitPrice.times(qty);
  const totalStandardAmount = basePrice.times(qty);
  const discountAmount = totalStandardAmount.minus(extendedAmount);

  // Freight
  const freightFees: Record<string, string> = {
    PICKUP_4W: '500.0000',
    SIX_WHEEL_6W: '1200.0000',
    TEN_WHEEL_10W: '2500.0000',
    TRAILER_18W: '4000.0000',
  };
  const freightAmount = new Decimal(freightFees[truckType] || '1200.0000');

  const taxableAmount = extendedAmount.plus(freightAmount);
  const vatAmount = taxableAmount.times('0.07').toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  const grandTotal = taxableAmount.plus(vatAmount);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dynamic Pricing & Floor Price Guard (Epic E02)</h2>
          <p className="text-xs text-slate-500">
            ระบบคำนวณราคาขายส่งขั้นบันได, ค่าขนส่งตามโซน และระบบป้องกันการขายต่ำกว่าทุน (Cost Floor Guard)
          </p>
        </div>
        <Tag color="blue">Req ID: [FR-PR-001] to [FR-PR-012]</Tag>
      </div>

      {isFloorViolated && (
        <Alert
          type="error"
          showIcon
          message="FLOOR PRICE VIOLATION: ราคาขายต่ำกว่าเกณฑ์ควบคุมต้นทุน"
          description={`ราคาต่อหน่วย ${effectiveUnitPrice.toFixed(4)} บาท ต่ำกว่าราคา Floor Price (${costFloor.toFixed(4)} บาท) ออเดอร์นี้จะต้องถูกส่งขออนุมัติตามสายการบังคับบัญชา (Discount Authority Workflow) ก่อนออกใบสั่งซื้อ`}
        />
      )}

      <Row gutter={16}>
        <Col span={14}>
          <Card title="Order Parameters & Configuration" className="shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">เลือกสินค้า (Catalog SKU)</label>
                <Select
                  value={sku}
                  onChange={setSku}
                  className="w-full"
                  options={[
                    { value: 'SKU-CEM-001', label: 'SKU-CEM-001: ปูนซีเมนต์ปอร์ตแลนด์ ตราเสือ 50 กก. (Base 145 / Floor 120)' },
                    { value: 'SKU-CEM-002', label: 'SKU-CEM-002: ปูนซีเมนต์ปอร์ตแลนด์ ตราช้าง 50 กก. (Base 160 / Floor 135)' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">จำนวนสั่งซื้อ (ถุง / Bags)</label>
                <InputNumber
                  min={1}
                  max={10000}
                  value={quantity}
                  onChange={v => setQuantity(v || 1)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ประเภทรถจัดส่ง (Freight Truck)</label>
                <Select
                  value={truckType}
                  onChange={setTruckType}
                  className="w-full"
                  options={[
                    { value: 'PICKUP_4W', label: 'รถกระบะ 4 ล้อ (Zone BKK_EAST - 500 บาท)' },
                    { value: 'SIX_WHEEL_6W', label: 'รถ 6 ล้อ (Zone BKK_EAST - 1,200 บาท)' },
                    { value: 'TEN_WHEEL_10W', label: 'รถ 10 ล้อ (Zone BKK_EAST - 2,500 บาท)' },
                    { value: 'TRAILER_18W', label: 'รถเทรลเลอร์ 18 ล้อ (Zone BKK_EAST - 4,000 บาท)' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Manual Price Override (Optional)</label>
                <InputNumber
                  placeholder="ใส่ราคาพิเศษต่อหน่วย"
                  value={manualOverridePrice}
                  onChange={setManualOverridePrice}
                  className="w-full"
                />
              </div>
            </div>

            <Divider />

            <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Base Retail Price:</span>
                <span className="font-mono">{basePrice.toFixed(4)} บาท</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Volume Break Applied:</span>
                <span className="font-mono font-semibold text-green-600">-{volumeDiscountPct.toFixed(2)}% ({quantity} ถุง)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cost Floor Guard:</span>
                <span className="font-mono text-slate-700">{costFloor.toFixed(4)} บาท</span>
              </div>
              <div className="flex justify-between font-bold pt-2 border-t border-slate-200">
                <span>Effective Unit Price:</span>
                <span className={`font-mono text-base ${isFloorViolated ? 'text-red-600 font-black' : 'text-blue-700'}`}>
                  {effectiveUnitPrice.toFixed(4)} บาท / ถุง
                </span>
              </div>
            </div>
          </Card>
        </Col>

        <Col span={10}>
          <Card title="Pricing Summary (Decimal Precision)" className="shadow-sm bg-white">
            <div className="space-y-4">
              <Statistic
                title="Grand Total (รวมภาษีมูลค่าเพิ่ม 7%)"
                value={grandTotal.toNumber()}
                precision={2}
                suffix="บาท"
                valueStyle={{ color: '#D92D20', fontWeight: 'bold' }}
              />

              <div className="space-y-2 text-sm pt-4 border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">มูลค่าสินค้า (ก่อนลด):</span>
                  <span className="font-mono">{totalStandardAmount.toFixed(4)} ฿</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>ส่วนลดรวม:</span>
                  <span className="font-mono">-{discountAmount.toFixed(4)} ฿</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ค่าขนส่งตามโซน:</span>
                  <span className="font-mono">{freightAmount.toFixed(4)} ฿</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-800">
                  <span>ฐานภาษี (Taxable Amount):</span>
                  <span className="font-mono">{taxableAmount.toFixed(4)} ฿</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>ภาษีมูลค่าเพิ่ม VAT 7%:</span>
                  <span className="font-mono">{vatAmount.toFixed(2)} ฿</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                <Button type="primary" danger block>
                  บันทึกราคาลงใบเสนอราคา (Quotation)
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
