import { Player } from "@app/interfaces/player";
import { Team } from "../team";

export interface NewPlayerDto {
    players: Player[],
    isTeamMatch: boolean;
    teams: Team[];
    isPricedMatch: boolean;
    nbPlayersJoined: number;
    priceMatch: number;
}