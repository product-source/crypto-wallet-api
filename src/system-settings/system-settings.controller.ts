import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions.guard';

@Controller('settings')
export class SystemSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Get('public/payment-domain')
  async getPaymentDomain() {
    const value = await this.settingsService.get('payment_link_domain');
    return { domain: value || 'https://paycoinz.com' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin')
  async getAll() {
    return this.settingsService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/:key')
  async get(@Param('key') key: string) {
    const value = await this.settingsService.get(key);
    return { key, value };
  }

  @UseGuards(JwtAuthGuard)
  @Put('admin/:key')
  async set(@Param('key') key: string, @Body('value') value: string) {
    return this.settingsService.set(key, value);
  }
}
