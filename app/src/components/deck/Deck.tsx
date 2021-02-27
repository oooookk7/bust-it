import React, { ReactNode, useState } from 'react';
import ReactDOM from 'react-dom';
import { connect } from "react-redux";
import { GameStatusEnum, SocketInEventEnum } from "../../globals/enums";
import { GameInfo, PlayersInfo } from "../../globals/types";
import { CARDS_FOLDER_DIR } from '../../globals/constants';
import { MapStateToProps, MapDispatchToProps } from '../../store';
import { useParams } from 'react-router';


function Deck(props: {
    game?: GameInfo,
    players?: PlayersInfo,
    join?: any,
    ready?: any,
    start?: any,
    history?: any,
    draw?: any,
    next?: any,
    shuffle?: any
}) {
    let playerInfo = (props.players && props.players[props?.game?.playerNo || '0']) || { chips: 0, active: false };
    let flags: { [key: string]: boolean } = {
        disabled: props.game?.actions.shuffling || props.game?.actions.loading ||
            (props.game?.started && props.game.turnPlayerId !== props.game.playerId) ||
            ([GameStatusEnum.ENDED, GameStatusEnum.ERROR].indexOf(props.game?.status) > -1) || false,
        result: props.game?.status === GameStatusEnum.ROUND_RESULT,
        dead: playerInfo.chips <= 0 || !playerInfo.active
    }

    let [gameId, setGameId] = useState('');
    let [initChips, setInitChips] = useState('');
    let uriParams: { [key: string]: string } = useParams();

    const joinRoom = (_gameId: string) => {
        flags.disabled = true;
        setGameId(_gameId);
        setTimeout(() => { props.join(_gameId) }, 10);
    };

    if (uriParams.gameId && !gameId) {
        joinRoom(uriParams.gameId);
    }

    console.info((flags.disabled || flags.dead) && !flags.result, flags, playerInfo, props.game, props.players)

    return <div className="deck">
        <div className="holder">
            <p className="name">
                <span className="label">
                    {((): ReactNode => {
                        let title = 'Start or Create Game';

                        switch (props.game?.status) {
                            case GameStatusEnum.NOT_READY:
                                title = 'Create Game'
                                break;
                            case GameStatusEnum.READY:
                                title = 'Start Game';
                                break;
                            case GameStatusEnum.ROUND_START:
                                title = `Round ${props.game.rounds}`
                                break;
                            case GameStatusEnum.ROUND_RESULT:
                                title = `Round ${props.game.rounds} Result`
                                break;
                            case GameStatusEnum.ENDED:
                                title = 'Game Ended'
                                break;
                            case GameStatusEnum.ERROR:
                                switch (props.game.error?.type) {
                                    case SocketInEventEnum.JOIN_ERROR:
                                        title = 'Join Game Error';
                                        break;
                                    case SocketInEventEnum.READY_ERROR:
                                        title = 'Game Ready Error';
                                        break;
                                    case SocketInEventEnum.START_ERROR:
                                        title = 'Start Error';
                                        break;
                                    default:
                                        title = !props.game.joined ? 'Server Error' : title;
                                        break;
                                }
                        }

                        return title;
                    })()}
                </span>
            </p>

            {((): ReactNode => {
                if (props.game?.started) return <></>;

                return <div className="enter-controls">
                    {props.game?.error ? <p className="error">{props.game.error.msg}</p> : ''}

                    {((): ReactNode => {
                        switch (props.game?.status) {
                            case GameStatusEnum.NOT_CONNECTED:
                                return <>
                                    {props.game.actions.loading ? <p>'Joining Game...'</p> : ''}
                                    <input type="text" className="input" placeholder="Game ID" value={gameId} disabled={flags.disabled} onChange={(e) => setGameId(e.target.value)} />
                                    <button className="join" disabled={flags.disabled} onClick={() => {
                                        props.history.push(gameId);
                                        joinRoom(gameId);
                                    }}>Join Game</button>;
                                </>;
                            case GameStatusEnum.NOT_READY:
                                return <>
                                    <p>{props.game.actions.loading ? 'Creating Game...' : 'Game is New!'}</p>
                                    <input type="number" className="input" placeholder="Rounds / Chips" value={initChips} disabled={flags.disabled} onChange={(e) => {
                                        setInitChips((e.target.value || '').replace('/[\D]/g', '') || '');
                                    }} />
                                    <button className="join" disabled={flags.disabled} onClick={() => props.ready(initChips)}>Create Game</button>
                                </>;
                            case GameStatusEnum.READY:
                                return <>
                                    <p>{props.game.actions.loading ? 'Starting Game...' : 'Wait for participants'}</p>
                                    <button className="join" disabled={flags.disabled || Object.keys(props.players || {}).length < 2} onClick={props.start}>Start Game</button>
                                </>;
                        }
                        return <></>;
                    })()}
                </div>
            })()}

            {((): ReactNode => {
                if (!props.game?.started) {
                    return <></>;
                }

                return <>
                    <div className={`card-holder ${props.game?.actions.shuffling ? 'shuffle' : ''}`}>
                        <img className="card c1" src={`${CARDS_FOLDER_DIR}//back-red.png`} />
                        <img className="card c2" src={`${CARDS_FOLDER_DIR}//back-red.png`} />
                        <img className="card c3" src={`${CARDS_FOLDER_DIR}//back-red.png`} />
                    </div>
                    <div className="actions-control">
                        <button className="shuffle" disabled={flags.disabled || flags.result} onClick={props.shuffle}><i className="fas fa-sync"></i> Shuffle</button>
                        <button className="draw" disabled={flags.disabled || flags.result} onClick={props.draw}><i className="far fa-hand-paper"></i> Draw</button>
                        <button className="next" disabled={(flags.disabled || flags.dead) && !flags.result} onClick={props.next}><i className="fas fa-forward"></i> {props.game?.status === GameStatusEnum.ROUND_RESULT ? 'Next Round' : 'Next'}</button>
                    </div>
                </>;
            })()}
        </div>
    </div>;
}

export default connect(MapStateToProps, MapDispatchToProps)(Deck);