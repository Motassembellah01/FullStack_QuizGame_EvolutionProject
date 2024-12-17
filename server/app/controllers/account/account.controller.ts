import { AuthorizationGuard } from '@app/authorization/authorization.guard';
import { Language, ThemeVisual } from '@app/constants/constants';
import { AccountHandlerGateway } from '@app/gateways/accounts-handler/account-handler.gateway';
import { CreateAccountDTO } from '@app/model/dto/account/create-account.dto';
import { AccountService } from '@app/services/account/account.service';
import { Body, Controller, Delete, Get, HttpStatus, Logger, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';

@Controller('accounts')
export class AccountController {
    constructor(
        private readonly accountService: AccountService,
        private readonly logger: Logger,
        private readonly accountHandlerGateway: AccountHandlerGateway,
    ) {}

    @Get()
    async findAll(@Res() res: Response) {
        try {
            const accounts = await this.accountService.findAll();
            return res.status(HttpStatus.OK).json(accounts);
        } catch (error) {
            this.logger.error(`Error fetching all accounts: ${error.message}`);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to fetch accounts',
            });
        }
    }

    @Get(':userId')
    async findAccountByUserId(@Param('userId') userId: string, @Res() res: Response) {
        try {
            const account = await this.accountService.findByUserId(userId);
            return res.status(HttpStatus.OK).json(account);
        } catch (error) {
            this.logger.error(`Error fetching account with userId = ${userId}: ${error.message}`);
            return res.status(HttpStatus.NOT_FOUND).json({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Account with userId ${userId} not found`,
            });
        }
    }

    @Get('pseudonym/:pseudonym')
    async findAccountByUserPseudonym(@Param('pseudonym') pseudonym: string, @Res() res: Response) {
        try {
            const account = await this.accountService.findByUserPseudonym(pseudonym);
            return res.status(HttpStatus.OK).json(account);
        } catch (error) {
            this.logger.error(`Error fetching account with pseudonym = ${pseudonym}: ${error.message}`);
            return res.status(HttpStatus.NOT_FOUND).json({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Account with pseudonym ${pseudonym} not found`,
            });
        }
    }

    @Post('/batch')
    async findAccountsByUserIds(
        @Body('userIds') userIds: string[],
        @Res() res: Response
    ): Promise<Response> {
        try {
            const accounts = await this.accountService.findByUserIds(userIds);
            return res.status(HttpStatus.OK).json(accounts);
        } catch (error) {
            this.logger.error(`Error fetching accounts for userIds = ${userIds.join(', ')}: ${error.message}`);
            return res.status(HttpStatus.NOT_FOUND).json({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Accounts not found for the provided userIds`,
            });
        }
    }


    @Post('pseudonym')
    async findAccountByUserName(@Body('pseudonym') pseudonym: string, @Res() res: Response) {
        try {
            const account = await this.accountService.findByUserName(pseudonym);
            return res.status(HttpStatus.OK).json(account);
        } catch (error) {
            this.logger.error(`Error fetching account with pseudonym = ${pseudonym}: ${error.message}`);
            return res.status(HttpStatus.NOT_FOUND).json({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Account with pseudonym ${pseudonym} not found`,
            });
        }
    }

    @Get(':userId/friends')
    async getFriendsAccountsByUserId(@Param('userId') userId: string, @Res() res: Response) {
        try {
            const friends = await this.accountService.getFriends(userId);
            return res.status(HttpStatus.OK).json(friends);
        } catch (error) {
            this.logger.error(`Error fetching friends for userId = ${userId}: ${error.message}`);
            return res.status(HttpStatus.NOT_FOUND).json({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Friends not found for userId ${userId}`,
            });
        }
    }

    @Get(':userId/friend-requests')
    async getFriendRequests(@Param('userId') userId: string, @Res() res: Response) {
        try {
            const friendRequests = await this.accountService.getFriendRequests(userId);
            return res.status(HttpStatus.OK).json(friendRequests);
        } catch (error) {
            this.logger.error(`Error fetching friend requests for userId = ${userId}: ${error.message}`);
            return res.status(HttpStatus.NOT_FOUND).json({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Friend requests not found for userId ${userId}`,
            });
        }
    }

    @Get(':userId/friends-requested')
    async getFriendsThatUserRequested(@Param('userId') userId: string, @Res() res: Response) {
        try {
            const friendsThatUserRequested = await this.accountService.getFriendsThatUserRequested(userId);
            return res.status(HttpStatus.OK).json(friendsThatUserRequested);
        } catch (error) {
            this.logger.error(`Error fetching friends that user requested for userId = ${userId}: ${error.message}`);
            return res.status(HttpStatus.NOT_FOUND).json({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Friends that user requested not found for userId ${userId}`,
            });
        }
    }

    @Get(':userId/blockedUsers')
    async getBlockedUsers(@Param('userId') userId: string, @Res() res: Response) {
        try {
            const blockedAccounts = await this.accountService.getBlockedUsers(userId);
            return res.status(HttpStatus.OK).json(blockedAccounts);
        } catch (error) {
            this.logger.error(`Error fetching blocked accounts for userId = ${userId}: ${error.message}`);
            return res.status(HttpStatus.NOT_FOUND).json({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Blocked accounts not found for userId ${userId}`,
            });
        }
    }

    @Get(':userId/blockedBy')
    async getUsersBlockingMe(@Param('userId') userId: string, @Res() res: Response) {
        try {
            const accountsBlockingMe = await this.accountService.getBlockedByUsers(userId);
            return res.status(HttpStatus.OK).json(accountsBlockingMe);
        } catch (error) {
            this.logger.error(`Error fetching accounts blocking userId = ${userId}: ${error.message}`);
            return res.status(HttpStatus.NOT_FOUND).json({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Accounts blocking userId ${userId} not found`,
            });
        }
    }

    @UseGuards(AuthorizationGuard)
    @Patch(':userId/lang/:lang')
    async setLanguage(@Param('userId') userId: string, @Param('lang') lang: Language, @Res() res: Response) {
        try {
            const updatedAccount = await this.accountService.updateLanguage(userId, lang);
            return res.status(HttpStatus.OK).json(updatedAccount);
        } catch (error) {
            this.logger.log(`An error occurred while updating the language: ${error.message}`);
            res.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @UseGuards(AuthorizationGuard)
    @Patch(':userId/theme/:themeVisual')
    async setTheme(@Param('userId') userId: string, @Param('themeVisual') themeVisual: ThemeVisual, @Res() res: Response) {
        try {
            const updatedAccount = this.accountService.updateTheme(userId, themeVisual);
            return res.status(HttpStatus.OK).json(updatedAccount);
        } catch (error) {
            this.logger.log(`An error occurred while updating the visual theme: ${error.message}`);
            res.status(HttpStatus.NOT_FOUND).send(error.message);
        }
    }

    @Post()
    async createAccount(@Body() createAccountDto: CreateAccountDTO, @Res() res: Response) {
        try {
            const newAccount = await this.accountService.createAccount(createAccountDto);
            const accounts = await this.accountService.findAllBasicInfo();
            this.accountHandlerGateway.createAccountEmit(accounts);
            return res.status(HttpStatus.OK).json(newAccount);
        } catch (error) {
            this.logger.error(`Error creating account: ${error.message}`);
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                message: 'Failed to create account',
            });
        }
    }

    @UseGuards(AuthorizationGuard)
    @Patch(':userId/avatar')
    async updateAvatar(@Param('userId') userId: string, @Body('avatarUrl') avatarUrl: string, @Res() res: Response) {
        try {
            const updatedAccount = await this.accountService.updateAvatar(userId, avatarUrl);
            const accounts = await this.accountService.findAllBasicInfo();
            this.accountHandlerGateway.createAccountEmit(accounts);
            return res.status(HttpStatus.OK).json(updatedAccount);
        } catch (error) {
            this.logger.error(`An error occurred while updating the avatar: ${error.message}`);
            return res.status(HttpStatus.NOT_FOUND).send({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Failed to update avatar for userId ${userId}`,
            });
        }
    }

    @Patch(':userId/pseudonym')
    async updatePseudonym(@Param('userId') userId: string, @Body('newPseudonym') newPseudonym: string, @Res() res: Response) {
        try {
            const updatedAccount = await this.accountService.updatePseudonym(userId, newPseudonym.toLowerCase());
            const accounts = await this.accountService.findAllBasicInfo();
            this.accountHandlerGateway.createAccountEmit(accounts);
            return res.status(HttpStatus.OK).json(updatedAccount);
        } catch (error) {
            return res.status(error.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
                statusCode: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
                error: error?.response?.error ?? 'error',
            });
        }
    }

    @UseGuards(AuthorizationGuard)
    @Patch(':userId/money')
    async updateMoney(@Param('userId') userId: string, @Body('money') money: number, @Res() res: Response) {
        try {
            const updatedAccount = await this.accountService.updateMoney(userId, money);
            return res.status(HttpStatus.OK).json(updatedAccount);
        } catch (error) {
            this.logger.error(`An error occurred while updating the avatar: ${error.message}`);
            return res.status(HttpStatus.NOT_FOUND).send({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Failed to update money for userId ${userId}`,
            });
        }
    }

    @UseGuards(AuthorizationGuard)
    @Patch(':userId/ownedThemes')
    async updateOwnedThemes(@Param('userId') userId: string, @Body('ownedThemes') ownedThemes: ThemeVisual[], @Res() res: Response) {
        try {
            const updatedAccount = await this.accountService.updateOwnedThemes(userId, ownedThemes);
            return res.status(HttpStatus.OK).json(updatedAccount);
        } catch (error) {
            this.logger.error(`An error occurred while updating the owned themes: ${error.message}`);
            return res.status(HttpStatus.NOT_FOUND).send({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Failed to update owned themes for userId ${userId}`,
            });
        }
    }

    @UseGuards(AuthorizationGuard)
    @Patch(':userId/ownedAvatars')
    async updateOwnedAvatars(@Param('userId') userId: string, @Body('ownedAvatars') ownedAvatars: string[], @Res() res: Response) {
        try {
            const updatedAccount = await this.accountService.updateOwnedAvatars(userId, ownedAvatars);
            return res.status(HttpStatus.OK).json(updatedAccount);
        } catch (error) {
            this.logger.error(`An error occurred while updating the owned avatars: ${error.message}`);
            return res.status(HttpStatus.NOT_FOUND).send({
                statusCode: HttpStatus.NOT_FOUND,
                message: `Failed to update owned avatars for userId ${userId}`,
            });
        }
    }

    @Delete('auth0-accounts')
    async deleteAllAuth0Accounts(): Promise<{ message: string }> {
        return this.accountService.deleteAllAuth0Accounts();
    }
}
