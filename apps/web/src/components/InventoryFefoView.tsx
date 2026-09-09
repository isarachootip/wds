import React, { useState } from 'react';
import { Card, Table, InputNumber, Tag, Button, Row, Col, Progress } from 'antd';
import Decimal from 'decimal.js';

interface LotData {
  lotId: string;
  location: string;
  manufactureDate: string;
  expiryDate: string;
  qtyAvailable: number;
  isFullPallet: boolean;
  palletSize: number;
}

export const InventoryFefoView: React.FC = () => {
  const [requestedQty, setRequestedQty] = useState<number>(120);

  const initialLots: LotData[] = [
    {
      lotId: 'LOT-202607-001',
      location: 'BAY-A1 (Broken Pallet Rack)',
      manufactureDate: '2026-07-01',
      expiryDate: '2026-10-01',
      qtyAvailable: 35,
      isFullPallet: false,
      palletSize: 35,
    },
    {
      lotId: 'LOT-202607-002',
      location: 'BAY-A2 (Bulk Pallet Rack)',
      manufactureDate: '2026-07-05',
      expiryDate: '2026-10-05',
      qtyAvailable: 200,
      isFullPallet: true,
      palletSize: 50,
    },
    {
      lotId: 'LOT-202608-001',
      location: 'BAY-A3 (Bulk Pallet Rack)',
      manufactureDate: '2026-08-01',
      expiryDate: '2026-11-01',
      qtyAvailable: 500,
      isFullPallet: true,
      palletSize: 50,
    },
  ];

  // FEFO Allocation Algorithm V2: Expiry ascending, odd broken lots first
  let remaining = new Decimal(requestedQty || 0);
  const allocatedLots = initialLots.map(lot => {
    let allocated = 0;
    if (remaining.greaterThan(0)) {
      const avail = new Decimal(lot.qtyAvailable);
      const alloc = Decimal.min(remaining, avail);
      allocated = alloc.toNumber();
      remaining = remaining.minus(alloc);
    }
    return {
      ...lot,
      allocated,
    };
  });

  const totalAllocated = requestedQty - remaining.toNumber();
  const isFulfilled = remaining.isZero();

  const columns = [
    {
      title: 'Lot ID',
      dataIndex: 'lotId',
      render: (id: string) => <span className="font-mono font-bold text-slate-800">{id}</span>,
    },
    {
      title: 'Location Rack',
      dataIndex: 'location',
    },
    {
      title: 'Expiry Date (FEFO)',
      dataIndex: 'expiryDate',
      render: (date: string) => (
        <Tag color="orange" className="font-mono">
          {date}
        </Tag>
      ),
    },
    {
      title: 'Pallet Status',
      dataIndex: 'isFullPallet',
      render: (isFull: boolean) =>
        isFull ? (
          <Tag color="blue">Full Pallet (50 ถุง)</Tag>
        ) : (
          <Tag color="purple">Odd Broken Pallet (เศษพาเลท)</Tag>
        ),
    },
    {
      title: 'คงเหลือ (Avail)',
      dataIndex: 'qtyAvailable',
      render: (qty: number) => <span className="font-mono">{qty} ถุง</span>,
    },
    {
      title: 'จัดสรรตาม FEFO V2 (Allocated)',
      dataIndex: 'allocated',
      render: (alloc: number) => (
        <span className={`font-mono font-bold ${alloc > 0 ? 'text-green-600' : 'text-slate-400'}`}>
          {alloc > 0 ? `+${alloc} ถุง` : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">FEFO Cement Lot Allocation V2 (Epic E07)</h2>
          <p className="text-xs text-slate-500">
            อัลกอริทึมจัดสรรสต๊อกปูนซีเมนต์แบบวันหมดอายุก่อน (First-Expired, First-Out) และตัดเศษพาเลทก่อนพาเลทเต็มเพื่อป้องกัน Aging Trap
          </p>
        </div>
        <Tag color="green">Req ID: [FR-IN-001] to [FR-IN-021]</Tag>
      </div>

      <Card className="shadow-sm">
        <Row gutter={16} className="items-center mb-6">
          <Col span={8}>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              จำนวนปูนที่ลูกค้าสั่งซื้อ (Requested Quantity)
            </label>
            <InputNumber
              min={1}
              max={1000}
              value={requestedQty}
              onChange={v => setRequestedQty(v || 1)}
              className="w-full text-base font-bold"
              addonAfter="ถุง"
            />
          </Col>
          <Col span={10}>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-700">FEFO Allocation Rules:</div>
              <div>1. ตัดเศษพาเลท (Odd Broken Pallet) ของ Lot ที่จะหมดอายุก่อน</div>
              <div>2. จัดสรร Full Pallet (50 ถุง) เพื่อความรวดเร็วในการโหลดสินค้า</div>
            </div>
          </Col>
          <Col span={6}>
            <div className="text-right">
              <div className="text-xs text-slate-500">สถานะการจัดสรร</div>
              <div className="text-lg font-bold text-slate-800">
                {totalAllocated} / {requestedQty} ถุง
              </div>
              <Progress
                percent={Math.round((totalAllocated / requestedQty) * 100)}
                status={isFulfilled ? 'success' : 'active'}
                size="small"
              />
            </div>
          </Col>
        </Row>

        <Table
          dataSource={allocatedLots}
          columns={columns}
          rowKey="lotId"
          pagination={false}
          className="border border-slate-200 rounded-lg overflow-hidden"
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button type="primary" className="bg-red-600">
            ยืนยันการจองสต๊อกและสร้างใบจัดของ (Commit FEFO Reservation)
          </Button>
        </div>
      </Card>
    </div>
  );
};
