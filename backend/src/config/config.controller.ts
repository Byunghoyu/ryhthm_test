import { Controller, Get } from '@nestjs/common';
import { gameConfig } from './game-config';
import { beatCreatorConfig } from './beat-creator-config';

@Controller('config')
export class ConfigController {
    @Get()
    getConfig() {
        return gameConfig;
    }

    @Get('beat-creator')
    getBeatCreatorConfig() {
        return beatCreatorConfig;
    }
}
