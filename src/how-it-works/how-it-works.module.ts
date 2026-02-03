import { Module } from '@nestjs/common';
import { HowItWorksService } from './how-it-works.service';
import { HowItWorksController } from './how-it-works.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { HowItWorks, HowItWorksSchema } from './schema/how-it-works.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: HowItWorks.name, schema: HowItWorksSchema }]),
  ],
  controllers: [HowItWorksController],
  providers: [HowItWorksService],
})
export class HowItWorksModule {}
