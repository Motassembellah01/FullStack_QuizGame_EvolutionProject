import { Match } from "@app/classes/match/match";

export interface JoinedMatchObserverDto {
    addedObserverName: string,
    match: Match
}