import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { JwtAuthGuard, Public } from './auth.guard';

@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Returns the currently authenticated user. Verifies the bearer
   * token against Supabase Auth on every call. The web/mobile clients
   * call this on app boot to refresh the session.
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the currently authenticated user' })
  async me(@CurrentUser() user: AuthenticatedUser): Promise<AuthenticatedUser> {
    return user;
  }

  /**
   * Client-side logout. Stateless endpoint — the Supabase client drops
   * the refresh token locally. We accept a POST so it is not preflighted
   * through a GET.
   */
  @Post('logout')
  @HttpCode(204)
  @Public()
  @ApiOperation({ summary: 'Stateless logout (client drops the session)' })
  async logout(): Promise<void> {
    return;
  }
}
