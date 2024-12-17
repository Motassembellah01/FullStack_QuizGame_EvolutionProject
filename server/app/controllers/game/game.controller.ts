import { AuthorizationGuard } from '@app/authorization/authorization.guard';
import { Game } from '@app/model/database/game';
import { CreateGameDto } from '@app/model/dto/game/create-game.dto';
import { GameService } from '@app/services/game/game.service';
import { Body, Controller, Delete, Get, HttpStatus, Logger, Param, Patch, Post, Put, Res, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
/**
 * This file contains all the roads linked to the handling of requests on game
 */
@ApiTags('Games')
@Controller('games')
@UseGuards(AuthorizationGuard)
export class GameController {
    constructor(
        private readonly gameService: GameService,
        private logger: Logger,
    ) {}

    @Get('/')
    @ApiOkResponse({
        description: 'Return the list of all games',
        type: Game,
        isArray: true,
    })
    async getAllGames(@Res() res: Response) {
        try {
            res.status(HttpStatus.OK).json(await this.gameService.getAllGames());
        } catch (e) {
            this.logger.log('an error occurred', e);
            res.status(HttpStatus.NOT_FOUND).send(e.message);
        }
    }

    @Post('/title')
    @ApiOkResponse({
        description: 'Return title existence',
        type: Object,
    })
    async getTitleGameExistence(@Body() title: { title }, @Res() res: Response) {
        try {
            const titleExists = await this.gameService.titleExists(title);
            res.status(HttpStatus.OK).send({ titleExists });
        } catch (e) {
            this.logger.log('an error occurred', e);
            res.status(HttpStatus.NOT_FOUND).send(e.message);
        }
    }

    @Get('/:id')
    @ApiOkResponse({
        description: 'Return game',
    })
    async getGameById(@Param('id') id: string, @Res() res: Response) {
        try {
            const game = await this.gameService.getGameById(id);
            if (game) res.status(HttpStatus.OK).json(game);
            else {
                res.status(HttpStatus.NOT_FOUND).send('Jeu introuvable');
            }
        } catch (e) {
            this.logger.log('an error occurred', e);
            res.status(HttpStatus.NOT_FOUND).send(e.message);
        }
    }

    @Get('title/:title')
    @ApiOkResponse({
        description: 'Return game',
    })
    async getGameByTitle(@Param('title') title: string, @Res() res: Response) {
        try {
            const game = await this.gameService.getGameByTitle(title);
            if (game) res.status(HttpStatus.OK).json(game);
            else {
                res.status(HttpStatus.NOT_FOUND).send('Jeu introuvable');
            }
        } catch (e) {
            this.logger.log('an error occurred', e);
            res.status(HttpStatus.NOT_FOUND).send(e.message);
        }
    }

    @ApiCreatedResponse({
        description: 'Add new game',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Post('/')
    async addGame(@Body() game: CreateGameDto, @Res() res: Response) {
        try {
            // force visibility to false when creating a game
            game.isVisible = true;
            const gotGame = await this.gameService.getGameById(game.id);
            // If the game already exist (verify id and title)
            if (gotGame || (await this.gameService.titleExists({ title: game.title }))) {
                res.status(HttpStatus.CONFLICT).send('This game already exists');
            } else {
                await this.gameService.addGame(game);
                res.status(HttpStatus.OK).json(game);
            }
        } catch (e) {
            this.logger.log('an error occurred', e);
            res.status(HttpStatus.NOT_FOUND).send(e.message);
        }
    }

    @ApiOkResponse({
        description: 'Modify a game',
        type: Game,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @Put('/')
    async updateGame(@Body() game: Game, @Res() res: Response) {
        try {
            await this.gameService.updateGame(game);
            res.status(HttpStatus.OK).send();
        } catch (e) {
            this.logger.log('an error occurred', e);
            res.status(HttpStatus.NOT_FOUND).send(e.message);
        }
    }

    @Delete('/:id')
    @ApiOkResponse({
        description: 'delete a new game',
    })
    async deleteGame(@Param('id') id: string, @Res() res: Response) {
        try {
            await this.gameService.deleteGameById(id);
            res.status(HttpStatus.OK).send();
        } catch (error) {
            res.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @ApiOkResponse({
        description: 'Update game visibility',
    })
    @Patch('/:id/update-visibility')
    async updateGameVisibility(@Param('id') id: string, @Body() updateData: { isVisible: boolean }, @Res() res: Response) {
        try {
            await this.gameService.updateGameVisibility(id, updateData.isVisible);
            res.status(HttpStatus.OK).send();
        } catch (e) {
            this.logger.log('an error occurred', e);
            res.status(HttpStatus.NOT_FOUND).send(e.message);
        }
    }
}
