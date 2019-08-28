import events from "./events"
import { IPlayer } from "./player"
import shortid from "shortid"
import Phase from "./phase"
import WebSocket from "ws"
import { sendError, sendChooseDeck } from "../net/responses"
import User, { IUser } from "../models/user"
import Deck from "../models/deck"

export interface IMatch {
    id: string,
    inviteId: string,
    name: string,
    description: string,
    phase: Phase,
    player1?: IPlayer,
    player2?: IPlayer,
    playerTurn?: IPlayer
}

let matches: Array<IMatch> = []

export const createMatch = (host: string, name: string, description: string): IMatch => {

    let match = {
        id: shortid.generate(),
        inviteId: shortid.generate(), 
        name,
        description,
        phase: Phase.IDLE
    }

    return match

}

export const getMatch = (id: string) => {
    return matches.find(x => x.id === id)
}

export const addPlayer = async (client: WebSocket, user: IUser, matchId: string, inviteId: string) => {

    let match = getMatch(matchId)

    if(!match) {
        return sendError(client, "Match is no longer available")
    }

    if(match.phase !== Phase.IDLE) {
        return sendError(client, "Match is currently in progress")
    }

    if(inviteId !== match.inviteId) {
        return sendError(client, "Invite id does not match")
    }

    if(match.player1 && match.player2) {
        return sendError(client, "Both players have already connected")
    }

    let decks = await Deck.find().or([{ owner: user.uid }, { standard: true }]).select('uid name cards standard public -_id')

    let player: IPlayer = {
        user,
        client,
        match,
        decks,
        shieldzone: [],
        manazone: [],
        graveyard: [],
        battlezone: []
    }

    if(!match.player1) {

        match.player1 = player

    } else {

        match.player2 = player

        match.phase = Phase.CHOOSE_DECK
        sendChooseDeck(match.player1.client, match.player1.decks)
        sendChooseDeck(match.player2.client, match.player2.decks)

    }

}

export const before = <K extends keyof events>(eventName: K, listener: (event: events[K], next: Function) => void) => {

}

export const after = <K extends keyof events>(eventName: K, listener: (event: events[K], next: Function) => void) => {

}