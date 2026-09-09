import React from 'react';
import { Layout as AntLayout, Menu, Tag } from 'antd';
import {
  UserAddOutlined,
  CalculatorOutlined,
  DatabaseOutlined,
  CreditCardOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

const { Header, Content, Sider } = AntLayout;

interface LayoutProps {
  selectedTab: string;
  onSelectTab: (key: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ selectedTab, onSelectTab, children }) => {
  const menuItems = [
    {
      key: 'onboarding',
      icon: <UserAddOutlined />,
      label: 'CRM Onboarding & AE Master (E01/E03)',
    },
    {
      key: 'pricing',
      icon: <CalculatorOutlined />,
      label: 'Pricing & Floor Guard Inspector (E02)',
    },
    {
      key: 'inventory',
      icon: <DatabaseOutlined />,
      label: 'FEFO Cement Lot Allocator V2 (E07)',
    },
    {
      key: 'credit',
      icon: <CreditCardOutlined />,
      label: 'Credit & PDC Exposure Desk (E03)',
    },
    {
      key: 'tax',
      icon: <FileTextOutlined />,
      label: 'Gapless Tax Invoice & Baht Text (E10)',
    },
  ];

  return (
    <AntLayout className="min-h-screen">
      <Header className="bg-red-700 text-white flex items-center justify-between px-6 shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white text-red-700 font-black px-2.5 py-1 rounded text-lg tracking-wider">
            THAI WATSADU
          </div>
          <div>
            <div className="font-bold text-base leading-tight">ระบบขายส่งและขายตรง (WDS Enterprise)</div>
            <div className="text-xs text-red-100 opacity-90">Central Retail Corporation (CRC) — Release 1 Baseline</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <Tag color="gold" className="font-semibold">
            <SafetyCertificateOutlined className="mr-1" />
            Zero-Float Standard
          </Tag>
          <Tag color="cyan">VAT 7% Config Active</Tag>
          <div className="text-right">
            <div className="font-medium">สาขาบางนา (00001)</div>
            <div className="text-red-200">Zone: BKK_EAST</div>
          </div>
        </div>
      </Header>
      <AntLayout>
        <Sider width={280} className="bg-white shadow-sm border-r border-slate-200">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-500 font-semibold uppercase tracking-wider">
            Domain Modules Navigation
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedTab]}
            onClick={e => onSelectTab(e.key)}
            items={menuItems}
            className="border-r-0 py-2"
          />
          <div className="p-4 mt-auto border-t border-slate-100 text-xs text-slate-400">
            <div className="font-semibold text-slate-600 mb-1">Architecture Invariants:</div>
            <div>• PostgreSQL 16 ICU Collation</div>
            <div>• Strict UTC / Asia-Bangkok Cut</div>
            <div>• Immutable Tax Invoices</div>
          </div>
        </Sider>
        <Content className="p-6 bg-slate-100 overflow-y-auto">
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
};
