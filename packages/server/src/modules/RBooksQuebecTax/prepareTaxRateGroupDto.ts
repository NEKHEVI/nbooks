import { BadRequestException } from '@nestjs/common';

/**
 * NBooks : prepare les donnees d'un groupe de taxes (ex. TPS + TVQ) avant
 * l'enregistrement : valide les composantes, calcule le taux effectif et
 * serialise la liste des composantes.
 *
 * @param {Function} taxRateModel - proxy du modele TaxRate.
 * @param {any} dto - donnees recues de l'API.
 * @param {any} trx - transaction.
 */
export const prepareTaxRateGroupDto = async (
  taxRateModel: () => any,
  dto: any,
  trx?: any,
) => {
  const { componentIds, ...rest } = dto;

  if (!rest.isGroup) {
    return { ...rest, isGroup: false, componentIds: null };
  }
  const ids: number[] = Array.isArray(componentIds)
    ? componentIds.map(Number)
    : [];
  if (ids.length < 2) {
    throw new BadRequestException({
      errors: [{ type: 'TAX_GROUP_NEEDS_COMPONENTS' }],
    });
  }
  const components = await taxRateModel().query(trx).whereIn('id', ids);
  if (components.length !== ids.length || components.some((c) => c.isGroup)) {
    throw new BadRequestException({
      errors: [{ type: 'TAX_GROUP_INVALID_COMPONENTS' }],
    });
  }
  const rate = components.reduce((sum, c) => sum + Number(c.rate), 0);

  return {
    ...rest,
    isGroup: true,
    rate: Math.round(rate * 100000) / 100000,
    componentIds: JSON.stringify(ids),
  };
};
