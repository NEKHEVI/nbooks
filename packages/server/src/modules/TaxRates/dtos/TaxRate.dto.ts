import { ToNumber } from '@/common/decorators/Validators';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsBoolean,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CommandTaxRateDto {
  /**
   * Tax rate name.
   */
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The name of the tax rate.', example: 'VAT' })
  name: string;

  /**
   * Tax rate code.
   */
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'The code of the tax rate.', example: 'VAT' })
  code: string;

  /**
   * Tax rate percentage.
   */
  @IsNumber()
  @IsNotEmpty()
  @ToNumber()
  @ApiProperty({
    description: 'The rate of the tax rate.',
    example: 10,
  })
  rate: number;

  /**
   * Tax rate description.
   */
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'The description of the tax rate.',
    example: 'VAT',
  })
  description?: string;

  /**
   * Whether the tax is non-recoverable.
   */
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value ?? false)
  @ApiProperty({
    description: 'Whether the tax is non-recoverable.',
    example: false,
  })
  isNonRecoverable?: boolean;

  /**
   * Whether the tax is compound.
   */
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value ?? false)
  @ApiProperty({
    description: 'Whether the tax is compound.',
    example: false,
  })
  isCompound?: boolean;

  /**
   * Whether the tax rate is active.
   */
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value ?? false)
  @ApiProperty({
    description: 'Whether the tax rate is active.',
    example: false,
  })
  active?: boolean;

  /**
   * NBooks : le taux est un groupe de taxes (ex. TPS + TVQ).
   */
  @IsBoolean()
  @IsOptional()
  @ApiProperty({ description: 'Whether the tax is a group of taxes.' })
  isGroup?: boolean;

  /**
   * NBooks : identifiants des taux composants du groupe.
   */
  @IsArray()
  @IsOptional()
  @ApiProperty({ description: 'Component tax rate ids of the group.' })
  componentIds?: number[];

  /**
   * NBooks : compte du grand livre des taxes perçues (ventes).
   */
  @IsInt()
  @IsOptional()
  @ApiProperty({ description: 'Sales tax account id.' })
  salesAccountId?: number;

  /**
   * NBooks : compte du grand livre des taxes payées (achats).
   */
  @IsInt()
  @IsOptional()
  @ApiProperty({ description: 'Purchase tax account id.' })
  purchaseAccountId?: number;

  /**
   * NBooks : numéro d'inscription (TPS ou TVQ).
   */
  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Tax registration number.' })
  registrationNo?: string;
}

export class CreateTaxRateDto extends CommandTaxRateDto {}
export class EditTaxRateDto extends CommandTaxRateDto {}
