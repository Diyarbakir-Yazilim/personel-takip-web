import { Module } from '@nestjs/common';
import { FloorPlanGateway } from './floor-plan.gateway';

@Module({
  providers: [FloorPlanGateway],
  exports: [FloorPlanGateway],
})
export class FloorPlanModule {}