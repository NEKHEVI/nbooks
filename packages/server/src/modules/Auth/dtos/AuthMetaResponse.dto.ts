import { ApiProperty } from '@nestjs/swagger';

export class AuthMetaResponseDto {
  @ApiProperty({ description: 'Whether signup is disabled' })
  signupDisabled: boolean;

  @ApiProperty({ description: 'Whether sign-in with Google is enabled' })
  googleEnabled: boolean;

  @ApiProperty({
    description: 'Demo mode: any credentials open the demo account',
    required: false,
  })
  demoAnyLogin?: boolean;
}
