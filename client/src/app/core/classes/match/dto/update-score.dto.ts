import { Player } from "@app/core/interfaces/player";
import { Team } from "../team";


export interface UpdateScoreDto {
    teams: Team[],
    player: Player
}