import { Controller, Get, Put, Body, Inject, forwardRef, UsePipes, ValidationPipe } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { HealthChecksService } from '../health-checks/health-checks.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    @Inject(forwardRef(() => HealthChecksService))
    private readonly healthChecksService: HealthChecksService,
  ) {}

  @Get()
  async get() {
    const s = await this.settingsService.get();
    return s;
  }

  @Put()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(@Body() body: UpdateSettingsDto) {
    const payload: any = {
      healthCheckOperandoS: body.healthCheckOperandoS,
      healthCheckDegradadoS: body.healthCheckDegradadoS,
      intervalHighS: body.intervalHighS,
      intervalMediumS: body.intervalMediumS,
      intervalLowS: body.intervalLowS,
      jitterMaxS: body.jitterMaxS,
      timeoutMs: body.timeoutMs,
      autoIncidentCreation: body.autoIncidentCreation,
    };
    const updated = await this.settingsService.upsert(payload);
    // Refresh schedulers so new intervals take effect immediately
    try {
      if (this.healthChecksService && typeof this.healthChecksService.refreshAllSchedulers === 'function') {
        await this.healthChecksService.refreshAllSchedulers();
      }
    } catch (err) {
      // ignore
    }
    return updated;
  }
}
