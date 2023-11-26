import React, { useEffect, useRef, useState } from 'react'
import { BsFillSendFill, BsImage } from "react-icons/bs";
import { useSelector } from 'react-redux';
import { socket } from './Notification';



const Chat = ({ conversationInfo }) => {
    const { currentUser } = useSelector(state => state.user)
    const [messageText, setMessageText] = useState([])
    const [typedMessage, setTypedMessage] = useState("")
    const [IsSendingError, setSendingError] = useState(false);
    const [notifyUser, setNotifyUser] = useState([])
    const scrollRef = useRef();


    const { trackConversation, socketMessages, setSocketMessages } = conversationInfo;
    const { chatCreator, chatPartner } = trackConversation.conversation;



    //----- Load User Messages
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/message?sender=${trackConversation.sender}&receiver=${trackConversation.receiver}`)
                const getMessages = await res.json();
                if (getMessages.success === false) {
                    console.log(getMessages.message);
                }
                else {
                    setMessageText(getMessages)
                }
            } catch (error) {
                console.log(error);
            }
        })()
    }, [trackConversation])



    //====== Join Sockets Room Here =======//
    useEffect(() => {
        socket.emit("join_room", trackConversation.chatId)
    }, [trackConversation])

    //----- Get Message from socket
    useEffect(() => {
        socket.on("receive_message", (socketMsg) => {
            setNotifyUser([...notifyUser, { notifyUserId: socketMsg.msgReceiver }])
            setSocketMessages([...socketMessages, { message: socketMsg.message, type: "received", }])
        })
    })



    const sendMessageTOSocket = () => {
        socket.emit('send_message', { chatId: trackConversation.chatId, message: typedMessage, msgReceiver: currentUser._id });
        setSocketMessages([...socketMessages, { message: typedMessage, type: "send" }])
        setTypedMessage("")
    };

    console.log(trackConversation);
    // ===== Send Notification =======//

    const sendNotification = () => {
        socket.emit("send_notification", { chatId: trackConversation.chatId, message: typedMessage, from: currentUser._id, to: trackConversation.conversationActive })
    }


    // Handle Message Sending //
    const handleSendMsg = async (e) => {
        e.preventDefault();
        sendMessageTOSocket();
        sendNotification();
        try {
            const sendMsgToDB = await fetch("/api/message/create", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    {
                        sender: currentUser._id,
                        receiver: trackConversation.conversationActive,
                        message: typedMessage,
                    }
                )
            });
            const response = await sendMsgToDB.json();
            //===checking Message request success or not ===//
            if (response.success === false) {
                setSendingError(true)
            }
            else {
                setSendingError(false)
            }
        } catch (error) {
            setSendingError(true)
            console.log(error);
        }
    }


    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [socketMessages, messageText])



    return (
        <div className="conversation_container bg-white  ">
            <div className="chat_person_container  grid grid-cols-2 bg-white shadow-sm items-center px-5 py-3 border-b border-">
                <div className="chat_user flex items-center justify-center sm:justify-start sm:flex-row sm:gap-4 gap-1 duration-300    ">
                    <img
                        className='h-8 w-8 sm:h-10 sm:w-10 rounded-full border border-brand-blue'
                        src={chatPartner._id === currentUser._id ? chatCreator.avatar : chatPartner.avatar}
                        alt="user image" />
                    <p className=' sm:block text-black font-semibold font-heading text-sm truncate'>
                        {chatPartner._id === currentUser._id ? chatCreator.username : chatPartner.username}
                    </p>

                </div>


                <div className="show_user_listing flex items-center justify-end">
                    <button className='font-heading  rounded-sm py-2 px-5 text-brand-blue'>
                        !
                    </button>
                </div>
            </div>



            <div className='textbar_message'>
                <div className="message_container grid grid-rows-1 items-end overflow-y-scroll px-5 py-0 ">

                    {
                        messageText.map((msg, index) =>
                            msg.sender === currentUser._id ?
                                <div
                                    key={index}
                                    className={`flex ${currentUser._id === msg.sender ? "items-end" : "items-start"} w-full flex-col justify-end`}
                                >
                                    <div className="User_chat  mt-2 ">
                                        <p
                                            ref={scrollRef}
                                            className='text-lg font-normal bg-blue-900/80 px-2 text-white py-1 rounded-md'>
                                            {msg.message}
                                        </p>

                                    </div>

                                </div>
                                :
                                <div
                                    key={index}
                                    className={`flex ${currentUser._id === msg.sender ? "items-end" : "items-start"} w-full flex-col justify-end`}
                                >
                                    <div className="User_chat flex items-center gap-2 mt-2 ">
                                        <img
                                            className='h-8 w-8 rounded-full'
                                            src={chatPartner._id === currentUser._id ? chatCreator.avatar : chatPartner.avatar}
                                            alt="chat partner image" />
                                        <p
                                            ref={scrollRef}
                                            className='text-lg font-normal bg-blue-500 px-2 text-white py-1 rounded-md'>
                                            {msg.message}
                                        </p>
                                    </div>
                                </div>
                        )

                    }

                    {
                        socketMessages.length !== 0 && socketMessages.map((msg, index) =>

                            msg.type === "send" ?
                                <div
                                    key={index}
                                    className={`flex items-end w-full flex-col justify-end`}
                                >
                                    <div className="User_chat  mt-2 ">
                                        <p
                                            ref={scrollRef}
                                            className='text-lg font-normal bg-blue-900/80 px-2 text-white py-1 rounded-md'>
                                            {msg.message}
                                        </p>

                                    </div>

                                </div>
                                :
                                <div
                                    key={index}
                                    className={`flex items-start w-full flex-col justify-end`}
                                >
                                    <div className="User_chat flex items-center gap-2 mt-2 ">
                                        <img
                                            className='h-8 w-8 rounded-full'
                                            src={chatPartner._id === currentUser._id ? chatCreator.avatar : chatPartner.avatar}
                                            alt="chat partner image" />
                                        <p
                                            className='text-lg font-normal bg-blue-500 px-2 text-white py-1 rounded-md'>
                                            {msg.message}
                                        </p>
                                    </div>
                                </div>
                        )
                    }
                    {
                        IsSendingError && <p className='text-red-700 font-content font-semibold'>Message sending failed!</p>
                    }
                </div>



                <form onSubmit={handleSendMsg}>
                    <div className="textbar_container  w-full px-5 py-3 flex items-center gap-2">
                        <div className="attachment_container">
                            <BsImage />
                        </div>
                        <div className="input_container w-full">
                            <input
                                onChange={(e) => setTypedMessage(e.target.value)}
                                value={typedMessage}
                                type="text"
                                placeholder="Aa"
                                className="w-full px-4 py-1 rounded-full border  placeholder:font-content placeholder:text-sm caret-h-2  bg-[#F0F2F5] caret-brand-blue border-brand-blue focus:outline-none"
                            />
                        </div>
                        <div className="send_btn ">
                            <button
                                type='submit'
                                className='p-2 rounded-full hover:bg-gray-200 duration-300'>
                                <BsFillSendFill className='text-brand-blue' />
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div >
    )
}

export default Chat