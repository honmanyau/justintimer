import * as React from "react";
import { useEffect, useState } from "react";
import * as ReactDOM from "react-dom";
import styled from "styled-components";
import { Stopwatch, Tabata, Timer } from "./components/stopwatch";
import { Textbox } from "./components/textbox";
import { YouTube } from "./components/youtube";

const TimerChooser = () => {
    return (
        <TimerNavBar>
            <a href="#stopwatch">Stopwatch</a>
            <a href="#timer">Timer</a>
            <a href="#tabata">Tabata</a>
        </TimerNavBar>
    );
};
const TimerNavBar = styled.div`
    margin: 8px auto;
    display: flex;
    justify-content: space-between;
    width: 300px;
`;

type pages = "stopwatch" | "timer" | "tabata" | "unknown";
function pageSelect(choices: { [K in pages]: React.ReactNode }) {
    let page = window.location.hash.substring(1);
    if (!page || page === "") {
        page = "stopwatch";
    }
    if (!choices.hasOwnProperty(page)) {
        page = "unknown";
    }
    return (choices as any)[page];
}

const App = () => {
    const [page, setPage] = useState("");
    useEffect(() => {
        const onHashChange = () => setPage(window.location.hash);
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    });
    return (
        <div>
            <PaddedCenteredContainer>
                <TimerChooser />
            </PaddedCenteredContainer>
            <PaddedCenteredContainer>
                {pageSelect({
                    timer: <Timer />,
                    stopwatch: <Stopwatch />,
                    tabata: <Tabata />,
                    unknown: "not found",
                })}
            </PaddedCenteredContainer>
            <Textbox />
            <YouTube />
        </div>
    );
};

const PaddedCenteredContainer = styled.div`
    display: flex;
    justify-content: center;
    padding: 16px;
`;

ReactDOM.render(<App />, document.getElementById("react"));
