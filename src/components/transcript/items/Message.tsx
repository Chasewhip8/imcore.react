import { AnyChatItemModel, ChatRepresentation, MessageRepresentation } from "imcore-ajax-core";
import React, { PropsWithRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { selectHandleIDToContact } from "../../../app/reducers/contacts";
import { formatPhoneNumber } from "../../../hooks/useFormattedHandles";
import "../../../styles/transcript/items/Message.scss";
import { ChatStyle } from "../../chat/ChatBubble";
import CNContactBubble from "../../contacts/CNContactBubble";
import { useCurrentChat } from "../ChatTranscriptFoundation";
import IMChatItem, { isChatItem } from "./IMChatItem";
import IMTranscriptItem, { isTranscriptItem } from "./IMTranscriptItem";
import { analyzeMessage } from "./Message.foundation";
import MessageReceiptController from "./MessageReceiptController";

export interface IMItemRenderingContext<Item = AnyChatItemModel> {
    item: Item
    message: MessageRepresentation
    chat: ChatRepresentation
    index: number
    changed: () => any
}

function componentForItem(item: AnyChatItemModel) {
    if (isTranscriptItem(item)) return IMTranscriptItem;
    else if (isChatItem(item)) return IMChatItem;
    else return null;
}

export function messageIsEmpty(message: MessageRepresentation) {
    for (const item of message.items) {
        if (componentForItem(item)) return false;
    }

    return true;
}

function useContact(message: MessageRepresentation) {
    return useSelector(selectHandleIDToContact)[message.sender || ""] || null;
}

function useMessageSenderName(message: MessageRepresentation) {
    const contact = useContact(message);

    if (contact?.fullName) return contact.fullName;
    else return formatPhoneNumber(message.sender || "<< system >>");
}

function Message({ eRef, message, nextMessage, prevMessage, lastDeliveredFromMe, lastReadFromMe, changed, style }: PropsWithRef<{
    message: MessageRepresentation,
    nextMessage?: MessageRepresentation,
    prevMessage?: MessageRepresentation,
    lastDeliveredFromMe?: string | null,
    lastReadFromMe?: string | null,
    style?: any,
    changed?: () => any,
    eRef?: (elm: Element) => any
}>) {
    const chat = useCurrentChat()!;
    const messageSenderContact = useContact(message);
    
    const { beginningContiguous, endingContiguous, showImage, showName } = useMemo(() => analyzeMessage({
        message,
        nextMessage,
        chat,
        prevMessage
    }), [JSON.stringify(message), JSON.stringify(nextMessage), JSON.stringify(prevMessage), chat]);

    changed = changed || (() => undefined);

    const items = message.items.map((item, index) => {
        const Component = componentForItem(item);

        if (!Component) return null;
        
        return <Component key={item.payload.id} index={index} changed={changed!} item={item} message={message} chat={chat} />;
    }).filter(item => item);

    const messageIsTranscriptMessage = message.items.every(isTranscriptItem);
    const nextIsTranscript = nextMessage?.items.every(isTranscriptItem) || false;
    const prevIsTranscript = prevMessage?.items.every(isTranscriptItem) || false;

    const senderName = useMessageSenderName(message);

    const showReceipt = chat.style === ChatStyle.solo && message.fromMe && (lastDeliveredFromMe === message.id || lastReadFromMe === message.id);

    return (
        items.length ? (
            <div className="message-container" ref={eRef as unknown as React.ClassAttributes<HTMLDivElement>["ref"]} style={style}>
                <div className="message" attr-message-id={message.id} attr-prev-contiguous={beginningContiguous.toString()} attr-next-contiguous={endingContiguous.toString()} attr-next-transcript-contiguous={(messageIsTranscriptMessage && nextIsTranscript).toString()} attr-prev-transcript-contiguous={(messageIsTranscriptMessage && prevIsTranscript).toString()} attr-from-me={message.fromMe.toString()} attr-service={message.service}>
                    {
                        messageIsTranscriptMessage ? items : <>
                            {
                                (chat.style === ChatStyle.group && !message.fromMe) ? (
                                    <div className="buddy-picture-track">
                                        {showImage ? (
                                            <CNContactBubble contact={messageSenderContact} />
                                        ) : null}
                                    </div>
                                ) : null
                            }
                            <div className="items-track">
                                { showName ? (
                                    <div className="buddy-name">{senderName}</div>
                                ) : null}
                                {items}
                                {
                                    message.fromMe ? (
                                        <MessageReceiptController showReceipt={showReceipt} timeRead={message.timeRead} id={message.id}></MessageReceiptController>
                                    ) : null
                                }
                            </div>
                        </>
                    }
                </div>
            </div>
        ) : null
    );
}

export default Message;