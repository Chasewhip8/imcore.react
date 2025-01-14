import React from "react";
import DebugSettings from "./sections/DebugSettings";
import GroupSettings from "./sections/GroupSettings";
import Settings from "./sections/Settings";
import Statistics from "./sections/Statistics";
import Security from "./sections/Security";

export default function DevtoolsRoot() {
    return (
        <div className="devtools-root">
            <Statistics />
            <DebugSettings />
            <GroupSettings />
            <Settings />
            <Security />
        </div>
    );
}