import { TaxService } from '../src/modules/tax/tax.service';

describe('TaxService (Epic E10 - Statutory Tax Compliance)', () => {
  let service: TaxService;

  beforeEach(() => {
    service = new TaxService();
  });

  it('should generate continuous gapless sequential invoice numbers', () => {
    const d1 = new Date('2026-09-09T00:00:00Z');
    const inv1 = service.generateGaplessInvoiceNumber('00001', d1);
    const inv2 = service.generateGaplessInvoiceNumber('00001', d1);

    expect(inv1).toBe('INV-00001-202609-000001');
    expect(inv2).toBe('INV-00001-202609-000002');
  });

  it('should correctly transcribe currency amounts into Thai Baht Text', () => {
    expect(service.convertThaiBahtText('38132.13')).toBe('สามหมื่นแปดพันหนึ่งร้อยสามสิบสองบาทสิบสามสตางค์');
    expect(service.convertThaiBahtText('500000.00')).toBe('ห้าแสนบาทถ้วน');
    expect(service.convertThaiBahtText('0.00')).toBe('ศูนย์บาทถ้วน');
  });
});
