import { ChatRepresentation } from "imcore-ajax-core";
import React from "react";
import { useSelector } from "react-redux";
import AutoSizer from "react-virtualized-auto-sizer";
import { areEqual, FixedSizeList as List } from "react-window";
import { selectChats } from "../app/reducers/chats";
import { chatChanged } from "../app/reducers/presence";
import { store } from "../app/store";
import "../styles/ChatSidebar.scss";
import { findAncestor } from "../util/dom";
import ChatSidebarItem from "./ChatSidebarItem";
import { TypedListChildComponentProps } from "./react-window-dynamic/DynamicSizeList";

function findChatID(element: HTMLElement): string | null {
    return findAncestor(element, ancestor => {
        return ancestor.hasAttribute("attr-chat-id");
    })?.getAttribute("attr-chat-id") || null;
}

const RowRenderer = React.memo(function RowRenderer({
    index,
    data,
    style
}: TypedListChildComponentProps<ChatRepresentation[]>) {
    return (
        <ChatSidebarItem style={style} chat={data[index]} />
    );
}, (prevProps, nextProps) => {
    if (!areEqual(prevProps, nextProps)) return false;

    const prevChat = prevProps.data[prevProps.index];
    const nextChat = nextProps.data[nextProps.index];

    if (prevChat.id !== nextChat.id) return false;
    if (prevChat.lastMessage !== nextChat.lastMessage) return false;
    if (prevChat.lastMessageTime !== nextChat.lastMessageTime) return false;
    if (prevChat.unreadMessageCount !== nextChat.unreadMessageCount) return false;
    if (prevChat.displayName !== nextChat.displayName) return false;
    if (prevChat.ignoreAlerts !== nextChat.ignoreAlerts) return false;
    if (prevChat.groupPhotoID !== nextChat.groupPhotoID) return false;
    if (JSON.stringify(prevChat.participants) !== JSON.stringify(nextChat.participants)) return false;

    return true;
});

function ChatSidebar() {
    const allChats = Object.values(useSelector(selectChats)).sort((c1, c2) => c2.lastMessageTime - c1.lastMessageTime);

    return (
        <div onMouseOver={event => {
            if (!(event.target instanceof HTMLElement)) return;
            const currentChatID = findChatID(event.target);
            if (!currentChatID) return;
            if (currentChatID === store.getState().presence.hoveringOverChatID) return;
            store.dispatch(chatChanged(currentChatID));
        }}>
            <AutoSizer>
                {({height}) => (
                    <List
                        height={height}
                        className="chat-sidebar"
                        itemCount={allChats.length}
                        itemData={allChats}
                        itemSize={60}
                        itemKey={(index: number, data: ChatRepresentation[]) => data[index].id}
                        overscanCount={35}
                        width={285}
                    >
                        {RowRenderer}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
}

export default ChatSidebar;