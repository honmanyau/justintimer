import moment, { Duration, Moment } from "moment";
import React from "react";
import styled from "styled-components";
import { TimeSinceState } from "./shared_interfaces";

export function timeSoFar(
    lastStartedAt: Moment | undefined,
    previouslyAccumulated: Duration | undefined
): Duration {
    let timeSinceLastStarted;
    if (lastStartedAt === undefined) {
        timeSinceLastStarted = moment.duration(0);
    } else {
        timeSinceLastStarted = moment.duration(moment().diff(lastStartedAt));
    }
    // Uncomment to accelerate time for 'testing'
    timeSinceLastStarted
        .add(timeSinceLastStarted)
        .add(timeSinceLastStarted)
        .add(timeSinceLastStarted);
    if (previouslyAccumulated) {
        return timeSinceLastStarted.add(previouslyAccumulated);
    } else {
        return timeSinceLastStarted;
    }
}

export class CountupTimeRenderer extends React.Component<TimeSinceState, {}> {
    cancel?: number;
    componentDidMount() {
        this.cancel = requestAnimationFrame(this.loop);
    }
    componentWillUnmount() {
        if (typeof this.cancel === "number") {
            window.cancelAnimationFrame(this.cancel);
        }
    }
    loop = () => {
        if (this.props.running) {
            this.setState({});
        }
        this.cancel = requestAnimationFrame(this.loop);
    };
    render() {
        let t;
        if (
            !this.props.running &&
            this.props.lastStoppedAtTimerTime !== undefined
        ) {
            t = this.props.lastStoppedAtTimerTime;
        } else {
            t = timeSoFar(
                this.props.lastStartedAtWallClockTime,
                this.props.lastStoppedAtTimerTime
            );
        }
        return (
            <TimeDisplay>
                {`${padZeros(t.hours(), 2)}:${padZeros(
                    t.minutes(),
                    2
                )}:${padZeros(t.seconds(), 2)}.${padZeros(
                    t.milliseconds(),
                    3
                )}`}
            </TimeDisplay>
        );
    }
}

interface TabataProps extends TimeSinceState {
    onCountdownComplete: () => void;
    onWork: () => void;
    onRest: () => void;
    exercisesPerRound: number;
    numberOfRounds: number;
    secondsPerExercise: number;
    secondsOfRest: number;
}

export class TabataTimeRenderer extends React.Component<TabataProps, {}> {
    cancel?: number;
    justOnceAtTheStart = false;
    componentDidMount() {
        this.cancel = requestAnimationFrame(this.loop);
    }
    componentWillUnmount() {
        if (typeof this.cancel === "number") {
            window.cancelAnimationFrame(this.cancel);
        }
    }
    loop = () => {
        if (this.props.running) {
            this.setState({});
        }
        this.cancel = requestAnimationFrame(this.loop);
    };
    get countDownFrom(): Duration {
        return moment.duration(
            this.props.numberOfRounds *
                (this.props.secondsPerExercise + this.props.secondsOfRest) *
                this.props.exercisesPerRound,
            "seconds"
        );
    }
    roundNumber(timeRemaining: Duration): number {
        return Math.ceil(
            timeRemaining.asSeconds() /
                (this.props.secondsPerExercise + this.props.secondsOfRest) /
                this.props.exercisesPerRound
        );
    }
    exerciseNumber(timeRemaining: Duration): number {
        const secondsPerRound =
            (this.props.secondsPerExercise + this.props.secondsOfRest) *
            this.props.exercisesPerRound;
        const remainingSecondsThisRound =
            timeRemaining.asSeconds() -
            (this.roundNumber(timeRemaining) - 1) * secondsPerRound;
        // We want to count *up* on exercises per round
        return (
            1 +
            this.props.exercisesPerRound -
            Math.ceil(
                remainingSecondsThisRound /
                    (this.props.secondsPerExercise + this.props.secondsOfRest)
            )
        );
    }
    isWorkTime(timeRemaining: Duration): boolean {
        // We want to start with the work interval, which is where the offset of 20 is coming from.
        return (timeRemaining.seconds() + 20) % 30 < 20;
    }
    render() {
        let timeRemaining: Duration;
        if (
            !this.props.running &&
            this.props.lastStoppedAtTimerTime !== undefined
        ) {
            timeRemaining = this.countDownFrom.subtract(
                this.props.lastStoppedAtTimerTime
            );
        } else {
            timeRemaining = this.countDownFrom.subtract(
                timeSoFar(
                    this.props.lastStartedAtWallClockTime,
                    this.props.lastStoppedAtTimerTime
                )
            );
        }
        if (timeRemaining.asMilliseconds() < 0) {
            timeRemaining = moment.duration(0);
            // Note: if we call setState in a parent component to stop running, we don't want to risk calling any callbacks again here - so always check this.props.running.
            if (this.props.running) {
                window.setTimeout(
                    () =>
                        this.props.onCountdownComplete &&
                        this.props.onCountdownComplete(),
                    0
                );
            }
        }
        const timeStringNoMillis = `${padZeros(
            timeRemaining.hours(),
            2
        )}:${padZeros(timeRemaining.minutes(), 2)}:${padZeros(
            timeRemaining.seconds(),
            2
        )}`;
        document.title = timeStringNoMillis;
        const timeString = `${timeStringNoMillis}.${padZeros(
            timeRemaining.milliseconds(),
            3
        )}`;
        if (this.props.running && !this.justOnceAtTheStart) {
            this.justOnceAtTheStart = true;
            this.props.onWork();
        }
        return (
            <div>
                <TimeDisplay>{timeString}</TimeDisplay>
                <SideBySide>
                    <div>Exercise {this.exerciseNumber(timeRemaining)}</div>
                    <div>
                        Round{" "}
                        {1 +
                            this.props.numberOfRounds -
                            this.roundNumber(timeRemaining)}{" "}
                        of {this.props.numberOfRounds}
                    </div>
                </SideBySide>
                <WorkRestDisplay
                    isWorkTime={this.isWorkTime(timeRemaining)}
                    onWork={this.props.onWork}
                    onRest={this.props.onRest}
                />
            </div>
        );
    }
}

const SideBySide = styled.div`
    display: flex;
    direction: row;
    justify-content: space-between;
    padding: 16px 4px;
    font-size: larger;
    font-family: sans-serif;
`;

interface WorkRestDisplayProps {
    isWorkTime: boolean;
    onWork: () => void;
    onRest: () => void;
}
class WorkRestDisplay extends React.Component<WorkRestDisplayProps> {
    componentDidUpdate(prevProps: WorkRestDisplayProps) {
        if (this.props.isWorkTime !== prevProps.isWorkTime) {
            if (this.props.isWorkTime) {
                this.props.onWork();
            } else {
                this.props.onRest();
            }
        }
    }
    render() {
        return (
            <WorkRestDisplayRoot workTime={this.props.isWorkTime}>
                {this.props.isWorkTime ? "Work" : "Rest"}
            </WorkRestDisplayRoot>
        );
    }
}
const WorkRestDisplayRoot = styled.div<{ workTime: boolean }>`
    background-color: ${(props) => (props.workTime ? "green" : "red")};
    color: ${(props) => (props.workTime ? "black" : "white")};
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    font-size: 2rem;
    font-family: sans-serif;
`;

interface CountdownProps extends TimeSinceState {
    countDownFrom: Duration;
    onCountdownComplete: () => void;
}

export class CountdownTimeRenderer extends React.Component<CountdownProps, {}> {
    cancel?: number;
    componentDidMount() {
        this.cancel = requestAnimationFrame(this.loop);
    }
    componentWillUnmount() {
        if (typeof this.cancel === "number") {
            window.cancelAnimationFrame(this.cancel);
        }
    }
    loop = () => {
        if (this.props.running) {
            this.setState({});
        }
        this.cancel = requestAnimationFrame(this.loop);
    };
    render() {
        let t;
        if (
            !this.props.running &&
            this.props.lastStoppedAtTimerTime !== undefined
        ) {
            t = this.props.countDownFrom
                .clone()
                .subtract(this.props.lastStoppedAtTimerTime);
        } else {
            t = this.props.countDownFrom
                .clone()
                .subtract(
                    timeSoFar(
                        this.props.lastStartedAtWallClockTime,
                        this.props.lastStoppedAtTimerTime
                    )
                );
        }
        if (t.asMilliseconds() < 0) {
            t = moment.duration(0);
            // Note: if we call setState in a parent component to stop running, we don't want to risk calling any callbacks again here - so always check this.props.running.
            if (this.props.running) {
                window.setTimeout(
                    () =>
                        this.props.onCountdownComplete &&
                        this.props.onCountdownComplete(),
                    0
                );
            }
        }
        const timeStringNoMillis = `${padZeros(t.hours(), 2)}:${padZeros(
            t.minutes(),
            2
        )}:${padZeros(t.seconds(), 2)}`;
        document.title = timeStringNoMillis;
        const timeString = `${timeStringNoMillis}.${padZeros(
            t.milliseconds(),
            3
        )}`;
        return <TimeDisplay>{timeString}</TimeDisplay>;
    }
}

function padZeros(input: number, desiredLength: number): string {
    const result = input.toString();
    const padLength = desiredLength - result.length;
    return "0".repeat(padLength) + result;
}

const TimeDisplay = styled.div`
    font-size: 26px;
    font-weight: bold;
    font-family: monospace;
    margin: 12px auto;
    text-align: center;
`;