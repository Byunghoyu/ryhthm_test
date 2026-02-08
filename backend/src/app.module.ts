import { Module } from '@nestjs/common';
import { ConfigController } from './config/config.controller';
import { TracksController } from './tracks/tracks.controller';

@Module({
  imports: [],
  controllers: [ConfigController, TracksController],
  providers: [],
})
export class AppModule { }
