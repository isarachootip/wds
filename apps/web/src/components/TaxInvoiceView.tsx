import React from 'react';
import { Card, Table, Tag, Button, Row, Col, Divider } from 'antd';
import { PrinterOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';

export const TaxInvoiceView: React.FC = () => {
  const isPosted = true;

  const invoiceData = {
    invoiceNo: 'INV-00001-202609-000001',
    docDate: '2026-09-09',
    orderId: 'ORD-202609-88001',
    seller: {
      nameTh: 'บริษัท ซีอาร์ซี ไทวัสดุ จำกัด (มหาชน)',
      taxId: '0107553000107',
      branch: 'สาขาที่ 00001 (สาขาบางนา)',
      address: '888 หมู่ 5 ถ.บางนา-ตราด ต.บางแก้ว อ.บางพลี จ.สมุทรปราการ 10540',
    },
    buyer: {
      nameTh: 'บริษัท อิตาเลียน-ไทย คอนสตรัคชั่น จำกัด (มหาชน)',
      taxId: '0107537000959',
      branch: 'สำนักงานใหญ่ (00000)',
      address: '2034/132-161 อาคารอิตัลไทย ทาวเวอร์ ถ.เพชรบุรีตัดใหม่ แขวงบางกะปิ เขตห้วยขวาง กทม. 10310',
    },
    items: [
      {
        line: 1,
        sku: 'SKU-CEM-001',
        desc: 'ปูนซีเมนต์ปอร์ตแลนด์ ตราเสือ ปูนถุง 50 กก.',
        qty: '250.0000',
        uom: 'BAG',
        unitPrice: '137.7500',
        amount: '34437.5000',
      },
      {
        line: 2,
        sku: 'FRT-BKK-EAST',
        desc: 'ค่าบริการขนส่งสินค้าตามโซน (รถ 6 ล้อ)',
        qty: '1.0000',
        uom: 'TRIP',
        unitPrice: '1200.0000',
        amount: '1200.0000',
      },
    ],
    subtotal: '35637.5000',
    vatRate: '7.0000%',
    vatAmount: '2494.63',
    grandTotal: '38132.13',
    bahtText: 'สามหมื่นแปดพันหนึ่งร้อยสามสิบสองบาทสิบสามสตางค์',
  };

  const columns = [
    { title: 'ลำดับ', dataIndex: 'line', width: 60 },
    { title: 'รหัสสินค้า', dataIndex: 'sku', width: 140, render: (s: string) => <span className="font-mono font-semibold">{s}</span> },
    { title: 'รายการสินค้า / บริการ', dataIndex: 'desc' },
    { title: 'จำนวน', dataIndex: 'qty', width: 100, render: (q: string) => <span className="font-mono">{q}</span> },
    { title: 'หน่วย', dataIndex: 'uom', width: 80 },
    { title: 'ราคา/หน่วย (บาท)', dataIndex: 'unitPrice', width: 140, render: (p: string) => <span className="font-mono text-right block">{p}</span> },
    { title: 'จำนวนเงิน (บาท)', dataIndex: 'amount', width: 140, render: (a: string) => <span className="font-mono text-right font-bold block">{a}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gapless Tax Invoice & Baht Text (Epic E10)</h2>
          <p className="text-xs text-slate-500">
            ใบกำกับภาษีเต็มรูปแบบตามมาตรา 86/4 แห่งประมวลรัษฎากร พร้อมระบบป้องกันการแก้ไขหลัง Post (Statutory Immutability)
          </p>
        </div>
        <Tag color="cyan">Req ID: [FR-FI-001] to [FR-FI-016]</Tag>
      </div>

      <Card className="shadow-md bg-white border border-slate-300">
        <div className="flex justify-between items-start border-b border-slate-200 pb-4 mb-4">
          <div>
            <div className="text-lg font-black text-red-700">บริษัท ซีอาร์ซี ไทวัสดุ จำกัด (มหาชน)</div>
            <div className="text-xs text-slate-600">{invoiceData.seller.address}</div>
            <div className="text-xs text-slate-600 font-mono mt-1">
              เลขประจำตัวผู้เสียภาษีอากร: <strong>{invoiceData.seller.taxId}</strong> ({invoiceData.seller.branch})
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-slate-800">ใบกำกับภาษี / ใบเสร็จรับเงิน</div>
            <div className="text-xs text-slate-500">TAX INVOICE / RECEIPT</div>
            <div className="text-sm font-mono font-bold text-red-600 mt-1">{invoiceData.invoiceNo}</div>
            <div className="text-xs text-slate-500">วันที่: {invoiceData.docDate}</div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs mb-4">
          <div className="font-bold text-slate-700 mb-1">ข้อมูลผู้ซื้อ / ข้อมูลลูกค้า:</div>
          <div className="font-semibold text-sm text-slate-800">{invoiceData.buyer.nameTh}</div>
          <div className="text-slate-600">{invoiceData.buyer.address}</div>
          <div className="font-mono mt-1">
            เลขประจำตัวผู้เสียภาษีอากร: <strong>{invoiceData.buyer.taxId}</strong> ({invoiceData.buyer.branch})
          </div>
        </div>

        <Table
          dataSource={invoiceData.items}
          columns={columns}
          pagination={false}
          rowKey="line"
          className="border border-slate-200 rounded-lg overflow-hidden mb-4"
        />

        <Row gutter={16} className="items-center">
          <Col span={14}>
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-xs">
              <div className="text-slate-500 mb-1">จำนวนเงินตัวอักษร (Thai Baht Text):</div>
              <div className="font-bold text-amber-900 text-sm">({invoiceData.bahtText})</div>
            </div>
            {isPosted && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <LockOutlined className="text-red-500" />
                <span>เอกสารถูกประทับตรารับรองแล้ว — ห้ามแก้ไขหรือลบตามกฎหมาย (ต้องออกใบลดหนี้ ม.86/10 หากมีการปรับปรุง)</span>
              </div>
            )}
          </Col>
          <Col span={10}>
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>มูลค่าสินค้าและบริการ:</span>
                <span className="font-mono font-semibold">{invoiceData.subtotal} ฿</span>
              </div>
              <div className="flex justify-between">
                <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
                <span className="font-mono font-semibold">{invoiceData.vatAmount} ฿</span>
              </div>
              <div className="flex justify-between text-base font-bold text-red-700 pt-2 border-t border-slate-300">
                <span>จำนวนเงินรวมทั้งสิ้น:</span>
                <span className="font-mono">{invoiceData.grandTotal} บาท</span>
              </div>
            </div>
          </Col>
        </Row>

        <Divider />

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-xs text-green-700 font-semibold">
            <CheckCircleOutlined />
            <span>Gapless Sequence Number Verified (No Sequence Leaks)</span>
          </div>
          <div className="flex gap-2">
            <Button icon={<PrinterOutlined />}>พิมพ์ใบกำกับภาษี (PDF/A-3)</Button>
            <Button type="primary" className="bg-red-600">
              ส่งออก e-Tax Invoice (XML & Signed PDF)
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
