import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChatConfigurationRepresentation, ChatItemRepresentation, ChatItemType, ChatRepresentation, MessageRepresentation } from 'imcore-ajax-core'
import { RootState } from "../store";

interface ChatState {
    byID: Record<string, ChatRepresentation>;
    typingStatus: Record<string, boolean>;
}

const initialState: ChatState = {
    byID: {},
    typingStatus: {}
};

const acceptedLastMessageTypes = [
    ChatItemType.acknowledgment,
    ChatItemType.associated,
    ChatItemType.plugin,
    ChatItemType.sticker,
    ChatItemType.attachment,
    ChatItemType.text
];

export const chatSlice = createSlice({
    name: 'chats',
    initialState,
    reducers: {
        chatsChanged: (chats, { payload: newChats }: PayloadAction<ChatRepresentation[]>) => {
            newChats.forEach(chat => chats.byID[chat.id] = chat);
        },
        chatChanged: (chats, { payload: chat }: PayloadAction<ChatRepresentation>) => {
            chats.byID[chat.id] = chat;
        },
        chatDeleted: (chats, { payload: chatID }: PayloadAction<string>) => {
            delete chats.byID[chatID];
        },
        chatMessagesReceived: (chats, { payload: messages }: PayloadAction<MessageRepresentation[]>) => {
            for (const { chatID, description, time, items } of messages) {
                if (!chats.byID[chatID]) continue;
                if (time <= chats.byID[chatID].lastMessageTime) continue;

                let isTyping = false, isIncluded = false;

                console.log(items);

                for (const item of items) {
                    if (item.type === ChatItemType.typing) isTyping = true;
                    if (acceptedLastMessageTypes.includes(item.type)) {
                        isIncluded = true;
                        break;
                    }
                }

                chats.typingStatus[chatID] = isTyping;

                if (!isIncluded) continue;

                Object.assign(chats.byID[chatID], {
                    lastMessage: description,
                    lastMessageTime: time
                } as Partial<ChatRepresentation>)
            }
        },
        chatPropertiesChanged: (chats, { payload: { id, ...properties } }: PayloadAction<ChatConfigurationRepresentation>) => {
            if (!chats.byID[id]) return;

            Object.assign(chats.byID[id], properties)
        }
    }
});

export const { chatsChanged, chatChanged, chatDeleted, chatMessagesReceived, chatPropertiesChanged } = chatSlice.actions;

export const selectChats = (state: RootState) => state.chats.byID;
export const selectTypingStatus = (state: RootState, chatID: string) => state.chats.typingStatus[chatID] || false;

export default chatSlice.reducer;