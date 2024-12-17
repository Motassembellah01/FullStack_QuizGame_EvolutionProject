import { Player } from "@app/core/interfaces/player";
import { Team } from "../team";

export interface NewPlayerDto {
    players: Player[],
    isTeamMatch: boolean,
    teams: Team[],
    isPricedMatch: boolean,
    nbPlayersJoined: number,
    priceMatch: number,
}