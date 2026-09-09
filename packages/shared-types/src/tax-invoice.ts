import { MoneyString, QuantityString } from './common.js';

export interface TaxInvoiceItem {
  lineNumber: number;
  skuCode: string;
  itemDescriptionTh: string;
  quantity: QuantityString;
  uomCode: string;
  unitPrice: MoneyString;
  discountAmount: MoneyString;
  netTaxableAmount: MoneyString;
  vatAmount: MoneyString;
}

export interface TaxInvoice {
  invoiceNumber: string; // e.g. "INV-00001-202609-000001"
  orderId: string;
  branchCode: string;
  sellerTaxId: string;
  sellerBranchCode: string;
  buyerCustomerCode: string;
  buyerTaxId: string;
  buyerBranchCode: string;
  buyerNameTh: string;
  buyerAddressTh: string;
  documentDate: string; // YYYY-MM-DD
  subtotalAmount: MoneyString;
  discountAmount: MoneyString;
  taxableAmount: MoneyString;
  vatRatePercent: MoneyString;
  vatAmount: MoneyString;
  grandTotalAmount: MoneyString;
  grandTotalThaiBahtText: string;
  isPosted: boolean;
  postedAt?: string;
  items: TaxInvoiceItem[];
}
