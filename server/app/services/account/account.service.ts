import { Language, ThemeVisual } from '@app/constants/constants';
import { FriendHandlerGateway } from '@app/gateways/friend-handler/friend-handler';
import { Account, AccountDocument } from '@app/model/database/account';
import { Friend } from '@app/model/database/friend';
import { CreateAccountDTO } from '@app/model/dto/account/create-account.dto';
import { FriendRequestDto } from '@app/model/dto/friend-request/friend-request-dto';
import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';

@Injectable()
export class AccountService {
    constructor(
        @InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>,
        private readonly logger: Logger,
        private readonly friendHandlerGateway: FriendHandlerGateway,
    ) {}

    async findAll(): Promise<Account[]> {
        this.logger.log('Fetching all accounts');
        return this.accountModel.find().exec();
    }

    async findByUserId(userId: string): Promise<Account | null> {
        this.logger.log(`Getting user by userId = ${userId}`);
        const account = await this.accountModel.findOne({ userId }).exec();
        if (!account) {
            throw new NotFoundException(`Account with userId ${userId} not found`);
        }
        return account;
    }

    async findByUserPseudonym(pseudonym: string): Promise<Account | null> {
        this.logger.log(`Getting user by pseudonym = ${pseudonym}`);
        const account = await this.accountModel.findOne({ pseudonym }).exec();
        if (!account) {
            throw new NotFoundException(`Account with pseudonym ${pseudonym} not found`);
        }
        return account;
    }

    async findByUserName(userName: string): Promise<Account> {
        this.logger.log(`Getting account by pseudonym = ${userName}`);
        const account = await this.accountModel.findOne({ pseudonym: userName }).exec();

        if (!account) {
            this.logger.error(`Account with pseudonym ${userName} not found`);
            throw new NotFoundException(`Account with pseudonym ${userName} not found`);
        }

        return account;
    }

    async getFriends(userId: string): Promise<string[]> {
        const account = await this.findByUserId(userId);
        const friendsIds = account.friends;
        return Promise.all(friendsIds);
    }

    async findAllBasicInfo(): Promise<Partial<Account>[]> {
        this.logger.log('Fetching basic info for all accounts');
        return this.accountModel.find().select('userId pseudonym avatarUrl').exec();
    }

    async findBasicInfoByUserId(userId: string): Promise<Partial<Account>> {
        this.logger.log(`Getting basic info by userId = ${userId}`);
        return this.accountModel.findOne({ userId }).select('userId pseudonym avatarUrl').exec();
    }

    async getFriendRequests(userId: string): Promise<FriendRequestDto[]> {
        const account = await this.findByUserId(userId);
        const friendRequests = account.friendRequests;
        return Promise.all(friendRequests);
    }

    async addFriendRequest(userId: string, senderBasicInfo: Partial<Account>, requestId: string): Promise<void> {
        // Get all information related to the friend request
        const friendRequest: FriendRequestDto = new FriendRequestDto();
        friendRequest.requestId = requestId;
        friendRequest.senderBasicInfo = senderBasicInfo;

        // Add the receiverId to the list of friends that the sender has requested (In sender account)
        const senderAccountUpdate = await this.accountModel.findOneAndUpdate(
            { userId: senderBasicInfo.userId },
            { $push: { friendsThatUserRequested: userId } },
            { new: true, fields: { friendsThatUserRequested: 1 } },
        );

        // Inform the friend handler gateway to update the list of friends already requested by sender list
        this.friendHandlerGateway.updateFriendRequestSentList(senderBasicInfo.userId, senderAccountUpdate?.friendsThatUserRequested || []);

        // Add the friend request to the receiver's account
        const receiverAccountUpdate = await this.accountModel
            .findOneAndUpdate({ userId }, { $push: { friendRequests: friendRequest } }, { new: true, fields: { friendRequests: 1 } })
            .exec();

        const friendRequestsListUpdated = receiverAccountUpdate?.friendRequests || [];
        this.friendHandlerGateway.updateFriendRequestsThatUserReceived(userId, friendRequestsListUpdated);
    }

    async removeFriendRequestFromAccount(request: Friend): Promise<void> {
        const accountReceiver = await this.accountModel.findOneAndUpdate(
            { userId: request.receiverId },
            { $pull: { friendRequests: { requestId: request.requestId } } },
            { new: true, fields: { friendRequests: 1 } },
        );
        const friendRequestsReceiverListUpdated = accountReceiver?.friendRequests || [];
        this.friendHandlerGateway.updateFriendRequestsThatUserReceived(request.receiverId, friendRequestsReceiverListUpdated);

        // I also want to remove the user id of the receiver from the sender's friends that user requested
        const accountSender = await this.accountModel.findOneAndUpdate(
            { userId: request.senderId },
            { $pull: { friendsThatUserRequested: request.receiverId } },
            { new: true, fields: { friendsThatUserRequested: 1 } },
        );
        const friendsThatUserRequestedUpdated = accountSender?.friendsThatUserRequested || [];
        this.friendHandlerGateway.updateFriendRequestSentList(request.senderId, friendsThatUserRequestedUpdated);
    }

    async addFriend(request: Friend): Promise<void> {
        const receiverAccount = await this.accountModel.findOneAndUpdate(
            { userId: request.receiverId },
            { $push: { friends: request.senderId } },
            { new: true, fields: { friends: 1 } },
        );

        const senderAccount = await this.accountModel.findOneAndUpdate(
            { userId: request.senderId },
            { $push: { friends: request.receiverId } },
            { new: true, fields: { friends: 1 } },
        );

        this.friendHandlerGateway.updateFriendListReceiver(request.receiverId, receiverAccount?.friends || []);
        this.friendHandlerGateway.updateFriendListSender(request.senderId, senderAccount?.friends || []);

        // Remove the friend request from the receiver's account
        const receiverAccountUpdate = await this.accountModel.findOneAndUpdate(
            { userId: request.receiverId },
            { $pull: { friendRequests: { requestId: request.requestId } } },
            { new: true, fields: { friendRequests: 1 } },
        );

        const friendRequestsListUpdated = receiverAccountUpdate?.friendRequests || [];
        this.friendHandlerGateway.updateFriendRequestsThatUserReceived(request.receiverId, friendRequestsListUpdated);

        // Remove the id of receiver from the list of friends that the sender has requested (In sender account)
        const senderAccountUpdate = await this.accountModel.findOneAndUpdate(
            { userId: request.senderId },
            { $pull: { friendsThatUserRequested: request.receiverId } },
            { new: true, fields: { friendsThatUserRequested: 1 } },
        );

        const friendsThatUserRequestedUpdated = senderAccountUpdate?.friendsThatUserRequested || [];
        this.friendHandlerGateway.updateFriendRequestSentList(request.senderId, friendsThatUserRequestedUpdated);
    }

    async getFriendsThatUserRequested(userId: string): Promise<string[]> {
        const account = await this.findByUserId(userId);
        const friendsThatUserRequested = account.friendsThatUserRequested;
        return Promise.all(friendsThatUserRequested);
    }

    async removeFriend(request: Friend): Promise<void> {
        const senderAccount = await this.accountModel.findOneAndUpdate(
            { userId: request.senderId },
            { $pull: { friends: request.receiverId } },
            { new: true, fields: { friends: 1 } },
        );

        if (!senderAccount) {
            throw new BadRequestException('Remove Friend: Sender of friend request not found');
        }

        const receiverAccount = await this.accountModel.findOneAndUpdate(
            { userId: request.receiverId },
            { $pull: { friends: request.senderId } },
            { new: true, fields: { friends: 1 } },
        );

        if (!receiverAccount) {
            throw new BadRequestException('Remove Friend: Receiver of friend request not found');
        }

        this.friendHandlerGateway.updateFriendListReceiver(request.receiverId, receiverAccount?.friends || []);
        this.friendHandlerGateway.updateFriendListSender(request.senderId, senderAccount?.friends || []);
    }
    async findByUserIds(userIds: string[]): Promise<Partial<Account>[]> {
        this.logger.log(`Getting accounts by userIds = ${userIds.join(', ')}`);
        const accounts = await this.accountModel.find({ userId: { $in: userIds } }).exec();

        if (!accounts || accounts.length === 0) {
            throw new NotFoundException('No accounts found for the provided userIds');
        }

        return accounts.map((account) => ({
            userId: account.userId,
            pseudonym: account.pseudonym,
            avatarUrl: account.avatarUrl,
        }));
    }

    async addToBlockList(userId: string, blockedPersonId: string): Promise<void> {
        const user = await this.accountModel.findOneAndUpdate(
            { userId: userId },
            { $push: { UsersBlocked: blockedPersonId } },
            { new: true, fields: { UsersBlocked: 1 } }
        );

        const blockedPerson = await this.accountModel.findOneAndUpdate(
            { userId: blockedPersonId },
            { $push: { UsersBlockingMe: userId } },
            { new: true, fields: { UsersBlockingMe: 1 } }
        );

        this.friendHandlerGateway.updateBlockedUsersList(userId, user?.UsersBlocked || []);
        this.friendHandlerGateway.updateBlockedByList(blockedPersonId, blockedPerson?.UsersBlockingMe || []);
    }

    async getBlockedUsers(userId: string): Promise<string[]> {
        const account = await this.findByUserId(userId);
        const blockedUsers = account.UsersBlocked;
        return Promise.all(blockedUsers);
    }

    async getBlockedByUsers(userId: string): Promise<string[]> {
        const account = await this.findByUserId(userId);
        const blockedByUsers = account.UsersBlockingMe;
        return Promise.all(blockedByUsers);
    }

    async updateLanguage(userId: string, lang: Language): Promise<Account> {
        this.logger.log(`Updating language for userId ${userId} to ${lang}`);
        const updatedAccount = await this.accountModel.findOneAndUpdate({ userId }, { lang }, { new: true });
        if (!updatedAccount) {
            throw new Error(`Account with userId ${userId} not found`);
        }
        return updatedAccount;
    }

    async updateTheme(userId: string, themeVisual: ThemeVisual): Promise<Account> {
        this.logger.log(`Updating themeVisual for userId ${userId} to ${themeVisual}`);
        const updatedAccount = await this.accountModel.findOneAndUpdate({ userId }, { themeVisual }, { new: true });
        if (!updatedAccount) {
            throw new Error(`Account with userId ${userId} not found`);
        }
        return updatedAccount;
    }

    async createAccount(createAccountDto: CreateAccountDTO): Promise<Account> {
        this.logger.log('Creating a new account');
        const newAccount = new this.accountModel(createAccountDto);
        return newAccount.save();
    }

    async updateAvatar(userId: string, avatarUrl: string): Promise<Account> {
        this.logger.log(`Updating avatar for userId ${userId}`);
        const updatedAccount = await this.accountModel.findOneAndUpdate({ userId }, { avatarUrl }, { new: true });
        if (!updatedAccount) {
            throw new Error(`Account with userId ${userId} not found`);
        }
        return updatedAccount;
    }

    async updateMoney(userId: string, money: number): Promise<Account> {
        this.logger.log(`Updating money for userId ${userId}`);
        const updatedAccount = await this.accountModel.findOneAndUpdate({ userId }, { money }, { new: true });
        if (!updatedAccount) {
            throw new Error(`Account with userId ${userId} not found`);
        }
        return updatedAccount;
    }

    async updateOwnedThemes(userId: string, ownedThemes: ThemeVisual[]): Promise<Account> {
        this.logger.log(`Received userId: ${userId}`);
        this.logger.log(`Received ownedThemes: ${JSON.stringify(ownedThemes)}`);

        if (!Array.isArray(ownedThemes)) {
            throw new Error('ownedThemes must be an array');
        }

        const updatedAccount = await this.accountModel.findOneAndUpdate(
            { userId },
            { $addToSet: { visualThemesOwned: { $each: ownedThemes } } },
            { new: true },
        );

        if (!updatedAccount) {
            throw new Error(`Account with userId ${userId} not found`);
        }

        return updatedAccount;
    }

    async updateOwnedAvatars(userId: string, ownedAvatars: string[]): Promise<Account> {
        this.logger.log(`Received userId: ${userId}`);
        this.logger.log(`Received ownedThemes: ${JSON.stringify(ownedAvatars)}`);

        if (!Array.isArray(ownedAvatars)) {
            throw new Error('ownedThemes must be an array');
        }

        const updatedAccount = await this.accountModel.findOneAndUpdate(
            { userId },
            { $addToSet: { avatarsUrlOwned: { $each: ownedAvatars } } },
            { new: true },
        );

        if (!updatedAccount) {
            throw new Error(`Account with userId ${userId} not found`);
        }

        return updatedAccount;
    }

    async incrementGamesPlayed(pseudonym: string): Promise<Account> {
        this.logger.log(`Incrementing gamesPlayed for userId ${pseudonym}`);
        const updatedAccount = await this.accountModel.findOneAndUpdate({ pseudonym }, { $inc: { gamesPlayed: 1 } }, { new: true });
        if (!updatedAccount) {
            throw new Error(`Account with userId ${pseudonym} not found`);
        }
        return updatedAccount;
    }

    async incrementGamesWon(pseudonym: string): Promise<Account> {
        this.logger.log(`Incrementing gamesWon for userId ${pseudonym}`);

        const updatedAccount = await this.accountModel.findOneAndUpdate({ pseudonym }, { $inc: { gamesWon: 1 } }, { new: true });
        if (!updatedAccount) {
            throw new Error(`Account with userName ${pseudonym} not found`);
        }
        return updatedAccount;
    }

    async incrementMoneyWinner(pseudonym: string): Promise<Account> {
        this.logger.log(`Incrementing money for winner userId ${pseudonym}`);
        const updatedAccount = await this.accountModel.findOneAndUpdate({ pseudonym }, { $inc: { money: 100 } }, { new: true });
        if (!updatedAccount) {
            throw new Error(`Account with userName ${pseudonym} not found`);
        }
        return updatedAccount;
    }

    // async incrementMoneyWinnerPricedGame(pseudonym: string, matchAccessCode: string): Promise<Account> {
    //     this.logger.log(`Incrementing money for winner userId ${pseudonym} based on active players in match ${matchAccessCode}`);

    //     const match = this.matchService.getMatchByAccessCode(matchAccessCode);
    //     const activePlayersCount = match.players.filter(player => player.isActive).length;

    //     if (activePlayersCount <= 0) {
    //         throw new Error('No active players in the match. Cannot distribute winnings.');
    //     }

    //     const incrementAmount = ((match.nbPlayersJoined*10)*(2/3));
    //     this.logger.log(`Incrementing money for winner userId ${pseudonym}`, `${incrementAmount}`);

    //     const updatedAccount = await this.accountModel.findOneAndUpdate(
    //         { pseudonym },
    //         { $inc: { money: incrementAmount } },
    //         { new: true }
    //     );

    //     if (!updatedAccount) {
    //         throw new Error(`Account with userName ${pseudonym} not found`);
    //     }

    //     return updatedAccount;
    // }

    // async incrementMoneyLosersPricedGame(pseudonym: string, matchAccessCode: string): Promise<Account> {
    //     this.logger.log(`Incrementing money for winner userId ${pseudonym} based on active players in match ${matchAccessCode}`);

    //     const match = this.matchService.getMatchByAccessCode(matchAccessCode);
    //     const activePlayersCount = match.players.filter(player => player.isActive).length;

    //     if (activePlayersCount <= 0) {
    //         throw new Error('No active players in the match. Cannot distribute winnings.');
    //     }

    //     const incrementAmount = ((match.nbPlayersJoined*10)*(1/3) / activePlayersCount);
    //     this.logger.log(`Incrementing money for loser userId ${pseudonym}`, `${incrementAmount}`);

    //     const updatedAccount = await this.accountModel.findOneAndUpdate(
    //         { pseudonym },
    //         { $inc: { money: incrementAmount } },
    //         { new: true }
    //     );

    //     if (!updatedAccount) {
    //         throw new Error(`Account with userName ${pseudonym} not found`);
    //     }

    //     return updatedAccount;
    // }

    async incrementMoneyLoser(pseudonym: string): Promise<Account> {
        this.logger.log(`Incrementing money for loser userId ${pseudonym}`);
        const updatedAccount = await this.accountModel.findOneAndUpdate({ pseudonym }, { $inc: { money: 50 } }, { new: true });
        if (!updatedAccount) {
            throw new Error(`Account with userName ${pseudonym} not found`);
        }
        return updatedAccount;
    }

    async updateAvgQuestionsCorrect(pseudonym: string, correctAnswers: number): Promise<Account> {
        this.logger.log(`Updating avgQuestionsCorrect for userId ${pseudonym}`);

        const account = await this.accountModel.findOne({ pseudonym });

        if (!account) {
            throw new Error(`Account with pseudonym ${pseudonym} not found`);
        }

        const previousAverage = account.avgQuestionsCorrect;
        const totalGamesPlayed = account.gamesPlayed;

        const newOverallAverage = Math.round(((previousAverage * totalGamesPlayed + correctAnswers) / (totalGamesPlayed + 1)) * 100) / 100;

        const updatedAccount = await this.accountModel.findOneAndUpdate(
            { pseudonym },
            {
                avgQuestionsCorrect: newOverallAverage,
            },
            { new: true },
        );

        if (!updatedAccount) {
            throw new Error(`Account with pseudonym ${pseudonym} not found`);
        }

        return updatedAccount;
    }

    async updateAvgTimePerGame(pseudonym: string, newGameTime: number): Promise<Account> {
        this.logger.log(`Updating avgTimePerGame for pseudonym ${pseudonym}`);
        const account = await this.accountModel.findOne({ pseudonym });

        if (!account) {
            throw new Error(`Account with pseudonym ${pseudonym} not found`);
        }

        const previousAverage = account.avgTimePerGame;
        const totalGamesPlayed = account.gamesPlayed;

        const newOverallAverage = Math.round(((previousAverage * totalGamesPlayed + newGameTime) / (totalGamesPlayed + 1)) * 100) / 100;

        const updatedAccount = await this.accountModel.findOneAndUpdate(
            { pseudonym },
            {
                avgTimePerGame: newOverallAverage,
            },
            { new: true },
        );

        if (!updatedAccount) {
            throw new Error(`Account with pseudonym ${pseudonym} not found`);
        }

        return updatedAccount;
    }

    async updateMatchHistory(pseudonym: string, matchData: { gameName: string; datePlayed: string; won: boolean }): Promise<Account> {
        this.logger.log(`Updating match history for pseudonym ${pseudonym}`);

        const updatedAccount = await this.accountModel.findOneAndUpdate({ pseudonym }, { $push: { matchHistory: matchData } }, { new: true });

        if (!updatedAccount) {
            throw new Error(`Account with pseudonym ${pseudonym} not found`);
        }

        return updatedAccount;
    }

    async updatePseudonym(userId: string, newPseudonym: string): Promise<Account> {
        this.logger.log(`Updating pseudonym for userId ${userId} to ${newPseudonym}`);

        const existingAccount = await this.accountModel.findOne({ pseudonym: newPseudonym }).exec();
        if (existingAccount) {
            throw new BadRequestException({
                error: {
                    en: `The pseudonym "${newPseudonym}" is already in use.`,
                    fr: `Le pseudonyme "${newPseudonym}" est déjà utilisé.`,
                },
            });
        }

        try {
            const accessToken = await this.getAuth0AccessToken();
            await axios.patch(
                `https://polyquiz.ca.auth0.com/api/v2/users/${userId}`,
                { username: newPseudonym },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
        } catch (error) {
            this.logger.error(`Failed to update username in Auth0: ${error.message}`);

            throw new BadRequestException({
                error: {
                    en: 'The username contains invalid characters',
                    fr: 'Le nom d’utilisateur contient des caractères non valides',
                },
            });
        }

        const updatedAccount = await this.accountModel.findOneAndUpdate({ userId }, { pseudonym: newPseudonym }, { new: true });

        if (!updatedAccount) {
            throw new NotFoundException({
                error: {
                    en: `Account with userId ${userId} not found.`,
                    fr: `Compte avec l'ID utilisateur ${userId} introuvable.`,
                },
            });
        }

        return updatedAccount;
    }

    async getAuth0AccessToken(): Promise<string> {
        const response = await axios.post('https://polyquiz.ca.auth0.com/oauth/token', {
            client_id: '1t2sEjGA4sq8exgQRIxAiIaCKihm5py3',
            client_secret: '9MEVggrOCvGWrQAIY5BeRmwlLvJyfiYbhJdhkysrVgdw6kQEYc2_5W_BYLEx65QW',
            audience: 'https://polyquiz.ca.auth0.com/api/v2/',
            grant_type: 'client_credentials',
        });
        return response.data.access_token;
    }

    async getUserIdAndMoney(): Promise<{ userId: string; money: number }[]> {
        return this.accountModel.find({}, { userId: 1, money: 1, _id: 0 }).exec();
    }

    async deleteAllAuth0Accounts(): Promise<{ message: string }> {
        this.logger.log('Deleting all accounts from Auth0');
    
        const accessToken = await this.getAuth0AccessToken();
    
        try {
            // Fetch all users from Auth0
            const usersResponse = await axios.get('https://polyquiz.ca.auth0.com/api/v2/users', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
    
            const users = usersResponse.data;
    
            if (!users.length) {
                throw new NotFoundException({
                    error: {
                        en: 'No users found in Auth0 to delete.',
                        fr: 'Aucun utilisateur trouvé sur Auth0 à supprimer.',
                    },
                });
            }
    
            // Delete users one by one
            await Promise.all(
                users.map(async (user: { user_id: string }) => {
                    try {
                        await axios.delete(`https://polyquiz.ca.auth0.com/api/v2/users/${user.user_id}`, {
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                'Content-Type': 'application/json',
                            },
                        });
                        this.logger.log(`Successfully deleted Auth0 user: ${user.user_id}`);
                    } catch (error) {
                        this.logger.error(
                            `Failed to delete Auth0 user ${user.user_id}: ${error.message}`,
                        );
                    }
                }),
            );
    
            return { message: 'All Auth0 accounts have been deleted successfully.' };
        } catch (error) {
            this.logger.error(`Failed to fetch or delete users in Auth0: ${error.message}`);
            throw new InternalServerErrorException({
                error: {
                    en: 'An error occurred while deleting Auth0 accounts.',
                    fr: 'Une erreur s’est produite lors de la suppression des comptes Auth0.',
                },
            });
        }
    }
    
}
