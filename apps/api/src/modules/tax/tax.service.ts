import { Injectable } from '@nestjs/common';
import Decimal from 'decimal.js';
import { TaxInvoice, TaxInvoiceItem } from '@wds/shared-types';

@Injectable()
export class TaxService {
  private sequenceCounters = new Map<string, number>();

  generateGaplessInvoiceNumber(branchCode: string, documentDate: Date): string {
    const yyyymm = `${documentDate.getUTCFullYear()}${String(documentDate.getUTCMonth() + 1).padStart(2, '0')}`;
    const key = `${branchCode}:${yyyymm}`;
    const nextSeq = (this.sequenceCounters.get(key) || 0) + 1;
    this.sequenceCounters.set(key, nextSeq);

    const seqPadded = String(nextSeq).padStart(6, '0');
    return `INV-${branchCode}-${yyyymm}-${seqPadded}`;
  }

  convertThaiBahtText(amountStr: string): string {
    const dec = new Decimal(amountStr);
    const integerPart = dec.floor().toNumber();
    const satangPart = dec.minus(dec.floor()).times(100).round().toNumber();

    if (dec.isZero()) return 'ศูนย์บาทถ้วน';

    const thaiNumbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const thaiDigits = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

    function numberToThaiText(n: number): string {
      if (n === 0) return '';
      let str = '';
      const digits = String(n).split('').map(Number);
      const len = digits.length;

      for (let i = 0; i < len; i++) {
        const digit = digits[i];
        const pos = len - i - 1;

        if (digit !== 0) {
          if (pos === 0 && digit === 1 && len > 1) {
            str += 'เอ็ด';
          } else if (pos === 1 && digit === 1) {
            str += 'สิบ';
          } else if (pos === 1 && digit === 2) {
            str += 'ยี่สิบ';
          } else {
            str += thaiNumbers[digit] + thaiDigits[pos];
          }
        }
      }
      return str;
    }

    let result = '';
    if (integerPart > 0) {
      result += `${numberToThaiText(integerPart)}บาท`;
    }

    if (satangPart === 0) {
      result += 'ถ้วน';
    } else {
      result += `${numberToThaiText(satangPart)}สตางค์`;
    }

    return result;
  }

  createTaxInvoice(orderData: {
    orderId: string;
    branchCode: string;
    customerCode: string;
    customerNameTh: string;
    taxId: string;
    items: Array<{
      skuCode: string;
      descriptionTh: string;
      quantity: string;
      unitPrice: string;
      uomCode: string;
    }>;
  }): TaxInvoice {
    const docDate = new Date();
    const invoiceNumber = this.generateGaplessInvoiceNumber(orderData.branchCode, docDate);

    let subtotal = new Decimal('0');
    const invoiceItems: TaxInvoiceItem[] = [];

    orderData.items.forEach((item, index) => {
      const qty = new Decimal(item.quantity);
      const unitPrice = new Decimal(item.unitPrice);
      const extended = qty.times(unitPrice);
      const itemVat = extended.times('0.07').toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

      subtotal = subtotal.plus(extended);

      invoiceItems.push({
        lineNumber: index + 1,
        skuCode: item.skuCode,
        itemDescriptionTh: item.descriptionTh,
        quantity: qty.toFixed(4),
        uomCode: item.uomCode,
        unitPrice: unitPrice.toFixed(4),
        discountAmount: '0.0000',
        netTaxableAmount: extended.toFixed(4),
        vatAmount: itemVat.toFixed(4),
      });
    });

    const taxableAmount = subtotal;
    const vatAmount = taxableAmount.times('0.07').toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const grandTotal = taxableAmount.plus(vatAmount);
    const thaiBahtText = this.convertThaiBahtText(grandTotal.toFixed(2));

    return {
      invoiceNumber,
      orderId: orderData.orderId,
      branchCode: orderData.branchCode,
      sellerTaxId: '0107553000107',
      sellerBranchCode: orderData.branchCode,
      buyerCustomerCode: orderData.customerCode,
      buyerTaxId: orderData.taxId,
      buyerBranchCode: '00000',
      buyerNameTh: orderData.customerNameTh,
      buyerAddressTh: 'สำนักงานใหญ่ กรุงเทพฯ',
      documentDate: docDate.toISOString().split('T')[0],
      subtotalAmount: subtotal.toFixed(4),
      discountAmount: '0.0000',
      taxableAmount: taxableAmount.toFixed(4),
      vatRatePercent: '7.0000',
      vatAmount: vatAmount.toFixed(4),
      grandTotalAmount: grandTotal.toFixed(4),
      grandTotalThaiBahtText: thaiBahtText,
      isPosted: true,
      postedAt: docDate.toISOString(),
      items: invoiceItems,
    };
  }
}
