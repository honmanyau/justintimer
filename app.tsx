import * as React from "react";
import * as ReactDOM from "react-dom";
import { Stopwatch } from "./components/stopwatch";
import { Textbox } from "./components/textbox";
import { YouTube } from "./components/youtube";

const App = () => (
    <div>
        <Stopwatch />
        <Textbox />
        <YouTube />
    </div>
);

ReactDOM.render(<App />, document.getElementById("react"));
