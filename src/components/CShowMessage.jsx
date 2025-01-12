"use client";
import { useSocket } from "@/context/socketContext";
import { useUser } from "@/context/userContext";
import handleCompareDate from "@/lib/CompareDate";
import { GET_API } from "@/lib/fetchAPI";
import { CloseOutlined, LoadingOutlined } from "@ant-design/icons";
import { message, Popover, Spin, Image as Images } from "antd";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { GrFormClose } from "react-icons/gr";
import { IoIosArrowDown, IoIosImages, IoMdClose } from "react-icons/io";
import { IoSend } from "react-icons/io5";
import { MdOutlineInsertEmoticon, MdOutlineReply } from "react-icons/md";
import axios from "axios";
export default function CShowMessage({ chatMessId, handleDeleteChat, token, socket, checkOnline }) {
    const lastMessageRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [chats, setChats] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [image, setImage] = useState(null);
    const [imageReview, setImageReview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [searchEmoji, setSearchEmoji] = useState("");
    const [emojiData, setEmojiData] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [messageApi, contextHolder] = message.useMessage();
    const { user } = useUser();
    const userId = user?._id;
    const handleOpenChange = (newOpen) => {
        setOpen(newOpen);
    };

    useEffect(() => {
        const fetchAPI = async () => {
            const req = await GET_API(`/chat/${chatMessId}`, token);
            if (req.ok) {
                setChats(req?.chat?.messages);
                delete req?.chat?.messages;
                setMessages(req?.chat);
            }
        };
        if (chatMessId !== null) {
            fetchAPI();
        } else {
            setMessages([]);
            setChats([]);
        }
    }, [chatMessId]);

    useEffect(() => {
        if (lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chats]);

    // const debouncedSearchEmoji = useCallback(
    //     debounce((searchTerm) => {
    //         const filteredData = emoji.filter((item) => item.unicodeName.toLowerCase().includes(searchTerm.toLowerCase()));
    //         setEmojiData(filteredData);
    //     }, 300),
    //     [emoji]
    // );

    // const handleSearchEmoji = useCallbackack(
    //     (e) => {
    //         const searchTerm = e.target.value;
    //         setSearchEmoji(searchTerm);
    //         debouncedSearchEmoji(searchTerm);
    //     },
    //     [debouncedSearchEmoji]
    // );

    const handlePaste = (event) => {
        const items = event.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.includes("image")) {
                const blob = items[i].getAsFile();
                const url = URL.createObjectURL(blob);
                setImage(blob);
                setImageReview(url);
                break;
            }
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        setImage(file);
        setImageReview(file ? URL.createObjectURL(file) : null);
    };

    const handleSendMessage = useCallback(async () => {
        if (!newMessage.trim() && !image) return;

        setLoading(true);
        try {
            let imageUrl = "";
            if (image) {
                const formData = new FormData();
                formData.append("image", image);
                const response = await axios.post(process.env.API_ENDPOINT + "/upload", formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data",
                    },
                });
                imageUrl = response.data.originalUrl;
            }

            const messageData = {
                chatRoomId: messages?._id,
                userId: user?._id,
                message: newMessage,
                image: imageUrl,
                token,
                replyTo: replyingTo,
            };
            socket.emit("sendMessage", messageData);

            setNewMessage("");
            setImage(null);
            setImageReview(null);
            setReplyingTo(null);
            // setSendMess(true);
        } catch (error) {
            messageApi.error("Failed to send message: ", error);
            console.error("Failed to send message", error);
        } finally {
            setLoading(false);
        }
    }, [newMessage, image, user, token, replyingTo, socket]);

    useEffect(() => {
        if (!socket) return;
        socket.emit("joinRoom", messages?._id);

        socket.on("message", (data) => {
            setChats((prevData) => [...prevData, data.newMessage]);
        });

        return () => {
            socket.emit("leaveRoom", messages?._id);
            socket.off();
        };
    }, [messages?._id, socket]);

    return (
        <>
            {contextHolder}
            {messages?.participants?.length > 0 && messages && (
                <div className="fixed right-5 bottom-0 ">
                    <div className="bg-white w-[338px] h-[455px] rounded-t-lg shadow-sm overflow-hidden">
                        <div className="h-12 flex items-center justify-between p-1 my-1  border-b border-gray-200 shadow-sm">
                            <Link
                                href={`/profile/${user?._id === messages?.participants[1]?.userId?._id ? messages?.participants[0]?.userId?._id : messages?.participants[1]?.userId?._id}`}
                                alt=""
                                className="flex items-center gap-2 hover:bg-gray-200 cursor-pointer rounded-md  px-2 h-full">
                                <div className="relative w-[36px] h-[36px]">
                                    <Image
                                        src={
                                            user?._id === messages?.participants[1]?.userId?._id ? messages?.participants[0]?.userId?.profilePicture : messages?.participants[1]?.userId?.profilePicture
                                        }
                                        alt="Message sent"
                                        fill
                                        className="absolute rounded-full object-cover"
                                    />
                                </div>
                                <div className="text-gray-500">
                                    <h3 className="font-bold leading-5 text-gray-700 line-clamp-1 max-w-[150px]">
                                        {user?._id === messages?.participants[1]?.userId?._id ? messages?.participants[0]?.userId?.displayName : messages?.participants[1]?.userId?.displayName}{" "}
                                    </h3>
                                    {checkOnline(user?._id === messages?.participants[1]?.userId?._id ? messages?.participants[0]?.userId?._id : messages?.participants[1]?.userId?._id) ? (
                                        <div className="text-sm flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-[#3fbb46]" />
                                            <p>Đang hoạt động</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm ">Không hoạt động</p>
                                    )}
                                </div>
                                <IoIosArrowDown size={14} />
                            </Link>
                            <div className="w-12 h-full hover:text-red-500 cursor-pointer flex items-center justify-center" onClick={handleDeleteChat}>
                                <CloseOutlined />
                            </div>
                        </div>

                        <div className="h-[320px]  overflow-y-scroll p-3">
                            {chats &&
                                chats?.map((msg, index) => {
                                    const isSameUser = index > 0 && chats[index - 1]?.userId === msg?.userId;
                                    const isCurrentUser = msg?.userId === user?._id;
                                    const isLastMessage = index === chats?.length - 1;
                                    const image_another_user = user?._id === msg?.userId ? messages?.participants[0]?.userId?.profilePicture : messages?.participants[1]?.userId?.profilePicture;
                                    return (
                                        <div key={index} ref={isLastMessage ? lastMessageRef : null}>
                                            {/* Tin nhắn */}
                                            {!isSameUser && isCurrentUser && <p className="mb-5"></p>}

                                            <div className={`flex items-start ${isCurrentUser ? "justify-end" : "justify-start"} mb-[4px] group min-h-[40px] items-center`}>
                                                {/* Avatar của người khác */}
                                                {!isCurrentUser && !isSameUser && (
                                                    <Link href={`/profile/${msg?.userId}`} className="w-[35px] h-[35px] relative mr-[-35px]">
                                                        <Image
                                                            src={image_another_user || "/meme.jpg"}
                                                            alt=""
                                                            unoptimized
                                                            className="w-full h-full object-cover absolute rounded-full"
                                                            fill
                                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                        />
                                                    </Link>
                                                )}

                                                {/* Nội dung tin nhắn */}
                                                <div className={`flex items-center w-full gap-3 ${isCurrentUser ? "flex-row-reverse" : ""}`}>
                                                    <div className={`max-w-[70%]  ${isCurrentUser ? "" : "ml-[45px]"}`}>
                                                        {msg?.replyTo && (
                                                            <div className="text-[12px]">
                                                                {isCurrentUser ? (
                                                                    <div className="">
                                                                        <p className="flex items-center gap-1">
                                                                            <MdOutlineReply />
                                                                            Bạn đã trả lời {msg?.replyTo?.userId?._id == userId ? "chính bạn" : ":" + msg?.replyTo?.userId?.displayName}
                                                                        </p>

                                                                        {msg?.replyTo?.image && (
                                                                            <Link href={`#${msg?.replyTo._id}`} className={`mb-1 flex justify-end`}>
                                                                                <Image alt="" src={msg?.replyTo.image} width={100} height={100} className="brightness-50 rounded-lg " />
                                                                            </Link>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="">
                                                                        <p className="flex items-center gap-1">
                                                                            <MdOutlineReply />
                                                                            {msg?.userId?.displayName} đã trả lời bạn
                                                                        </p>
                                                                        {msg?.replyTo?.image && (
                                                                            <Link href={`#${msg?.replyTo._id}`} className={`mb-1 flex justify-start`}>
                                                                                <Image alt="" src={msg?.replyTo.image} width={100} height={100} className="brightness-50 rounded-lg " />
                                                                            </Link>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {msg?.replyTo?.message !== "" && (
                                                                    <Link href={`#${msg?.replyTo._id}`} className={`block ${isCurrentUser ? "w-full text-end" : ""}`}>
                                                                        <p className={` inline-block bg-gray-400 rounded-lg px-3 py-2 mb-[-10px] line-clamp-2`}>
                                                                            {msg?.replyTo?.unsend ? "Tin nhắn đã bị gỡ" : msg?.replyTo?.message}
                                                                        </p>
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        )}
                                                        {msg?.isEdit && <span className={`text-xs text-gray-600 ${isCurrentUser ? "text-end mr-5" : "text-start ml-5"} block `}>Đã chỉnh sửa</span>}
                                                        <div className={` ${isCurrentUser ? "w-full" : ""} `} id={msg?._id}>
                                                            {msg?.message && (
                                                                <p
                                                                    className={`max-w-[350px] ${isCurrentUser ? " bg-primary text-white" : "bg-gray-200 "} ${
                                                                        msg?.unsend ? "!bg-white border border-primary !text-primary text-[12px]" : ""
                                                                    } rounded-lg px-3 py-2 inline-block`}>
                                                                    {msg?.unsend ? "Tin nhắn đã bị gỡ" : msg?.message}
                                                                </p>
                                                            )}

                                                            {!msg?.unsend && msg?.reactions && msg?.reactions?.length != 0 && (
                                                                <div
                                                                    className={`mt-[-10px] relative z-2 h-[20px] flex ${isCurrentUser ? "justify-end mr-1" : "ml-1"}`}
                                                                    onClick={() => showModal(msg._id)}>
                                                                    {msg?.reactions?.map((react, index) => (
                                                                        <div className="flex bg-linear-item-2 rounded-full items-center px-[3px] cursor-pointer " key={index}>
                                                                            <Image src={react.emoji} alt="" width={15} height={15} className="" />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {!msg?.unsend && msg?.image && (
                                                            <Images src={msg?.image || "/meme.jpg"} alt="" width={200} height="auto" className="object-cover rounded-lg mt-2" />
                                                        )}
                                                    </div>
                                                    {/* <div className={`hidden group-hover:block `}>
                                                        <div className={`flex gap-2 `}>
                                                            {!msg?.unsend && (
                                                                <Tooltip placement="top" title="Trả lời">
                                                                    <label
                                                                        htmlFor="message"
                                                                        className=" h-full text-white cursor-pointer bg-gray-400 p-2 rounded-full hover:bg-secondary"
                                                                        onClick={() => setReplyingTo(msg)}>
                                                                        <MdOutlineReply />
                                                                    </label>
                                                                </Tooltip>
                                                            )}
                                                            {isCurrentUser && !msg?.unsend && (
                                                                <Tooltip placement="top" title="Thu hồi">
                                                                    <div
                                                                        className=" h-full text-white cursor-pointer bg-gray-400 p-2 rounded-full hover:bg-secondary"
                                                                        onClick={() => handleUnsend(msg?._id)}>
                                                                        {loading ? <Spin indicator={<LoadingOutlined spin />} size="default" /> : <TbSendOff />}
                                                                    </div>
                                                                </Tooltip>
                                                            )}
                                                            {!msg?.unsend && (
                                                                <Dropdown
                                                                    overlay={
                                                                        <div className="flex items-center bg-linear-item-2 rounded-full h-[40px] ">
                                                                            {reactIconList.map((icon, index) => (
                                                                                <div
                                                                                    className=" hover:bg-gray-400 rounded-full cursor-pointer w-[40px] h-[40px] flex items-center justify-center "
                                                                                    key={index}>
                                                                                    {loadingIcon ? (
                                                                                        <Spin indicator={<LoadingOutlined spin />} size="default" />
                                                                                    ) : (
                                                                                        <Image src={icon} width={25} height={25} alt="" onClick={() => handleReactIcon(msg._id, icon)} />
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    }
                                                                    trigger={["click"]}
                                                                    placement="top">
                                                                    <div className=" h-full text-white cursor-pointer bg-gray-400 p-2 rounded-full hover:bg-secondary">
                                                                        <MdOutlineInsertEmoticon />
                                                                    </div>
                                                                </Dropdown>
                                                            )}
                                                            {isCurrentUser && !msg?.unsend && (
                                                                <Tooltip placement="top" title="Chỉnh sửa">
                                                                    <div
                                                                        className=" h-full text-white cursor-pointer bg-gray-400 p-2 rounded-full hover:bg-secondary"
                                                                        onClick={() => handleEditMess(msg)}>
                                                                        <MdEdit />
                                                                    </div>
                                                                </Tooltip>
                                                            )}
                                                            <Modal
                                                                title="Chỉnh sửa tin nhắn"
                                                                open={isModalOpenEditMess === msg?._id}
                                                                onOk={handleOkEditMess}
                                                                onCancel={handleCancelEditMess}
                                                                confirmLoading={loading}>
                                                                <input
                                                                    type="text"
                                                                    placeholder="Nhập thông tin bạn muốn sửa"
                                                                    value={editMess?.message}
                                                                    onChange={(e) => setEditMess({ ...editMess, message: e.target.value })}
                                                                />
                                                            </Modal>
                                                        </div>
                                                    </div> */}
                                                    {isSameUser && <p className="text-gray-500 text-xs ">{msg?.timestamp && handleCompareDate(msg?.timestamp)}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                        <div className="h-16 flex items-center justify-between">
                            {replyingTo && (
                                <label htmlFor="message" className="block replying-to relative bg-linear-item-blue px-3 py-1 rounded-lg mb-2 text-secondary ">
                                    <div className="absolute top-2 right-3 cursor-pointer hover:text-red-500" onClick={() => setReplyingTo(null)}>
                                        <IoMdClose />
                                    </div>
                                    <h1 className="text-secondary font-bold">Bạn đang trả lời{replyingTo?.userId?._id == userId ? " chính bạn" : ": " + replyingTo?.userId.displayName}</h1>
                                    <p className="line-clamp-2">{replyingTo?.message}</p>
                                    {replyingTo?.image && <Image src={replyingTo?.image} alt="" width={120} height={100} className="object-cover rounded-lg mt-2" />}
                                </label>
                            )}
                            <div className="flex flex-1 gap-2  items-center px-2 py-2">
                                <label htmlFor="image" className="h-full flex items-center justify-center text-gray-500 hover:text-primary cursor-pointer">
                                    <IoIosImages size={20} />
                                </label>
                                <input id="image" type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e)} />

                                <div className="flex flex-col flex-1 bg-white rounded-md px-3 py-1 border border-gray-200">
                                    {imageReview && (
                                        <div className="relative w-[45px] h-[45px]">
                                            <Image src={imageReview} unoptimized alt="" className="w-full h-full rounded-lg absolute object-cover" fill></Image>
                                            <GrFormClose
                                                className="absolute z-1 top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xl cursor-pointer hover:opacity-80"
                                                onClick={() => {
                                                    setImage(null);
                                                    setImageReview(null);
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-center min-h-8">
                                        <input
                                            type="text"
                                            id="message"
                                            autoFocus
                                            className="h-full  p-0 border-none bg-transparent hover:border-none focus-visible:border-none text-gray-500"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Nhập tin nhắn bạn muốn gửi..."
                                            onPaste={handlePaste}
                                            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                        />
                                        <div className="flex items-center justify-center w-5 h-full">
                                            <Popover
                                                content={
                                                    <div>
                                                        <div className="">
                                                            <input placeholder="Tìm icon mà bạn thích" value={searchEmoji}></input>
                                                        </div>
                                                        <div className="grid grid-cols-5 gap-1 w-[300px]  mt-2">
                                                            {emojiData &&
                                                                emojiData.length > 0 && ( // Check if emoji exists and has elements
                                                                    <div className="grid grid-cols-5 gap-1 w-[300px] overflow-y-scroll h-[300px] mt-2">
                                                                        {emojiData.map((item, index) => (
                                                                            <div className="flex items-center justify-center hover:bg-gray-200 cursor-pointer" key={index}>
                                                                                <h1 className="text-xl" onClick={() => setNewMessage(newMessage + item.character)}>
                                                                                    {item.character}
                                                                                </h1>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                        </div>
                                                        {emojiData && emojiData?.length == 0 && <p className="h-[300px] flex items-center justify-center">Không tìm thấy Emojii này...</p>}
                                                    </div>
                                                }
                                                title="Chọn icon"
                                                trigger="click"
                                                open={open}
                                                onOpenChange={handleOpenChange}>
                                                <button className="text-gray-500 hover:text-primary cursor-pointer">
                                                    <MdOutlineInsertEmoticon size={20} />
                                                </button>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>
                                <button type="submit" disabled={loading} onClick={handleSendMessage} className="text-gray-500 hover:text-primary cursor-pointer !bg-transparent">
                                    {loading ? <Spin indicator={<LoadingOutlined spin />} size="default" /> : <IoSend />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
