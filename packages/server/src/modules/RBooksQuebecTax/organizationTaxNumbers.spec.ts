import {
  appendTaxNumbersToAddress,
  getOrganizationTaxNumberLines,
} from './organizationTaxNumbers';
import { TenantMetadata } from '@/modules/System/models/TenantMetadataModel';

describe('NBooks : numeros de taxe sur les documents', () => {
  it('formate les lignes TPS et TVQ en francais', () => {
    expect(
      getOrganizationTaxNumberLines({
        taxNumber: '123456789 RT0001',
        tvqNumber: '1234567890 TQ0001',
      }),
    ).toEqual(['TPS : 123456789 RT0001', 'TVQ : 1234567890 TQ0001']);
  });

  it('omet un numero absent ou vide', () => {
    expect(
      getOrganizationTaxNumberLines({ taxNumber: '', tvqNumber: null }),
    ).toEqual([]);
    expect(
      getOrganizationTaxNumberLines({ tvqNumber: ' 1234567890 TQ0001 ' }),
    ).toEqual(['TVQ : 1234567890 TQ0001']);
  });

  it('neutralise le HTML dans les numeros', () => {
    expect(
      getOrganizationTaxNumberLines({
        taxNumber: '<script>x</script>123 RT0001',
      }),
    ).toEqual(['TPS : 123 RT0001']);
  });

  it("ajoute les numeros apres l'adresse sans ligne vide", () => {
    const html = '<strong>Acme</strong><br />Canada<br />';
    expect(
      appendTaxNumbersToAddress(html, {
        taxNumber: '123456789 RT0001',
        tvqNumber: '1234567890 TQ0001',
      }),
    ).toBe(
      '<strong>Acme</strong><br />Canada<br />TPS : 123456789 RT0001<br />TVQ : 1234567890 TQ0001',
    );
  });

  it("laisse l'adresse inchangee sans numero", () => {
    const html = '<strong>Acme</strong><br />Canada<br />';
    expect(appendTaxNumbersToAddress(html, {})).toBe(html);
  });

  it('addressTextFormatted du modele inclut les numeros', () => {
    const meta = new TenantMetadata();
    meta.name = 'Acme';
    meta.location = 'CA';
    meta.taxNumber = '123456789 RT0001';
    meta.tvqNumber = '1234567890 TQ0001';
    const text = meta.addressTextFormatted;
    expect(text).toContain('TPS : 123456789 RT0001');
    expect(text).toContain('TVQ : 1234567890 TQ0001');
  });
});
