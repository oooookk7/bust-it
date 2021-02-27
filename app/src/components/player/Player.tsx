import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom';
import { connect } from "react-redux";
import { GameStatusEnum } from '../../globals/enums';
import { CARDS_FOLDER_DIR } from '../../globals/constants';
import { GameInfo, PlayerInfo, PlayersInfo } from "../../globals/types";
import { MapStateToProps, MapDispatchToProps } from '../../store';


function Player(props: {
    no: string,
    game?: GameInfo,
    players?: PlayersInfo
}) {
    let playerNo: string = props.no;
    let playerInfo: PlayerInfo = (props.players && props.players[playerNo]) || {
        id: '-',
        no: playerNo,
        chips: 0,
        cards: []
    };
    let flags: { [key: string]: boolean } = {
        unused: playerInfo.id === '-',
        active: playerInfo.active || (props.game?.status === GameStatusEnum.NOT_READY && playerNo === '1') || false,
        turn: (playerInfo.turn && props.game?.status !== GameStatusEnum.ROUND_RESULT) || false,
        self: playerInfo.id === props.game?.playerId,
        dead: (playerInfo.chips === 0 && props.game?.started) || false,
        winner: playerInfo.winner || false
    };

    return <div className={`player p${playerNo} ` +
        (!flags.active || flags.dead ? 'dead ' : '') +
        (!flags.self ? 'you ' : '') +
        (flags.turn ? 'active ' : '') +
        (flags.winner ? 'winner ' : '')
    }>
        <p className="name">
            <span className="label">
                Player {props.no}
                {flags.self ? " (You)" : ""}
                {!flags.active && !flags.unused ? " (Inactive)" : ""}
                {flags.dead ? " (Dead)" : ""}
                {flags.winner ? " (Winner)" : ""}
            </span>
        </p>
        <div className="holder">
            {((): ReactNode => {
                if (playerInfo.cards.length > 0) {
                    return playerInfo.cards.map((card: any) => {
                        return <div className="card">
                            <img className="card" src={`${CARDS_FOLDER_DIR}/${card.show ? card.value : 'back-red'}.png`} />
                        </div>
                    });
                }
                // When the game hasn't started.
                return [1, 2].map((cardIndex: number) => {
                    return <div className="card">
                        <img className="card" src={`${CARDS_FOLDER_DIR}/back-${flags.active ? 'red' : 'blue'}.png`} />
                    </div>
                });
            })()}
        </div>
        <p className="coin">
            <i className="fas fa-coins"></i>
            <span className="amount">
                {!flags.unused && props.game?.status !== GameStatusEnum.NOT_READY ? playerInfo.chips : '-'}
            </span>
        </p>
    </div >;
}

export default connect(MapStateToProps, MapDispatchToProps)(Player);