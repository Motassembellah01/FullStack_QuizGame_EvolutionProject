import { Player } from "@app/interfaces/player";
import { Team } from "../team";

export interface UpdateScoreDto {
    teams: Team[],
    player: Player
}